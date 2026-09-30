import type { SeasonInsights } from './insights';
import {
  fitScoreDistributions,
  sampleScoreParameters,
  validateHistoricalForecast,
  type ForecastValidation,
} from './forecast-statistics';
import { playoffRulesReason, seedPlayoffTeams, type PlayoffRules } from './playoff-rules';
export const PLAYOFF_FORECAST_MODEL_VERSION = 'joint-posterior-weekly-lineup-v1';
export interface PlayoffSettings {
  regularSeasonEnd: number;
  playoffTeams: number;
  rules?: PlayoffRules;
}
export interface PlayoffForecast {
  schedule: { knownWeeks: number; remainingWeeks: number };
  throughWeek: number;
  simulations: number;
  samplingMargin: number;
  validation?: ForecastValidation;
  rounds: string[];
  rows: {
    teamId: string;
    teamName: string;
    projectedWins: number;
    playoff: number;
    advance: number[];
  }[];
  projection: {
    used: boolean;
    provider?: 'Sleeper' | 'ESPN';
    week?: number;
    coveredStarters: number;
    totalStarters: number;
    note: string;
    weeks?: {
      week: number;
      projectedTeams: number;
      coveredStarters: number;
      totalStarters: number;
    }[];
  };
  reason?: string;
}
// Reproducible model estimates, not provider playoff-clinch declarations.
export function forecastPlayoffs(
  data: SeasonInsights,
  settings: PlayoffSettings,
  cutoff: number,
  simulations = 20000,
  scoreModel: 'historical' | 'equal-strength' = 'historical',
): PlayoffForecast {
  const throughWeek = Math.max(
    0,
    Math.min(Math.floor(cutoff), data.completedWeek, settings.regularSeasonEnd),
  );
  const size = settings.playoffTeams;
  const rounds =
    size === 2
      ? ['Win title']
      : size === 4
        ? ['Reach final', 'Win title']
        : ['Reach semifinal', 'Reach final', 'Win title'];
  const snapshot = data.playoffProjection;
  const futureWeeks = [
    ...new Set([
      ...Array.from(
        { length: Math.max(0, settings.regularSeasonEnd - throughWeek) },
        (_, i) => throughWeek + i + 1,
      ),
      ...(settings.rules?.roundWeeks.flat() ??
        Array.from(
          { length: Math.ceil(Math.log2(size)) },
          (_, i) => settings.regularSeasonEnd + i + 1,
        )),
    ]),
  ]
    .filter((week) => week > throughWeek && week <= 18)
    .sort((a, b) => a - b);
  const projectionIsCurrent =
    !!snapshot && throughWeek === data.completedWeek && snapshot.week === throughWeek + 1;
  const projectedTeams = snapshot ? teamsWithProjection(data, snapshot.teamPoints) : 0;
  const weekly = snapshot?.weekly ?? (snapshot ? [snapshot] : []);
  const usableWeeks = weekly.filter(
    (row) =>
      futureWeeks.includes(row.week) &&
      weekly.filter((other) => other.week === row.week).length === 1 &&
      row.totalStarters > 0 &&
      row.coveredStarters > 0 &&
      teamsWithProjection(data, row.teamPoints) > 0,
  );
  const useProjection =
    scoreModel === 'historical' && projectionIsCurrent && usableWeeks.length > 0;
  const pointsByWeek = new Map(
    useProjection ? usableWeeks.map((row) => [row.week, row.teamPoints]) : [],
  );
  const weeklyCoverage = futureWeeks.map((week) => {
    const row = useProjection ? usableWeeks.find((row) => row.week === week) : undefined;
    return {
      week,
      projectedTeams: row ? teamsWithProjection(data, row.teamPoints) : 0,
      coveredStarters: row?.coveredStarters ?? 0,
      totalStarters: row?.totalStarters ?? snapshot?.totalStarters ?? 0,
    };
  });
  const projectedTeamWeeks = weeklyCoverage.reduce((sum, row) => sum + row.projectedTeams, 0);
  const totalTeamWeeks = futureWeeks.length * data.teams.length;
  const projection: PlayoffForecast['projection'] = {
    used: useProjection,
    provider: snapshot?.provider,
    week: snapshot?.week,
    coveredStarters: snapshot?.coveredStarters ?? 0,
    totalStarters: snapshot?.totalStarters ?? 0,
    ...(snapshot?.weekly ? { weeks: weeklyCoverage } : {}),
    note: useProjection
      ? snapshot!.weekly
        ? `${snapshot!.provider} best legal weekly lineups set the expected score for ${projectedTeamWeeks} of ${totalTeamWeeks} team-weeks across weeks ${futureWeeks.join(', ')}.${projectedTeamWeeks < totalTeamWeeks ? ' Uncovered teams and weeks use historical scoring only.' : ''}`
        : `${snapshot!.provider} week ${snapshot!.week} projections cover ${snapshot!.coveredStarters} of ${snapshot!.totalStarters} ${snapshot!.optimizedLineup ? 'best-lineup slots' : 'starters'} across ${projectedTeams} of ${data.teams.length} teams${snapshot!.optimizedLineup ? `, including ${snapshot!.benchSelections || 0} bench selection${snapshot!.benchSelections === 1 ? '' : 's'}` : ''}, and set the expected score for that week. Later weeks and uncovered teams use historical scoring only.`
      : snapshot?.note ||
        (snapshot && !projectionIsCurrent
          ? `${snapshot.provider} week ${snapshot.week} projections are excluded from this retrospective cutoff.`
          : snapshot
            ? `${snapshot.provider} week ${snapshot.week} projections cover ${snapshot.coveredStarters} of ${snapshot.totalStarters} starters and ${projectedTeams} of ${data.teams.length} teams, so the forecast uses historical scoring only.`
            : 'Current-week provider projections are unavailable for this season, so the forecast uses historical scoring only.'),
  };
  const empty = (reason: string): PlayoffForecast => ({
    schedule: {
      knownWeeks: 0,
      remainingWeeks: Math.max(0, settings.regularSeasonEnd - throughWeek),
    },
    throughWeek,
    simulations: 0,
    samplingMargin: 0,
    rounds,
    rows: [],
    projection,
    reason,
  });
  if (
    !Number.isInteger(settings.regularSeasonEnd) ||
    settings.regularSeasonEnd < 1 ||
    settings.regularSeasonEnd > 18 ||
    ![2, 4, 6, 8].includes(size) ||
    size > data.teams.length ||
    data.teams.length % 2 !== 0 ||
    data.teams.length > 32
  )
    return empty(
      'This model supports even-sized leagues with 2, 4, 6 or 8 playoff teams and a regular season ending by week 18.',
    );
  if (!Number.isInteger(simulations) || simulations < 100 || simulations > 20000)
    return empty('Invalid simulation count.');
  const teams = [...data.teams].sort((a, b) => a.teamId.localeCompare(b.teamId));
  const rulesReason = playoffRulesReason(
    teams.map((t) => t.teamId),
    size,
    settings.regularSeasonEnd,
    settings.rules,
  );
  if (rulesReason) return empty(rulesReason);
  const histories = teams.map((t) =>
    data.scores.filter(
      (s) =>
        s.teamId === t.teamId && s.week <= throughWeek && s.week >= 1 && Number.isFinite(s.actual),
    ),
  );
  if (histories.some((h) => h.length < 1 || new Set(h.map((s) => s.week)).size !== h.length))
    return empty('At least one distinct completed scoring week per team is needed.');
  const byId = new Map(teams.map((t, i) => [t.teamId, i]));
  const scheduled = new Map<number, number[]>();
  for (let week = throughWeek + 1; week <= settings.regularSeasonEnd; week++) {
    const pairs = (data.forecastSchedule || []).filter((m) => m.week === week);
    const order = pairs.flatMap((m) => [byId.get(m.homeTeamId), byId.get(m.awayTeamId)]);
    if (
      order.length === teams.length &&
      order.every((i) => i !== undefined) &&
      new Set(order).size === teams.length
    )
      scheduled.set(week, order as number[]);
  }
  const wins = teams.map(() => 0),
    against = teams.map(() => 0),
    meetings = teams.map(() => teams.map(() => 0)),
    headToHead = teams.map(() => teams.map(() => 0)),
    points = histories.map((h) => h.reduce((sum, s) => sum + s.actual, 0));
  for (let i = 0; i < teams.length; i++)
    for (const s of histories[i]) {
      const j = byId.get(s.opponentTeamId || '');
      const opponent =
        j === undefined
          ? undefined
          : histories[j].find((o) => o.week === s.week && o.opponentTeamId === teams[i].teamId);
      if (!opponent)
        return empty(
          'Complete paired head-to-head results are required through the selected week.',
        );
      const result = s.actual > opponent.actual ? 1 : s.actual === opponent.actual ? 0.5 : 0;
      wins[i] += result;
      against[i] += opponent.actual;
      meetings[i][j!]++;
      headToHead[i][j!] += result;
    }
  if (histories.some((h) => h.length !== histories[0].length))
    return empty('Teams have unequal completed-week coverage.');
  let seed = 2166136261;
  for (const char of JSON.stringify([
    histories.map((h) => h.map((s) => [s.week, s.actual, s.opponentTeamId])),
    settings,
    [...scheduled],
    useProjection ? (snapshot?.weekly ? [...pointsByWeek] : snapshot?.teamPoints) : null,
  ]))
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const distributions = fitScoreDistributions(
    histories.map((h) => h.map((s) => s.actual)),
    scoreModel === 'equal-strength',
  );
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, random()))) * Math.cos(2 * Math.PI * random());
  let parameters: { mean: number; sd: number }[];
  const draw = (i: number, week: number) => {
    const providerMean = pointsByWeek.get(week)?.[teams[i].teamId];
    const mean =
      providerMean !== undefined && Number.isFinite(providerMean)
        ? providerMean + parameters[i].mean - distributions[i].mean
        : parameters[i].mean;
    return mean + parameters[i].sd * normal();
  };
  const counts = teams.map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
    projectedWins: 0,
    playoff: 0,
    advance: rounds.map(() => 0),
  }));
  const shuffle = (list: number[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  for (let trial = 0; trial < simulations; trial++) {
    parameters = distributions.map((d) => sampleScoreParameters(d, normal));
    const w = [...wins],
      p = [...points],
      pa = [...against],
      games = meetings.map((row) => [...row]),
      h2h = headToHead.map((row) => [...row]);
    for (let week = throughWeek + 1; week <= settings.regularSeasonEnd; week++) {
      // Use known opponent identities; missing weeks remain a neutral schedule scenario.
      const order = scheduled.get(week) || shuffle(teams.map((_, i) => i));
      for (let k = 0; k < order.length; k += 2) {
        const a = order[k],
          b = order[k + 1],
          sa = draw(a, week),
          sb = draw(b, week);
        p[a] += sa;
        p[b] += sb;
        pa[a] += sb;
        pa[b] += sa;
        const result = sa > sb ? 1 : sa === sb ? 0.5 : 0;
        w[a] += result;
        w[b] += 1 - result;
        games[a][b]++;
        games[b][a]++;
        h2h[a][b] += result;
        h2h[b][a] += 1 - result;
      }
    }
    w.forEach((wins, i) => (counts[i].projectedWins += wins));
    const tie = teams.map(() => random());
    const seeds = seedPlayoffTeams(
      teams.map((t) => t.teamId),
      size,
      { wins: w, points: p, against: pa, meetings: games, headToHead: h2h },
      settings.rules,
      tie,
    );
    seeds.forEach((i) => counts[i].playoff++);
    let playoffRound = 0;
    const game = (a: number, b: number) => {
      const weeks = settings.rules?.roundWeeks[playoffRound] ?? [
        settings.regularSeasonEnd + playoffRound + 1,
      ];
      let sa = 0,
        sb = 0;
      for (const week of weeks) {
        sa += draw(a, week);
        sb += draw(b, week);
      }
      return sa > sb ? a : sb > sa ? b : seeds.indexOf(a) < seeds.indexOf(b) ? a : b;
    };
    let alive: number[];
    if (size === 6) {
      alive = [seeds[0], game(seeds[3], seeds[4]), seeds[1], game(seeds[2], seeds[5])];
      alive.forEach((i) => counts[i].advance[0]++);
      playoffRound++;
    } else
      alive =
        size === 8
          ? [seeds[0], seeds[7], seeds[3], seeds[4], seeds[1], seeds[6], seeds[2], seeds[5]]
          : size === 4
            ? [seeds[0], seeds[3], seeds[1], seeds[2]]
            : seeds;
    let round = size === 6 ? 1 : 0;
    while (alive.length > 1) {
      if (settings.rules?.reseed) {
        const ranked = [...alive].sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));
        alive = [];
        for (let i = 0; i < ranked.length / 2; i++)
          alive.push(ranked[i], ranked[ranked.length - i - 1]);
      }
      const next: number[] = [];
      for (let i = 0; i < alive.length; i += 2) {
        const winner = game(alive[i], alive[i + 1]);
        counts[winner].advance[round]++;
        next.push(winner);
      }
      alive = next;
      round++;
      playoffRound++;
    }
  }
  return {
    schedule: {
      knownWeeks: scheduled.size,
      remainingWeeks: Math.max(0, settings.regularSeasonEnd - throughWeek),
    },
    throughWeek,
    simulations,
    samplingMargin: 1.96 * Math.sqrt(0.25 / simulations),
    validation:
      scoreModel === 'historical' ? validateHistoricalForecast(data, throughWeek) : undefined,
    rounds,
    projection,
    rows: counts.map((r) => ({
      ...r,
      projectedWins: r.projectedWins / simulations,
      playoff: r.playoff / simulations,
      advance: r.advance.map((n) => n / simulations),
    })),
  };
}

function teamsWithProjection(data: SeasonInsights, points: Record<string, number>) {
  return data.teams.filter((team) => Number.isFinite(points[team.teamId])).length;
}
