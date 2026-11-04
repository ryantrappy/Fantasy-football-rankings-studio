import type { ScoreWeek, SeasonInsights } from './insights';

export const MATCHUP_REPLAYS = 100;
const round = (n: number) => Math.round(n * 100) / 100;
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
type Moments = { n: number; mean: number; m2: number };
function observe(map: Map<string, Moments>, key: string, value: number) {
  const m = map.get(key) ?? { n: 0, mean: 0, m2: 0 };
  m.n++;
  const delta = value - m.mean;
  m.mean += delta / m.n;
  m.m2 += delta * (value - m.mean);
  map.set(key, m);
}

export interface PlayerPerformance {
  teamId: string;
  week: number;
  playerId: string;
  position?: string;
  actual: number | null;
  projected: number | null;
  difference: number | null;
  variance: number | null;
  samples: number;
  basis: 'player' | 'position' | null;
}
interface TeamWeek {
  teamId: string;
  actual: number;
  projected: number | null;
  difference: number | null;
  players: PlayerPerformance[];
  reason?: string;
}
export interface ReplayedMatchup {
  id: string;
  week: number;
  weeks: number[];
  home: TeamWeek;
  away: TeamWeek;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  homeExpectedWin: number | null;
  homeActualWin: number;
  reason?: string;
}

// Independent, repeatable streams keep other matchups, sorting and future weeks
// from changing a historical replay. The model does not estimate correlations.
function normalStream(key: string) {
  let seed = 2166136261;
  for (const char of key) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const uniform = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
}

