import type { SeasonInsights } from './insights';
export interface PlayoffSettings {
  regularSeasonEnd: number;
  playoffTeams: number;
}
export interface PlayoffForecast {
  throughWeek: number;
  simulations: number;
  rounds: string[];
  rows: { teamId: string; teamName: string; playoff: number; advance: number[] }[];
  reason?: string;
}
// Reproducible model estimates, not provider playoff-clinch declarations.
export function forecastPlayoffs(
  data: SeasonInsights,
  settings: PlayoffSettings,
  cutoff: number,
  simulations = 5000,
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
  const empty = (reason: string): PlayoffForecast => ({
    throughWeek,
    simulations: 0,
    rounds,
    rows: [],
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
  const histories = teams.map((t) =>
    data.scores.filter(
      (s) =>
        s.teamId === t.teamId && s.week <= throughWeek && s.week >= 1 && Number.isFinite(s.actual),
    ),
  );
  if (histories.some((h) => h.length < 3 || new Set(h.map((s) => s.week)).size !== h.length))
    return empty('At least three distinct completed scoring weeks per team are needed.');
  const byId = new Map(teams.map((t, i) => [t.teamId, i]));
  const wins = teams.map(() => 0),
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
      wins[i] += s.actual > opponent.actual ? 1 : s.actual === opponent.actual ? 0.5 : 0;
    }
  if (histories.some((h) => h.length !== histories[0].length))
    return empty('Teams have unequal completed-week coverage.');
  let seed = 2166136261;
  for (const char of JSON.stringify([
    histories.map((h) => h.map((s) => [s.week, s.actual, s.opponentTeamId])),
    settings,
  ]))
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const all = histories.flat().map((s) => s.actual);
  const leagueMean = all.reduce((a, b) => a + b, 0) / all.length;
  const leagueVariance = all.reduce((a, b) => a + (b - leagueMean) ** 2, 0) / all.length;
  const distributions = histories.map((h) => {
    const mean = h.reduce((a, b) => a + b.actual, 0) / h.length;
    const variance = h.reduce((a, b) => a + (b.actual - mean) ** 2, 0) / h.length;
    const weight = h.length / (h.length + 3);
    return {
      mean: weight * mean + (1 - weight) * leagueMean,
      sd: Math.sqrt(Math.max(1, weight * variance + (1 - weight) * leagueVariance)),
    };
  });
  const draw = (i: number) => {
    const normal =
      Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, random()))) *
      Math.cos(2 * Math.PI * random());
    return distributions[i].mean + distributions[i].sd * normal;
  };
  const counts = teams.map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
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
    const w = [...wins],
      p = [...points];
    for (let week = throughWeek + 1; week <= settings.regularSeasonEnd; week++) {
      // Future schedules may not be published: explicitly a neutral schedule scenario.
      const order = shuffle(teams.map((_, i) => i));
      for (let k = 0; k < order.length; k += 2) {
        const a = order[k],
          b = order[k + 1],
          sa = draw(a),
          sb = draw(b);
        p[a] += sa;
        p[b] += sb;
        w[sa > sb ? a : b]++;
      }
    }
    const tie = teams.map(() => random());
    const seeds = teams
      .map((_, i) => i)
      .sort((a, b) => w[b] - w[a] || p[b] - p[a] || tie[b] - tie[a])
      .slice(0, size);
    seeds.forEach((i) => counts[i].playoff++);
    const game = (a: number, b: number) => (draw(a) > draw(b) ? a : b);
    let alive: number[];
    if (size === 6) {
      alive = [seeds[0], game(seeds[3], seeds[4]), seeds[1], game(seeds[2], seeds[5])];
      alive.forEach((i) => counts[i].advance[0]++);
    } else
      alive =
        size === 8
          ? [seeds[0], seeds[7], seeds[3], seeds[4], seeds[1], seeds[6], seeds[2], seeds[5]]
          : size === 4
            ? [seeds[0], seeds[3], seeds[1], seeds[2]]
            : seeds;
    let round = size === 6 ? 1 : 0;
    while (alive.length > 1) {
      const next: number[] = [];
      for (let i = 0; i < alive.length; i += 2) {
        const winner = game(alive[i], alive[i + 1]);
        counts[winner].advance[round]++;
        next.push(winner);
      }
      alive = next;
      round++;
    }
  }
  return {
    throughWeek,
    simulations,
    rounds,
    rows: counts.map((r) => ({
      ...r,
      playoff: r.playoff / simulations,
      advance: r.advance.map((n) => n / simulations),
    })),
  };
}
