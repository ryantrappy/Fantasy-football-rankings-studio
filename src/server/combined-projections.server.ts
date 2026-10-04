import '@tanstack/react-start/server-only';
import axios from 'axios';
import type { LivePlayer, LiveLeague } from '../live-matchups';
import {
  combinePlayerProjection,
  espnStatIds,
  scoreProjection,
  type ProjectionRules,
} from '../combined-projections';
import { sleeperNames } from './insights/load.server';
import { sleeperLiveProjections } from './live-projections.server';

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
  const links = catalog?.espnIds ?? {},
    reverse = uniquePlayerLinks(links);
  const rows = new Map<string, Record<string, number>>();
  const duplicateRows = new Set<string>();
  for (const row of sleeper ?? [])
    if (row.player_id && row.stats) {
      if (rows.has(row.player_id)) duplicateRows.add(row.player_id);
      rows.set(row.player_id, row.stats);
    }
  const eligible = [
    ...new Map(
      players
        .filter((player) => ['QB', 'RB', 'WR', 'TE'].includes(player.position ?? ''))
        .map((player) => [player.id, player]),
    ).values(),
  ];
  const espnResults = new Map<string, Awaited<ReturnType<typeof espnPlayer>>>();
  // Bound each league request; excess players retain the native estimate.
  const requested = eligible
    .flatMap((player) => {
      const espnId = native === 'ESPN' ? player.id : links[player.id];
      const sleeperId = espnId ? reverse.get(espnId) : undefined;
      return espnId && sleeperId && (native === 'ESPN' || sleeperId === player.id) ? [espnId] : [];
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
    const espnId = native === 'ESPN' ? player.id : links[player.id];
    const sleeperId = espnId ? reverse.get(espnId) : undefined;
    if (!sleeperId || (native === 'Sleeper' && sleeperId !== player.id))
      return combinePlayerProjection(
        player,
        native,
        [],
        'No unique ESPN/Sleeper ID mapping. Native projection retained; no name matching is used.',
      );
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
          Number.isFinite(raw[String(id)]) ? [[key, raw[String(id)]]] : [],
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
    return combinePlayerProjection(
      player,
      native,
      sources,
      rules.unsupported.length
        ? `Cross-source scoring unsupported: ${rules.unsupported.join(', ')}. Native projection retained.`
        : 'Matching weekly raw projection is missing, invalid or unavailable. Native projection retained when available.',
    );
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
        projectionMethod: projection.projectionMethod,
        projectionSpread: projection.projectionSpread,
        projectionNote: projection.projectionNote,
      });
    }
  return live;
}
