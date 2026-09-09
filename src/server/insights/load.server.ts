import { sleeperResults, espnResults, type BracketMatch, type EspnResultsData } from './results';
import { logServerError } from '../logging.server';
import { defaultSeason } from '../../util/rankings';
import '@tanstack/react-start/server-only';
import axios from 'axios';
import type { InsightsSource, PlayerMove, ScoreWeek } from '../../insights';
import type { League } from '../interfaces/league.interface';
import SleeperProvider from '../providers/sleeper.provider';
import EspnProvider, { type EspnAccess } from '../providers/espn.provider';
import { calculateInsights } from './calculate';

async function mapWeeks<T>(weeks: number[], read: (week: number) => Promise<T>): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < weeks.length; i += 3)
    results.push(...(await Promise.all(weeks.slice(i, i + 3).map(read))));
  return results;
}
const weeksThrough = (last: number) => Array.from({ length: Math.max(0, last) }, (_, i) => i + 1);
let namesCache:
  | { expires: number; names: Record<string, string>; positions: Record<string, string> }
  | undefined;
async function sleeperNames() {
  if (namesCache && namesCache.expires > Date.now()) return namesCache;
  const { data } = await axios.get<
    Record<
      string,
      { full_name?: string; first_name?: string; last_name?: string; position?: string }
    >
  >('https://api.sleeper.app/v1/players/nfl', { timeout: 20000 });
  const names = Object.fromEntries(
    Object.entries(data).map(([id, p]) => [
      id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || id,
    ]),
  );
  const positions = Object.fromEntries(
    Object.entries(data)
      .filter(([, p]) => !!p.position)
      .map(([id, p]) => [id, p.position === 'DEF' ? 'DST' : p.position!]),
  );
  namesCache = { expires: Date.now() + 86400000, names, positions };
  return namesCache;
}
interface SleeperScore {
  matchup_id?: number | null;
  roster_id: number;
  points: number;
  custom_points?: number | null;
  starters?: string[];
  players_points?: Record<string, number>;
  starters_points?: number[];
}
interface SleeperTransaction {
  transaction_id: string;
  status: string;
  type: string;
  leg: number;
  status_updated: number;
  adds?: Record<string, number> | null;
  drops?: Record<string, number> | null;
  draft_picks?: unknown[];
}
async function loadSleeper(league: League, year: number): Promise<InsightsSource> {
  const provider = new SleeperProvider();
  const season = await provider.resolveSeason(league.leagueId, year);
  const [{ data: state }, teams] = await Promise.all([
    axios.get<{ season: string; leg: number; season_type: string }>(
      'https://api.sleeper.app/v1/state/nfl',
      { timeout: 10000 },
    ),
    provider.getTeams(league, year, 1),
  ]);
  const nflCompletedWeek =
    year < Number(state.season)
      ? 18
      : year > Number(state.season) || state.season_type === 'pre'
        ? 0
        : state.season_type === 'post'
          ? 18
          : Math.max(0, Math.min(18, state.leg - 1));
  const completedWeek = Math.min(
    nflCompletedWeek,
    season.settings?.last_scored_leg ?? nflCompletedWeek,
  );
  const [weekly, transactions] = await Promise.all([
    mapWeeks(
      weeksThrough(completedWeek).filter((week) => week >= (season.settings?.start_week ?? 1)),
      async (week) => ({
        week,
        rows: await provider.get<SleeperScore[]>(`${season.league_id}/matchups/${week}`),
      }),
    ),
    mapWeeks(weeksThrough(Math.min(18, completedWeek + 1)), (week) =>
      provider.get<SleeperTransaction[]>(`${season.league_id}/transactions/${week}`),
    ),
  ]);
  const scores: ScoreWeek[] = weekly.flatMap(({ week, rows }) =>
    rows.map((r) => ({
      teamId: String(r.roster_id),
      opponentTeamId:
        (!season.settings?.playoff_week_start || week < season.settings.playoff_week_start) &&
        r.matchup_id != null &&
        rows.filter((p) => p.matchup_id === r.matchup_id).length === 2
          ? String(
              rows.find((p) => p.matchup_id === r.matchup_id && p.roster_id !== r.roster_id)!
                .roster_id,
            )
          : null,
      week,
      actual: r.custom_points ?? r.points,
      projected: null,
      players: Object.entries(r.players_points || {})
        .filter(([, points]) => Number.isFinite(points))
        .map(([playerId, points]) => ({ playerId, points })),
      lineupAvailable:
        Array.isArray(r.starters) &&
        r.starters
          .filter((id) => id !== '0')
          .every((id) =>
            Number.isFinite(r.players_points?.[id] ?? r.starters_points?.[r.starters!.indexOf(id)]),
          ),
      starters: (r.starters || [])
        .filter((id) => id !== '0')
        .map((playerId) => ({
          playerId,
          points:
            r.players_points?.[playerId] ??
            r.starters_points?.[(r.starters || []).indexOf(playerId)] ??
            0,
        })),
    })),
  );
  const unique = [
    ...new Map(
      transactions
        .flat()
        .filter((t) => t.status === 'complete')
        .map((t) => [t.transaction_id, t]),
    ).values(),
  ];
  const moves: PlayerMove[] = unique.flatMap((t) => {
    const adds = Object.entries(t.adds || {}).map(([playerId, to]) => ({
      id: t.transaction_id,
      week: t.leg,
      timestamp: t.status_updated,
      playerId,
      to: String(to),
      from: t.drops?.[playerId] == null ? null : String(t.drops[playerId]),
      type: t.type === 'trade' ? ('trade' as const) : ('pickup' as const),
    }));
    const drops = Object.entries(t.drops || {})
      .filter(([id]) => !t.adds?.[id])
      .map(([playerId, from]) => ({
        id: t.transaction_id,
        week: t.leg,
        timestamp: t.status_updated,
        playerId,
        from: String(from),
        to: null,
        type: 'drop' as const,
      }));
    return [...adds, ...drops];
  });
  let results: InsightsSource['results'];
  const resultNotes: string[] = [];
  if (
    season.status === 'complete' ||
    (season.settings?.playoff_week_start && completedWeek >= season.settings.playoff_week_start)
  ) {
    const brackets = await Promise.allSettled([
      provider.get<BracketMatch[]>(`${season.league_id}/winners_bracket`),
      provider.get<BracketMatch[]>(`${season.league_id}/losers_bracket`),
    ]);
    for (const result of brackets)
      if (result.status === 'rejected') {
        logServerError('insights.sleeperResults', result.reason, 502);
        resultNotes.push(
          'Some playoff/finish data could not be loaded. Missing results are excluded from achievement totals.',
        );
      }
    results = sleeperResults(
      teams.map((t) => t.teamId),
      season.settings?.playoff_teams,
      season.status === 'complete',
      brackets[0].status === 'fulfilled' && Array.isArray(brackets[0].value)
        ? brackets[0].value
        : [],
      brackets[1].status === 'fulfilled' && Array.isArray(brackets[1].value)
        ? brackets[1].value
        : [],
    );
  }
  const catalog = moves.length ? await sleeperNames() : { names: {}, positions: {} };
  return {
    playoffSettings:
      season.settings?.playoff_week_start && season.settings?.playoff_teams
        ? {
            regularSeasonEnd: season.settings.playoff_week_start - 1,
            playoffTeams: season.settings.playoff_teams,
          }
        : undefined,
    completedWeek,
    teams,
    scores,
    moves,
    results,
    playerNames: catalog.names,
    playerPositions: catalog.positions,
    draftPickTradeIds: unique
      .filter((t) => t.type === 'trade' && t.draft_picks?.length)
      .map((t) => t.transaction_id),
    draftPickTrades: unique.filter((t) => t.type === 'trade' && t.draft_picks?.length).length,
    notes: [
      ...resultNotes,
      'Sleeper’s documented API does not provide historical lineup projections. Scoring trends show actual points and league-median results instead. Positional comparisons use Sleeper’s current primary-position catalog.',
    ],
  };
}
interface EspnEntry {
  lineupSlotId: number;
  playerId?: number;
  playerPoolEntry?: {
    player?: {
      id?: number;
      fullName?: string;
      defaultPositionId?: number;
      stats?: {
        scoringPeriodId: number;
        seasonId: number;
        statSourceId: number;
        statSplitTypeId: number;
        appliedTotal: number;
      }[];
    };
  };
}
interface EspnSide {
  teamId: number;
  pointsByScoringPeriod?: Record<string, number>;
  rosterForCurrentScoringPeriod?: { entries: EspnEntry[] };
}
interface EspnTransaction {
  id: string;
  type: string;
  status: string;
  scoringPeriodId: number;
  processDate?: number;
  proposedDate: number;
  items?: { type: string; playerId: number; fromTeamId: number; toTeamId: number }[];
}
interface EspnSnapshot extends EspnResultsData {
  id: number;
  status?: { latestScoringPeriod: number; finalScoringPeriod: number };
  schedule?: { home?: EspnSide; away?: EspnSide; playoffTierType?: string }[];
  transactions?: EspnTransaction[];
}
async function loadEspn(league: League, year: number, access: EspnAccess): Promise<InsightsSource> {
  const provider = new EspnProvider(access);
  const [meta, teams] = await Promise.all([
    provider.get<EspnSnapshot>(league.leagueId, year, ['mSettings', 'mTeam', 'mMatchup']),
    provider.getTeams(league, year, 1),
  ]);
  if (!meta.status) throw new Error('ESPN season status unavailable');
  const completedWeek = Math.max(
    0,
    Math.min(18, meta.status.finalScoringPeriod, meta.status.latestScoringPeriod - 1),
  );
  const [weekly, transactions] = await Promise.all([
    mapWeeks(weeksThrough(completedWeek), async (week) => ({
      week,
      data: await provider.get<EspnSnapshot>(
        league.leagueId,
        year,
        ['mMatchupScore', 'mBoxscore'],
        week,
      ),
    })),
    mapWeeks(weeksThrough(Math.min(18, completedWeek + 1)), (week) =>
      provider.get<EspnSnapshot>(league.leagueId, year, ['mTransactions2'], week),
    ),
  ]);
  const playerNames: Record<string, string> = {};
  const playerPositions: Record<string, string> = {};
  const scores: ScoreWeek[] = [];
  for (const { week, data } of weekly) {
    const opponents = new Map<number, string>();
    for (const matchup of data.schedule || []) {
      const { home, away } = matchup;
      if (
        matchup.playoffTierType === 'NONE' &&
        home?.pointsByScoringPeriod?.[week] != null &&
        away?.pointsByScoringPeriod?.[week] != null
      ) {
        opponents.set(home.teamId, String(away.teamId));
        opponents.set(away.teamId, String(home.teamId));
      }
    }
    const sides = new Map<number, EspnSide>();
    for (const matchup of data.schedule || [])
      for (const side of [matchup.home, matchup.away])
        if (side?.pointsByScoringPeriod?.[week] != null) sides.set(side.teamId, side);
    for (const side of sides.values()) {
      const entries = side.rosterForCurrentScoringPeriod?.entries || [];
      for (const entry of entries) {
        const p = entry.playerPoolEntry?.player;
        if (p?.id && p.fullName) playerNames[String(p.id)] = p.fullName;
        const position = (
          { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'DST' } as Record<number, string>
        )[p?.defaultPositionId ?? -1];
        if (p?.id && position) playerPositions[String(p.id)] = position;
      }
      const lineup = entries.filter((e) => ![20, 21].includes(e.lineupSlotId));
      const stat = (entry: EspnEntry, source: number) =>
        entry.playerPoolEntry?.player?.stats?.find(
          (s) =>
            s.seasonId === year &&
            s.scoringPeriodId === week &&
            s.statSourceId === source &&
            s.statSplitTypeId === 1,
        )?.appliedTotal;
      const projections = lineup.map((e) => stat(e, 1));
      scores.push({
        teamId: String(side.teamId),
        opponentTeamId: opponents.get(side.teamId) ?? null,
        week,
        actual: side.pointsByScoringPeriod![week],
        lineupAvailable:
          !!side.rosterForCurrentScoringPeriod &&
          lineup.every((e) => e.playerId != null && Number.isFinite(stat(e, 0))),
        players: entries
          .filter((e) => e.playerId != null && Number.isFinite(stat(e, 0)))
          .map((e) => ({ playerId: String(e.playerId), points: stat(e, 0)! })),
        projected:
          lineup.length && projections.every((p) => p != null)
            ? projections.reduce<number>((sum, p) => sum + p!, 0)
            : null,
        starters: lineup
          .filter((e) => e.playerId != null && stat(e, 0) != null)
          .map((e) => ({ playerId: String(e.playerId), points: stat(e, 0)! })),
      });
    }
  }
  const txs = [
    ...new Map(
      transactions
        .flatMap((d) => d.transactions || [])
        .filter((t) => t.status === 'EXECUTED')
        .map((t) => [t.id, t]),
    ).values(),
  ];
  const moves: PlayerMove[] = txs.flatMap((t) =>
    (t.items || [])
      .filter(
        (i) =>
          ['ADD', 'DROP', 'TRADE'].includes(i.type) ||
          (i.fromTeamId > 0 && i.toTeamId > 0 && i.fromTeamId !== i.toTeamId),
      )
      .map((i) => ({
        id: t.id,
        week: t.scoringPeriodId,
        timestamp: t.processDate || t.proposedDate,
        playerId: String(i.playerId),
        from: i.fromTeamId > 0 ? String(i.fromTeamId) : null,
        to: i.toTeamId > 0 ? String(i.toTeamId) : null,
        type:
          i.fromTeamId > 0 && i.toTeamId > 0 && i.fromTeamId !== i.toTeamId
            ? 'trade'
            : i.type === 'ADD'
              ? 'pickup'
              : 'drop',
      })),
  );
  return {
    playoffSettings:
      meta.settings?.scheduleSettings?.matchupPeriodCount &&
      meta.settings.scheduleSettings.playoffTeamCount &&
      meta.settings.scheduleSettings.matchupPeriodLength === 1
        ? {
            regularSeasonEnd: meta.settings.scheduleSettings.matchupPeriodCount,
            playoffTeams: meta.settings.scheduleSettings.playoffTeamCount,
          }
        : undefined,
    completedWeek,
    teams,
    scores,
    moves,
    results: espnResults(
      teams.map((t) => t.teamId),
      meta,
      year < defaultSeason() || meta.status.latestScoringPeriod > meta.status.finalScoringPeriod,
      (meta.schedule || []).some(
        (m) =>
          m.playoffTierType === 'WINNERS_BRACKET' &&
          [m.home, m.away].some((side) =>
            Object.keys(side?.pointsByScoringPeriod || {}).some((w) => Number(w) <= completedWeek),
          ),
      ),
    ),
    playerNames,
    playerPositions,
    draftPickTrades: 0,
    notes: [
      'ESPN projections sum the saved projections for that week’s starting lineup, excluding bench and IR. They are provider estimates, not guaranteed kickoff snapshots.',
    ],
  };
}
export async function loadInsights(league: League, year: number, access: EspnAccess = 'public') {
  const source = await loadInsightsSource(league, year, access);
  return { ...calculateInsights(source), playoffSettings: source.playoffSettings };
}
export async function loadInsightsSource(
  league: League,
  year: number,
  access: EspnAccess = 'public',
) {
  return league.leagueType === 0 ? loadSleeper(league, year) : loadEspn(league, year, access);
}
