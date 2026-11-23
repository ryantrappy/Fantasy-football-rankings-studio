import '@tanstack/react-start/server-only';
import axios from 'axios';
import type { LivePlayer, LiveLeague, ProjectionIdentity } from '../live-matchups';
import {
  combinePlayerProjection,
  espnStatIds,
  scoreProjection,
  type ProjectionRules,
} from '../combined-projections';
import { sleeperNames } from './insights/load.server';
import { sleeperLiveProjections } from './live-projections.server';
import {
  loadDynastyProcessPlayerIds,
  type DynastyProcessSnapshot,
} from './dynastyprocess-player-ids.server';

interface EspnProjectionPlayer {
  id: number;
  defaultPositionId?: number;
  stats?: {
    seasonId: number;
    scoringPeriodId: number;
    statSourceId: number;
    statSplitTypeId: number;
    stats?: Record<string, number>;
  }[];
}
const cache = new Map<
  string,
  { expires: number; value: Promise<{ player: EspnProjectionPlayer; capturedAt: string }> }
>();
async function espnPlayer(year: number, id: string) {
  const key = `${year}:${id}`,
    prior = cache.get(key);
  if (prior && prior.expires > Date.now()) return prior.value;
  const value = axios
    .get<EspnProjectionPlayer>(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/players/${id}`,
      {
        params: { view: 'kona_player_info' },
        timeout: 7000,
        maxContentLength: 2_000_000,
      },
    )
    .then(({ data }) => {
      if (String(data?.id) !== id || !Array.isArray(data.stats))
        throw new Error('Invalid ESPN player response');
      return { player: data, capturedAt: new Date().toISOString() };
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });
  if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 300_000, value });
  return value;
}
export function uniquePlayerLinks(links: Record<string, string>) {
  const reverse = new Map<string, string[]>();
  for (const [sleeperId, espnId] of Object.entries(links)) {
    if (!/^\d+$/.test(espnId)) continue;
    reverse.set(espnId, [...(reverse.get(espnId) ?? []), sleeperId]);
  }
  return new Map(
    [...reverse].filter(([, ids]) => ids.length === 1).map(([espnId, ids]) => [espnId, ids[0]]),
  );
}
type PlayerLink = { sleeperId: string; espnId: string; identity: ProjectionIdentity };
type LinkResult = PlayerLink | 'ambiguous' | undefined;

function externalLink(
  id: string,
  native: 'Sleeper' | 'ESPN',
  catalogLinks: Map<string, string>,
  claimedEspn: Set<string>,
  snapshot?: DynastyProcessSnapshot,
): LinkResult {
  if (!snapshot) return undefined;
  const primary = native === 'Sleeper' ? snapshot.bySleeper : snapshot.byEspn;
  const inverse = native === 'Sleeper' ? snapshot.byEspn : snapshot.bySleeper;
  const matches = primary.get(id);
  if (!matches?.size) return undefined;
  const other = matches.values().next().value!;
  if (matches.size !== 1 || inverse.get(other)?.size !== 1) return 'ambiguous';
  const [sleeperId, espnId] = native === 'Sleeper' ? [id, other] : [other, id];
  if (catalogLinks.has(sleeperId) || claimedEspn.has(espnId)) return 'ambiguous';
  return {
    sleeperId,
    espnId,
    identity: {
      source: 'DynastyProcess',
      revision: snapshot.revision,
      updatedAt: snapshot.updatedAt,
    },
  };
}

export async function enrichPlayerProjections(
  players: LivePlayer[],
  native: 'Sleeper' | 'ESPN',
  year: number,
  week: number,
  rulesFor: (position: string) => ProjectionRules,
): Promise<LivePlayer[]> {
  const [catalog, sleeper] = await Promise.all([
    sleeperNames().catch(() => undefined),
    sleeperLiveProjections(year, week).catch(() => undefined),
  ]);
  const catalogLinks = new Map(Object.entries(catalog?.espnIds ?? {}));
  const claimedEspn = new Set(catalogLinks.values());
  const reverse = uniquePlayerLinks(catalog?.espnIds ?? {});
  const rows = new Map<string, Record<string, number>>();
  const duplicateRows = new Set<string>();
  for (const row of sleeper ?? [])
    if (row.player_id && row.stats) {
      if (rows.has(row.player_id)) duplicateRows.add(row.player_id);
      rows.set(row.player_id, row.stats);
    }
  const eligible = new Map(
    players
      .filter((player) => ['QB', 'RB', 'WR', 'TE'].includes(player.position ?? ''))
      .map((player) => [player.id, player]),
  );
  const links = new Map<string, LinkResult>();
  const unresolved: LivePlayer[] = [];
  for (const player of eligible.values()) {
    const espnId = native === 'ESPN' ? player.id : catalogLinks.get(player.id);
    const sleeperId = espnId ? reverse.get(espnId) : undefined;
    if (espnId && sleeperId && (native === 'ESPN' || sleeperId === player.id))
      links.set(player.id, { sleeperId, espnId, identity: { source: 'Sleeper catalog' } });
    else if (native === 'Sleeper' ? catalogLinks.has(player.id) : claimedEspn.has(player.id))
      links.set(player.id, 'ambiguous');
    else unresolved.push(player);
  }
  if (catalog && unresolved.length) {
    const snapshot = await loadDynastyProcessPlayerIds();
    for (const player of unresolved)
      links.set(player.id, externalLink(player.id, native, catalogLinks, claimedEspn, snapshot));
  }
  const espnResults = new Map<string, Awaited<ReturnType<typeof espnPlayer>>>();
  // Keep existing catalog matches first under the shared request cap.
  const requested = [...links.entries()]
    .flatMap(([id, link]) => {
      const player = eligible.get(id);
      const position = player?.position ?? '';
      if (!link || link === 'ambiguous' || catalog?.positions[link.sleeperId] !== position)
        return [];
      if (native === 'Sleeper' && player?.nflSchedule?.status === 'bye') return [];
      const rules = rulesFor(position);
      if (rules.unsupported.length) return [];
      // Preserve the request budget for candidates that can actually be blended.
      if (
        rules.nativeOnly?.length &&
        (!Number.isFinite(player?.projectedPoints) ||
          duplicateRows.has(link.sleeperId) ||
          scoreProjection(rows.get(link.sleeperId), rules, position) === undefined)
      )
        return [];
      return [link.espnId];
    })
    .slice(0, 120);
  const deadline = Date.now() + 8000;
  for (let offset = 0; offset < requested.length && Date.now() < deadline; offset += 6)
    await Promise.all(
      requested.slice(offset, offset + 6).map(async (id) => {
        try {
          espnResults.set(id, await espnPlayer(year, id));
        } catch {
          /* A failed optional source cannot block league data. */
        }
      }),
    );
  return players.map((player) => {
    const link = links.get(player.id);
    if (native === 'Sleeper' && player.nflSchedule?.status === 'bye') {
      const identity =
        link && link !== 'ambiguous' && catalog?.positions[link.sleeperId] === player.position
          ? link.identity
          : undefined;
      return {
        ...combinePlayerProjection(
          { ...player, projectedPoints: 0 },
          native,
          [
            {
              provider: 'Sleeper',
              playerId: player.id,
              points: 0,
              capturedAt: player.nflSchedule.capturedAt,
              basis: 'confirmed-bye',
            },
          ],
          'Confirmed NFL bye. The NFL schedule sets the Sleeper projection to zero.',
        ),
        projectionIdentity: identity,
      };
    }
    if (!['QB', 'RB', 'WR', 'TE'].includes(player.position ?? ''))
      return combinePlayerProjection(
        player,
        native,
        [],
        'Cross-source scoring is available for QB, RB, WR and TE. Native projection retained when available.',
      );
    if (!link || link === 'ambiguous')
      return combinePlayerProjection(
        player,
        native,
        [],
        link === 'ambiguous'
          ? 'No unique ESPN/Sleeper ID mapping. Conflicting or duplicate IDs were excluded.'
          : 'No unique ESPN/Sleeper ID mapping. Native projection retained; no name matching is used.',
      );
    const { sleeperId, espnId, identity } = link;
    const position = player.position ?? '',
      rules = rulesFor(position);
    if (catalog?.positions[sleeperId] !== position)
      return combinePlayerProjection(
        player,
        native,
        [],
        'Provider position identity does not agree. Native projection retained.',
      );
    const espn = espnResults.get(espnId);
    const espnPosition = ({ 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE' } as Record<number, string>)[
      espn?.player.defaultPositionId ?? -1
    ];
    const snapshots = espn?.player.stats?.filter(
      (stat) =>
        stat.seasonId === year &&
        stat.scoringPeriodId === week &&
        stat.statSourceId === 1 &&
        stat.statSplitTypeId === 1,
    );
    const raw =
      snapshots?.length === 1 && espnPosition === position ? snapshots[0].stats : undefined;
    const normalized =
      raw &&
      Object.fromEntries(
        Object.entries(espnStatIds).flatMap(([key, id]) =>
          Object.hasOwn(raw, String(id)) ? [[key, raw[String(id)]]] : [],
        ),
      );
    const espnPoints = scoreProjection(normalized, rules, position);
    const sleeperPoints = scoreProjection(
      duplicateRows.has(sleeperId) ? undefined : rows.get(sleeperId),
      rules,
      position,
    );
    const sources: NonNullable<LivePlayer['projectionSources']> = [];
    if (espnPoints !== undefined)
      sources.push({
        provider: 'ESPN',
        playerId: espnId,
        points: espnPoints,
        capturedAt: espn!.capturedAt,
      });
    if (sleeperPoints !== undefined)
      sources.push({
        provider: 'Sleeper',
        playerId: sleeperId,
        points: sleeperPoints,
        capturedAt:
          sleeper?.find((row) => row.player_id === sleeperId)?.capturedAt ?? 'Unavailable',
      });
    const combined = combinePlayerProjection(
      player,
      native,
      sources,
      rules.unsupported.length
        ? `Cross-source scoring unsupported: ${rules.unsupported.join(', ')}. Native projection retained.`
        : 'Matching weekly raw projection is missing, invalid or unavailable. Native projection retained when available.',
      rules.unsupported.length ? undefined : rules.nativeOnly,
    );
    return {
      ...combined,
      projectionIdentity: identity,
      projectionNote:
        identity.source === 'DynastyProcess'
          ? `${combined.projectionNote} Player IDs matched via DynastyProcess (snapshot ${identity.updatedAt.slice(0, 10)}).`
          : combined.projectionNote,
    };
  });
}
export async function enrichLiveProjections(
  live: LiveLeague,
  rulesFor: (position: string) => ProjectionRules,
) {
  const teams = live.matchups.flatMap((matchup) => [
    matchup.home,
    ...(matchup.away ? [matchup.away] : []),
  ]);
  const enriched = await enrichPlayerProjections(
    teams.flatMap((team) => team.players),
    live.provider,
    live.season,
    live.week,
    rulesFor,
  );
  const byId = new Map(enriched.map((player) => [player.id, player]));
  for (const team of teams)
    for (const player of team.players) {
      const projection = byId.get(player.id)!;
      Object.assign(player, {
        projectedPoints: projection.projectedPoints,
        projectionSources: projection.projectionSources,
        projectionIdentity: projection.projectionIdentity,
        projectionMethod: projection.projectionMethod,
        projectionSpread: projection.projectionSpread,
        projectionNote: projection.projectionNote,
      });
    }
  return live;
}
