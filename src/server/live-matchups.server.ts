import '@tanstack/react-start/server-only';
import axios from 'axios';
import type { League } from './interfaces/league.interface';
import {
  sleeperLineupSlots,
  espnLineupSlot,
  type LiveLeague,
  type LivePlayer,
  type LiveTeam,
} from '../live-matchups';
import SleeperProvider from './providers/sleeper.provider';
import EspnProvider, { type EspnAccess } from './providers/espn.provider';
import { nflRemaining, sleeperLiveProjections } from './live-projections.server';
import { sleeperNames } from './insights/load.server';
import { enrichLiveProjections } from './combined-projections.server';
import {
  sleeperProjectionRules,
  espnProjectionRules,
  type EspnScoringItem,
} from '../combined-projections';

type SleeperRow = {
  matchup_id: number | null;
  roster_id: number;
  points?: number;
  custom_points?: number | null;
  starters?: string[];
  players?: string[];
  players_points?: Record<string, number>;
  starters_points?: number[];
};

type EspnEntry = {
  playerId?: number;
  lineupSlotId: number;
  playerPoolEntry?: {
    player?: {
      id?: number;
      fullName?: string;
      defaultPositionId?: number;
      eligibleSlots?: number[];
      injuryStatus?: string;
      proTeamId?: number;
      stats?: {
        seasonId: number;
        scoringPeriodId: number;
        statSourceId: number;
        statSplitTypeId: number;
        appliedTotal: number;
      }[];
    };
  };
};
type EspnSide = {
  teamId: number;
  totalPoints?: number;
  totalPointsLive?: number;
  rosterForCurrentScoringPeriod?: { entries?: EspnEntry[] };
};
let catalogPromise: ReturnType<typeof sleeperNames> | undefined;
function playerCatalog() {
  if (!catalogPromise)
    catalogPromise = sleeperNames().finally(() => {
      catalogPromise = undefined;
    });
  return catalogPromise;
}

