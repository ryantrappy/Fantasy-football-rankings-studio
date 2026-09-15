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
it('uses only a complete current-cutoff projection snapshot', () => {
  const data = fixture();
  data.playoffProjection = {
    provider: 'Sleeper',
    week: 5,
    teamPoints: Object.fromEntries(
      data.teams.map((team, index) => [team.teamId, 300 - index * 20]),
    ),
    coveredStarters: 72,
    totalStarters: 72,
    optimizedLineup: true,
    benchSelections: 8,
  };
  const settings = { regularSeasonEnd: 5, playoffTeams: 4 };
  const projected = forecastPlayoffs(data, settings, 4);
  const historical = forecastPlayoffs({ ...data, playoffProjection: undefined }, settings, 4);
  expect(projected.projection.used).toBe(true);
  expect(projected.projection.note).toMatch(/blended equally/);
  expect(projected.projection.note).toMatch(/8 bench selections/);
  expect(projected.rows[0].playoff).toBeGreaterThan(historical.rows[0].playoff);

  const retrospective = forecastPlayoffs(data, settings, 3);
  expect(retrospective.projection.used).toBe(false);
  expect(retrospective.projection.note).toMatch(/excluded/);

  delete data.playoffProjection.teamPoints['0'];
  data.playoffProjection.coveredStarters -= 9;
  const incomplete = forecastPlayoffs(data, settings, 4);
  expect(incomplete.projection.used).toBe(true);
  expect(incomplete.projection.note).toMatch(/historical scoring only/);
});

it('uses complete published opponent pairs and rejects malformed schedule weeks', () => {
  const data = fixture(4);
  data.forecastSchedule = [
    { week: 5, homeTeamId: '0', awayTeamId: '2' },
    { week: 5, homeTeamId: '1', awayTeamId: '3' },
  ];
  const settings = { regularSeasonEnd: 5, playoffTeams: 2 };
  const result = forecastPlayoffs(data, settings, 4);
  expect(result.schedule).toEqual({ knownWeeks: 1, remainingWeeks: 1 });
  data.forecastSchedule[1].homeTeamId = '0';
  expect(forecastPlayoffs(data, settings, 4).schedule.knownWeeks).toBe(0);
});
it('supports one- and two-week forecasts but still requires completed paired results', () => {
  const settings = { regularSeasonEnd: 10, playoffTeams: 4 };
  expect(forecastPlayoffs(fixture(), settings, 1).reason).toBeUndefined();
  expect(forecastPlayoffs(fixture(), settings, 2).reason).toBeUndefined();
  expect(forecastPlayoffs(fixture(), settings, 0).reason).toMatch(/one distinct/);
  const data = fixture();
  data.scores[0].opponentTeamId = null;
  expect(forecastPlayoffs(data, settings, 4).reason).toMatch(/paired/);
});
it('uses a complete current-week projection in a one-week forecast', () => {
  const data = fixture();
  data.completedWeek = 1;
  data.playoffProjection = {
    provider: 'ESPN',
    week: 2,
    teamPoints: Object.fromEntries(data.teams.map((team) => [team.teamId, 100])),
    coveredStarters: 72,
    totalStarters: 72,
  };
  const result = forecastPlayoffs(data, { regularSeasonEnd: 10, playoffTeams: 4 }, 1);
  expect(result.reason).toBeUndefined();
  expect(result.projection.used).toBe(true);
});
it('gives top seeds a semifinal bye in a six-team bracket', () => {
  const data = fixture();
  data.scores.forEach((s) => (s.actual = 200 - Number(s.teamId) * 10));
  const r = forecastPlayoffs(data, { regularSeasonEnd: 4, playoffTeams: 6 }, 4);
  expect(r.rows[0].playoff).toBe(1);
  expect(r.rows[0].advance[0]).toBe(1);
});
