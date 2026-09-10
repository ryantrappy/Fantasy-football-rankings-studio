import { forecastPlayoffs } from './playoff-forecast';
import type { SeasonInsights } from './insights';
const fixture = (n = 8): SeasonInsights => ({
  completedWeek: 4,
  generatedAt: '',
  notes: [],
  pickups: [],
  trades: [],
  tradeComparisons: [],
  teams: Array.from({ length: n }, (_, i) => ({
    teamId: String(i),
    teamName: `Team ${i}`,
  })) as SeasonInsights['teams'],
  scores: Array.from({ length: n }, (_, i) =>
    Array.from({ length: 4 }, (_, w) => ({
      teamId: String(i),
      week: w + 1,
      actual: 100,
      projected: null,
      starters: [],
      opponentTeamId: String(i ^ 1),
    })),
  ).flat(),
});
it.each([2, 4, 6, 8])('conserves playoff slots and round winners for %i teams', (size) => {
  const r = forecastPlayoffs(fixture(), { regularSeasonEnd: 10, playoffTeams: size }, 4);
  expect(r.reason).toBeUndefined();
  expect(r.rows.reduce((s, r) => s + r.playoff, 0)).toBeCloseTo(size, 8);
  expect(r.rows.reduce((s, r) => s + r.advance.at(-1)!, 0)).toBeCloseTo(1, 8);
  for (const row of r.rows) {
    let prior = row.playoff;
    for (const p of row.advance) {
      expect(p).toBeLessThanOrEqual(prior);
      expect(p).toBeGreaterThanOrEqual(0);
      prior = p;
    }
  }
  expect(r.rows.every((row) => Math.abs(row.playoff - size / 8) < 0.04)).toBe(true);
});
it('is deterministic and never includes future scores', () => {
  const data = fixture(),
    settings = { regularSeasonEnd: 10, playoffTeams: 4 };
  const first = forecastPlayoffs(data, settings, 3);
  data.scores.filter((s) => s.week === 4).forEach((s) => (s.actual = 99999));
  expect(forecastPlayoffs(data, settings, 3)).toEqual(first);
});
it('requires sufficient data and paired results', () => {
  expect(forecastPlayoffs(fixture(), { regularSeasonEnd: 10, playoffTeams: 4 }, 2).reason).toMatch(
    /three/,
  );
  const data = fixture();
  data.scores[0].opponentTeamId = null;
  expect(forecastPlayoffs(data, { regularSeasonEnd: 10, playoffTeams: 4 }, 4).reason).toMatch(
    /paired/,
  );
});
it('gives top seeds a semifinal bye in a six-team bracket', () => {
  const data = fixture();
  data.scores.forEach((s) => (s.actual = 200 - Number(s.teamId) * 10));
  const r = forecastPlayoffs(data, { regularSeasonEnd: 4, playoffTeams: 6 }, 4);
  expect(r.rows[0].playoff).toBe(1);
  expect(r.rows[0].advance[0]).toBe(1);
});