export async function loadLiveLeague(
  league: League,
  access: EspnAccess = 'public',
): Promise<LiveLeague> {
  const result: LiveLeague = {
    leagueId: league.leagueId,
    leagueName: league.leagueName || `League ${league.leagueId}`,
    provider: league.leagueType === 1 ? 'ESPN' : 'Sleeper',
    season: league.seasonId,
    week: 1,
    matchups: [],
    capturedAt: new Date().toISOString(),
  };
  const providerId = league.providerLeagueId ?? league.leagueId;
  if (league.leagueType === 0) {
    const provider = new SleeperProvider();
    const [state, season, teams] = await Promise.all([
      axios.get<{ season: string; leg: number; season_type: string }>(
        'https://api.sleeper.app/v1/state/nfl',
        { timeout: 10000 },
      ),
      provider.resolveSeason(providerId, league.seasonId),
      provider.getTeams(league, league.seasonId, 1),
    ]);
    result.week =
      Number(state.data.season) === league.seasonId && state.data.season_type !== 'pre'
        ? Math.max(1, Math.min(18, state.data.leg))
        : Math.max(1, Math.min(18, season.settings?.last_scored_leg ?? 1));
    const [rows, rosters, catalog, projections, remaining] = await Promise.all([
      provider.get<SleeperRow[]>(`${season.league_id}/matchups/${result.week}`),
      provider.get<
        { roster_id: number; players?: string[]; reserve?: string[]; taxi?: string[] }[]
      >(`${season.league_id}/rosters`),
      playerCatalog().catch(() => ({ names: {}, positions: {}, availability: {}, teams: {} })),
      sleeperLiveProjections(league.seasonId, result.week).catch(
        (): Awaited<ReturnType<typeof sleeperLiveProjections>> => [],
      ),
      nflRemaining(league.seasonId, result.week).catch(() => undefined),
    ]);
    result.lineupSlots = (season.roster_positions ?? []).filter(
      (slot) => !['BN', 'BENCH', 'IR', 'TAXI'].includes(slot),
    );
    const projected = new Map(
      projections
        .filter((row) => row.player_id && row.stats && Object.keys(row.stats).length)
        .map((row) => [
          row.player_id!,
          Object.entries(row.stats!).reduce(
            (sum, [stat, value]) =>
              sum + (Number.isFinite(value) ? value * (season.scoring_settings?.[stat] || 0) : 0),
            0,
          ),
        ]),
    );
    const byId = new Map(teams.map((team) => [team.teamId, team]));
    const reserves = new Set(
      rosters.flatMap((roster) => [...(roster.reserve ?? []), ...(roster.taxi ?? [])]),
    );
    const owned = new Map(rosters.map((roster) => [roster.roster_id, roster.players || []]));
    const groups = new Map<string, SleeperRow[]>();
    for (const row of rows) {
      const id = row.matchup_id == null ? `bye-${row.roster_id}` : String(row.matchup_id);
      groups.set(id, [...(groups.get(id) || []), row]);
    }
    const team = (row: SleeperRow): LiveTeam => {
      const starters = new Set((row.starters || []).filter((id) => id !== '0'));
      const slots = sleeperLineupSlots(row.starters || [], season.roster_positions || []);
      const ids = [
        ...new Set([
          ...(row.starters || []),
          ...(row.players || []),
          ...(owned.get(row.roster_id) || []),
        ]),
      ].filter((id) => id !== '0');
      return {
        teamId: String(row.roster_id),
        name: byId.get(String(row.roster_id))?.teamName || `Team ${row.roster_id}`,
        score: row.custom_points ?? row.points ?? null,
        players: ids.map((id): LivePlayer => ({
          id,
          name: catalog.names[id] || id,
          position: catalog.positions[id],
          availability: catalog.availability[id],
          bye: remaining && catalog.teams[id] ? !remaining.has(catalog.teams[id]) : undefined,
          locked:
            remaining && catalog.teams[id] && Number.isFinite(remaining.get(catalog.teams[id]))
              ? remaining.get(catalog.teams[id])! < 1
              : undefined,
          lineupSlot: slots.get(id),
          projectedPoints: projected.get(id),
          remainingFraction:
            remaining && catalog.teams[id] ? remaining.get(catalog.teams[id]) : undefined,
          points:
            row.players_points?.[id] ??
            (starters.has(id)
              ? row.starters_points?.[(row.starters || []).indexOf(id)]
              : undefined) ??
            null,
          starter: starters.has(id),
          reserve: reserves.has(id),
          owned: (owned.get(row.roster_id) ?? []).includes(id) || reserves.has(id),
        })),
      };
    };
    result.matchups = [...groups].map(([id, [home, away]]) => ({
      id,
      home: team(home),
      away: away ? team(away) : null,
    }));
    return enrichLiveProjections(result, () =>
      sleeperProjectionRules(season.scoring_settings ?? {}),
    );
  }

  const provider = new EspnProvider(access);
  type EspnLiveData = {
    id: number;
    status?: { latestScoringPeriod?: number; finalScoringPeriod?: number };
    settings?: {
      scoringSettings?: { scoringItems?: EspnScoringItem[] };
      rosterSettings?: { lineupSlotCounts?: Record<string, number> };
      scheduleSettings?: { matchupPeriods?: Record<string, number[]> };
    };
    teams?: { id: number; name?: string; location?: string; nickname?: string }[];
    schedule?: { id: number; matchupPeriodId: number; home?: EspnSide; away?: EspnSide }[];
  };
  const status = await provider.get<EspnLiveData>(providerId, league.seasonId, ['mStatus']);
  result.week = Math.max(1, Math.min(18, status.status?.latestScoringPeriod ?? 1));
  const data = await provider.get<EspnLiveData>(
    providerId,
    league.seasonId,
    ['mTeam', 'mSettings', 'mMatchupScore', 'mBoxscore'],
    result.week,
  );
  result.lineupSlots = Object.entries(
    data.settings?.rosterSettings?.lineupSlotCounts ?? {},
  ).flatMap(([id, count]) =>
    [20, 21].includes(Number(id))
      ? []
      : Array.from({ length: count }, () => espnLineupSlot(Number(id)) ?? `Unsupported slot ${id}`),
  );
  const remaining = await nflRemaining(league.seasonId, result.week).catch(() => undefined);
  const matchupPeriod = Number(
    Object.entries(data.settings?.scheduleSettings?.matchupPeriods || {}).find(([, weeks]) =>
      weeks.includes(result.week),
    )?.[0] ?? result.week,
  );
  const names = new Map(
    (data.teams || []).map((team) => [
      team.id,
      team.name || [team.location, team.nickname].filter(Boolean).join(' ') || `Team ${team.id}`,
    ]),
  );
  const side = (value: EspnSide): LiveTeam => ({
    teamId: String(value.teamId),
    name: names.get(value.teamId) || `Team ${value.teamId}`,
    score: value.totalPointsLive ?? value.totalPoints ?? null,
    players: (value.rosterForCurrentScoringPeriod?.entries || []).map((entry): LivePlayer => {
      const player = entry.playerPoolEntry?.player;
      const points = player?.stats?.find(
        (stat) =>
          stat.seasonId === league.seasonId &&
          stat.scoringPeriodId === result.week &&
          stat.statSourceId === 0 &&
          stat.statSplitTypeId === 1,
      )?.appliedTotal;
      return {
        id: String(entry.playerId ?? player?.id ?? ''),
        name: player?.fullName || `Player ${entry.playerId ?? player?.id ?? ''}`,
        position: (
          { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'DST' } as Record<number, string>
        )[player?.defaultPositionId ?? -1],
        lineupSlot: espnLineupSlot(entry.lineupSlotId),
        eligibleSlots: player?.eligibleSlots?.flatMap((slot) => espnLineupSlot(slot) ?? []),
        availability: player?.injuryStatus,
        reserve: entry.lineupSlotId === 21,
        owned: true,
        bye: remaining && player?.proTeamId ? !remaining.has(String(player.proTeamId)) : undefined,
        locked:
          remaining && player?.proTeamId && Number.isFinite(remaining.get(String(player.proTeamId)))
            ? remaining.get(String(player.proTeamId))! < 1
            : undefined,
        projectedPoints: player?.stats?.find(
          (stat) =>
            stat.seasonId === league.seasonId &&
            stat.scoringPeriodId === result.week &&
            stat.statSourceId === 1 &&
            stat.statSplitTypeId === 1,
        )?.appliedTotal,
        remainingFraction:
          remaining && player?.proTeamId ? remaining.get(String(player.proTeamId)) : undefined,
        points: points ?? null,
        starter: ![20, 21].includes(entry.lineupSlotId),
      };
    }),
  });
  result.matchups = (data.schedule || [])
    .filter((matchup) => matchup.matchupPeriodId === matchupPeriod && matchup.home)
    .map((matchup) => ({
      id: String(matchup.id),
      home: side(matchup.home!),
      away: matchup.away ? side(matchup.away) : null,
    }));
  // ESPN sometimes leaves totalPoints at zero until the scoring period closes.
  const singleWeek =
    (data.settings?.scheduleSettings?.matchupPeriods?.[String(matchupPeriod)] || [result.week])
      .length === 1;
  for (const matchup of result.matchups) {
    for (const team of [matchup.home, matchup.away].filter((value): value is LiveTeam => !!value)) {
      const starters = team.players.filter((player) => player.starter);
      if (
        singleWeek &&
        team.score === 0 &&
        starters.length &&
        starters.every((player) => player.points != null || player.remainingFraction === 1)
      )
        team.score = starters.reduce((sum, player) => sum + (player.points ?? 0), 0);
      // Current-week projections cannot describe a multiweek matchup in full.
      if (!singleWeek) {
        result.lineupSlots = undefined;
        for (const player of team.players) player.remainingFraction = undefined;
      }
    }
  }
  return enrichLiveProjections(result, (position) =>
    espnProjectionRules(data.settings?.scoringSettings?.scoringItems, position),
  );
}