export function projectionLuck(data: SeasonInsights) {
  const scores = data.scores
    .filter((s) => s.week >= (data.reportingStartWeek ?? 1) && s.week <= data.completedWeek)
    .sort((a, b) => a.week - b.week || a.teamId.localeCompare(b.teamId));
  const key = (s: Pick<ScoreWeek, 'week' | 'teamId'>) => `${s.week}:${s.teamId}`;
  const counts = new Map<string, number>();
  for (const score of scores) counts.set(key(score), (counts.get(key(score)) ?? 0) + 1);
  const unique = scores.filter((score) => counts.get(key(score)) === 1);
  const byKey = new Map(unique.map((s) => [key(s), s]));
  const playerHistory = new Map<string, Moments>();
  const positionHistory = new Map<string, Moments>();
  const leagueHistory = new Map<string, Moments>();
  const models = new Map<string, TeamWeek>();
  const players: PlayerPerformance[] = [];
  const weeks = [...new Set(unique.map((s) => s.week))];
  const varianceFor = (own: Moments | undefined, group: Moments | undefined, all: Moments | undefined) => {
    const history =
      own && own.n >= 2
        ? own
        : group && group.n >= 2
          ? group
          : all && all.n >= 1
            ? all
            : undefined;
    if (!history) return { variance: null as number | null, samples: own?.n ?? group?.n ?? all?.n ?? 0, basis: null as const };
    return {
      variance: history.n > 1 ? Math.max(0, history.m2 / (history.n - 1)) : 0,
      samples: history.n,
      basis: history === own ? ('player' as const) : history === group ? ('position' as const) : null,
    };
  };
  for (const week of weeks) {
    const weekly = unique.filter((s) => s.week === week);
    // Build every model before observing this week's outcomes: even another
    // team's game from the same week cannot influence a player's variance.
    for (const score of weekly) {
      const lineup = [...score.starters].sort((a, b) => a.playerId.localeCompare(b.playerId));
      const rows = lineup.map((p): PlayerPerformance => {
        const own = playerHistory.get(p.playerId);
        const position = p.position ?? data.playerIdentities?.[p.playerId]?.position;
        const group = position ? positionHistory.get(position) : undefined;
        const all = leagueHistory.get('__league__');
        const history = varianceFor(own, group, all);
        return {
          teamId: score.teamId,
          week,
          playerId: p.playerId,
          position,
          actual: finite(p.points) ? p.points : null,
          projected: finite(p.projected) ? p.projected : null,
          difference: finite(p.projected) && finite(p.points) ? p.points - p.projected : null,
          variance: history.variance,
          samples: history.samples,
          basis: history.basis,
        };
      });
      // Ambiguous duplicate player rows cannot supply trustworthy player evidence.
      players.push(
        ...rows.filter((p) => rows.filter((other) => other.playerId === p.playerId).length === 1),
      );
      const complete =
        score.lineupAvailable !== false &&
        rows.length > 0 &&
        new Set(rows.map((p) => p.playerId)).size === rows.length &&
        rows.every((p) => finite(p.actual) && p.projected !== null);
      const projected = complete ? rows.reduce((sum, p) => sum + p.projected!, 0) : null;
      const reconciles =
        Math.abs(rows.reduce((sum, p) => sum + (p.actual ?? 0), 0) - score.actual) < 0.02;
      const reason = !complete
        ? 'Incomplete starter scores or weekly player projections.'
        : !reconciles
          ? 'Starter points do not reconcile with the recorded team score (possible override).'
          : undefined;
      models.set(key(score), {
        teamId: score.teamId,
        actual: score.actual,
        projected,
        difference: projected === null ? null : score.actual - projected,
        players: rows,
        reason,
      });
    }
    for (const score of weekly) {
      if (
        score.lineupAvailable === false ||
        new Set(score.starters.map((p) => p.playerId)).size !== score.starters.length
      )
        continue;
      for (const p of [...score.starters].sort((a, b) => a.playerId.localeCompare(b.playerId))) {
        if (!finite(p.projected) || !finite(p.points)) continue;
        const residual = p.points - p.projected;
        observe(playerHistory, p.playerId, residual);
        observe(leagueHistory, '__league__', residual);
        const position = p.position ?? data.playerIdentities?.[p.playerId]?.position;
        if (position) observe(positionHistory, position, residual);
      }
    }
  }
  const matchups: ReplayedMatchup[] = [];
  const seenGames = new Set<string>();
  const matchedTeamWeeks = new Set<string>();
  const addGame = (homeId: string, awayId: string, weeks: number[]) => {
    const sortedWeeks = [...weeks].sort((a, b) => a - b);
    if (
      !sortedWeeks.length ||
      new Set(sortedWeeks).size !== sortedWeeks.length ||
      sortedWeeks.some((w) => w < (data.reportingStartWeek ?? 1) || w > data.completedWeek) ||
      homeId === awayId
    )
      return;
    const [a, b] = [homeId, awayId].sort();
    const id = `${sortedWeeks.join(',')}:${a}:${b}`;
    if (seenGames.has(id)) return;
    seenGames.add(id);
    const combine = (teamId: string): TeamWeek => {
      const rows = sortedWeeks.map((w) => models.get(`${w}:${teamId}`));
      const present = rows.filter((row): row is TeamWeek => !!row);
      const projected = rows.every((row) => row?.projected != null)
        ? present.reduce((sum, row) => sum + row.projected!, 0)
        : null;
      const actual = round(present.reduce((sum, row) => sum + row.actual, 0));
      return {
        teamId,
        actual,
        projected,
        difference: projected === null ? null : actual - projected,
        players: present.flatMap((row) => row.players),
        reason:
          present.length !== rows.length
            ? 'Missing or ambiguous team-week scores for this matchup period.'
            : present.find((row) => row.reason)?.reason,
      };
    };
    const home = combine(a);
    const away = combine(b);
    if (!finite(home.actual) || !finite(away.actual)) return;
    // Without every recorded score, even the real result is unknown.
    if (sortedWeeks.some((w) => !models.has(`${w}:${a}`) || !models.has(`${w}:${b}`))) return;
    for (const w of sortedWeeks) {
      matchedTeamWeeks.add(`${w}:${a}`);
      matchedTeamWeeks.add(`${w}:${b}`);
    }
    const reason = home.reason || away.reason;
    let wins = 0;
    let ties = 0;
    if (!reason) {
      const normal = normalStream(id);
      const draw = (team: TeamWeek) => {
        // Providers settle each scoring week to cents before summing a period.
        const totals = new Map<number, number>();
        for (const p of team.players)
          totals.set(
            p.week,
            (totals.get(p.week) ?? 0) + p.projected! + Math.sqrt(p.variance!) * normal(),
          );
        return round([...totals.values()].reduce((sum, points) => sum + round(points), 0));
      };
      for (let trial = 0; trial < MATCHUP_REPLAYS; trial++) {
        const own = draw(home);
        const other = draw(away);
        if (own > other) wins++;
        else if (own === other) ties++;
      }
    }
    matchups.push({
      id,
      week: sortedWeeks[0],
      weeks: sortedWeeks,
      home,
      away,
      wins: reason ? null : wins,
      losses: reason ? null : MATCHUP_REPLAYS - wins - ties,
      ties: reason ? null : ties,
      homeExpectedWin: reason ? null : (wins + ties / 2) / MATCHUP_REPLAYS,
      homeActualWin: home.actual > away.actual ? 1 : home.actual === away.actual ? 0.5 : 0,
      reason,
    });
  };
  for (const score of unique) {
    const opponent = score.opponentTeamId
      ? byKey.get(`${score.week}:${score.opponentTeamId}`)
      : undefined;
    if (!opponent || opponent.opponentTeamId !== score.teamId || score.teamId >= opponent.teamId)
      continue;
    const weeks = score.matchupWeeks ?? [score.week];
    // Multiweek boundaries must be published, never inferred from repeated opponents.
    if (
      !weeks.includes(score.week) ||
      weeks.some((w) => {
        const own = byKey.get(`${w}:${score.teamId}`);
        const other = byKey.get(`${w}:${opponent.teamId}`);
        return (
          own?.opponentTeamId !== opponent.teamId ||
          other?.opponentTeamId !== score.teamId ||
          (own.matchupWeeks && own.matchupWeeks.join(',') !== weeks.join(',')) ||
          (other.matchupWeeks && other.matchupWeeks.join(',') !== weeks.join(','))
        );
      })
    )
      continue;
    addGame(score.teamId, opponent.teamId, weeks);
  }
  for (const game of data.playoffGames ?? []) addGame(game.homeTeamId, game.awayTeamId, game.weeks);
  matchups.sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
  const teams = data.teams.map((team) => {
    const played = matchups.filter(
      (m) => m.home.teamId === team.teamId || m.away.teamId === team.teamId,
    );
    const covered = played.filter((m) => m.homeExpectedWin !== null);
    let expectedHalfWins = 0;
    let actualHalfWins = 0;
    let difference = 0;
    let opponentDifference = 0;
    for (const m of covered) {
      const home = m.home.teamId === team.teamId;
      const homeHalfWins = 2 * m.wins! + m.ties!;
      expectedHalfWins += home ? homeHalfWins : 2 * MATCHUP_REPLAYS - homeHalfWins;
      actualHalfWins += 2 * (home ? m.homeActualWin : 1 - m.homeActualWin);
      difference += (home ? m.home : m.away).difference!;
      opponentDifference += (home ? m.away : m.home).difference!;
    }
    return {
      ...team,
      games: played.length,
      unmatchedWeeks: new Set(
        scores.filter((s) => s.teamId === team.teamId && !matchedTeamWeeks.has(key(s))).map(key),
      ).size,
      measured: covered.length,
      expectedWins: covered.length ? expectedHalfWins / (2 * MATCHUP_REPLAYS) : null,
      actualWins: covered.length ? actualHalfWins / 2 : null,
      extraWins: covered.length
        ? (actualHalfWins * MATCHUP_REPLAYS - expectedHalfWins) / (2 * MATCHUP_REPLAYS)
        : null,
      difference: covered.length ? round(difference / covered.length) : null,
      opponentDifference: covered.length ? round(opponentDifference / covered.length) : null,
    };
  });
  return {
    teams,
    matchups,
    players,
    duplicateTeamWeeks: [...counts.values()].filter((n) => n > 1).length,
  };
}
