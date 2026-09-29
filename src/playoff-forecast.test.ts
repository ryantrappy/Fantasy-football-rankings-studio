import { forecastPlayoffs } from './playoff-forecast';
import type { SeasonInsights } from './insights';
import type { PlayoffRules } from './playoff-rules';
import * as statistics from './forecast-statistics';
afterEach(() => vi.restoreAllMocks());
// Isolate bracket/rule behavior from score-estimation uncertainty.
const fixedStrengths = () =>
  vi
    .spyOn(statistics, 'fitScoreDistributions')
    .mockImplementation((histories) =>
      histories.map((h) => ({ mean: h.reduce((a, b) => a + b, 0) / h.length, sd: 1 })),
    );
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
it('sums every week in a playoff round and applies a projection only to its own week', () => {
  fixedStrengths();
  const data = fixture(2);
  data.scores.forEach((s) => (s.actual = s.teamId === '0' ? 80 : 130));
  data.playoffProjection = {
    provider: 'ESPN',
    week: 5,
    teamPoints: { '0': 140, '1': 120 },
    coveredStarters: 2,
    totalStarters: 2,
  };
  const rules: PlayoffRules = {
    provider: 'ESPN',
    season: 2025,
    tiebreakers: ['points-for'],
    divisionWinnersFirst: false,
    divisionByTeam: {},
    roundWeeks: [[5]],
    reseed: false,
  };
  const single = forecastPlayoffs(data, { regularSeasonEnd: 4, playoffTeams: 2, rules }, 4, 2000);
  const double = forecastPlayoffs(
    data,
    { regularSeasonEnd: 4, playoffTeams: 2, rules: { ...rules, roundWeeks: [[5, 6]] } },
    4,
    2000,
  );
  expect(single.rows[0].advance[0]).toBeGreaterThan(0.99);
  expect(double.rows[0].advance[0]).toBeLessThan(0.01);
  expect(double.rows.reduce((sum, r) => sum + r.advance[0], 0)).toBe(1);
});
it('blocks unsupported provider rules before producing scenario probabilities', () => {
  const rules: PlayoffRules = {
    provider: 'ESPN',
    season: 2025,
    tiebreakers: [],
    divisionByTeam: {},
    divisionWinnersFirst: false,
    roundWeeks: [],
    reseed: false,
    unsupportedReason: 'Unknown playoff tiebreaker',
  };
  const result = forecastPlayoffs(fixture(), { regularSeasonEnd: 10, playoffTeams: 4, rules }, 4);
  expect(result.reason).toMatch(/Unknown playoff tiebreaker/);
  expect(result.rows).toEqual([]);
});
it('reseeds survivors against the highest remaining seed after a first-round upset', () => {
  fixedStrengths();
  const data = fixture();
  data.completedWeek = 2;
  data.scores = data.scores.filter((s) => s.week <= 2);
  const points = [140, 100, 130, 90, 120, 80, 110, 70];
  data.scores.forEach((s) => (s.actual = points[Number(s.teamId)]));
  data.playoffProjection = {
    provider: 'Sleeper',
    week: 3,
    teamPoints: { '0': 0, '1': 0, '2': 1000, '3': 0, '4': 1000, '5': 0, '6': 1000, '7': 1000 },
    coveredStarters: 8,
    totalStarters: 8,
  };
  const rules: PlayoffRules = {
    provider: 'Sleeper',
    season: 2025,
    tiebreakers: ['points-for', 'points-against'],
    divisionByTeam: {},
    divisionWinnersFirst: false,
    roundWeeks: [[3], [4], [5]],
    reseed: false,
  };
  // Seed 8 upsets seed 1. With a fixed bracket, seed 3 meets stronger seed 2
  // in the semifinal; reseeding makes it meet seed 4 instead.
  const fixed = forecastPlayoffs(data, { regularSeasonEnd: 2, playoffTeams: 8, rules }, 2, 2000);
  const reseeded = forecastPlayoffs(
    data,
    { regularSeasonEnd: 2, playoffTeams: 8, rules: { ...rules, reseed: true } },
    2,
    2000,
  );
  expect(fixed.rows[4].advance[1]).toBeLessThan(0.1);
  expect(reseeded.rows[4].advance[1]).toBeGreaterThan(0.9);
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
it('projects final regular-season records from banked and simulated wins', () => {
  fixedStrengths();
  const data = fixture(2);
  data.scores.forEach((score) => (score.actual = score.teamId === '0' ? 150 : 50));
  const result = forecastPlayoffs(data, { regularSeasonEnd: 6, playoffTeams: 2 }, 4, 2000);
  expect(result.rows[0].projectedWins).toBeGreaterThan(5.9);
  expect(result.rows[1].projectedWins).toBeLessThan(0.1);
  expect(result.rows[0].projectedWins + result.rows[1].projectedWins).toBeCloseTo(6, 8);
  expect(
    forecastPlayoffs(data, { regularSeasonEnd: 4, playoffTeams: 2 }, 4, 2000).rows.map(
      (row) => row.projectedWins,
    ),
  ).toEqual([4, 0]);
});
it('shares one posterior parameter draw per team through every simulated future week and round', () => {
  const sample = vi.spyOn(statistics, 'sampleScoreParameters');
  const result = forecastPlayoffs(fixture(2), { regularSeasonEnd: 10, playoffTeams: 2 }, 2, 100);
  expect(result.reason).toBeUndefined();
  expect(sample).toHaveBeenCalledTimes(2 * 100);
  expect(sample.mock.results.every((r) => Number.isFinite(r.value.mean) && r.value.sd > 0)).toBe(
    true,
  );
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
  expect(projected.projection.note).toMatch(/set the expected score/);
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

it('uses later weekly lineup means in qualification and falls back per missing team-week', () => {
  fixedStrengths();
  const data = fixture(4);
  const next = {
    week: 5,
    teamPoints: { '0': 100, '1': 100, '2': 100, '3': 100 },
    coveredStarters: 4,
    totalStarters: 4,
  };
  const later = { ...next, week: 6, teamPoints: { ...next.teamPoints, '0': 300 } };
  data.playoffProjection = { provider: 'Sleeper', ...next, weekly: [next, later] };
  const settings = { regularSeasonEnd: 6, playoffTeams: 2 };
  const weekly = forecastPlayoffs(data, settings, 4, 2000);
  const single = forecastPlayoffs(
    { ...data, playoffProjection: { provider: 'Sleeper', ...next } },
    settings,
    4,
    2000,
  );
  expect(weekly.rows[0].playoff).toBe(1);
  expect(single.rows[0].playoff).toBeLessThan(0.7);
  expect(weekly.projection.weeks?.find((row) => row.week === 6)?.projectedTeams).toBe(4);
  // Explicitly missing coverage has the same behavior as an absent week, not a zero mean.
  data.playoffProjection.weekly = [next, { ...later, teamPoints: {}, coveredStarters: 0 }];
  const missing = forecastPlayoffs(data, settings, 4, 2000);
  data.playoffProjection.weekly = [next];
  expect(forecastPlayoffs(data, settings, 4, 2000).rows).toEqual(missing.rows);
  expect(missing.projection.note).toMatch(/historical scoring only/);
  expect(missing.projection.weeks?.find((row) => row.week === 6)?.projectedTeams).toBe(0);
  expect(forecastPlayoffs(data, settings, 3, 2000).rows).toEqual(
    forecastPlayoffs({ ...data, playoffProjection: undefined }, settings, 3, 2000).rows,
  );
  expect(forecastPlayoffs(data, settings, 4, 2000, 'equal-strength').rows).toEqual(
    forecastPlayoffs({ ...data, playoffProjection: undefined }, settings, 4, 2000, 'equal-strength')
      .rows,
  );
});

it('uses every projected scoring week in a multiweek playoff round', () => {
  fixedStrengths();
  const data = fixture(2);
  data.scores.forEach((score) => (score.actual = score.teamId === '0' ? 80 : 130));
  const first = {
    week: 5,
    teamPoints: { '0': 120, '1': 130 },
    coveredStarters: 2,
    totalStarters: 2,
  };
  data.playoffProjection = {
    provider: 'ESPN',
    ...first,
    weekly: [first, { ...first, week: 6, teamPoints: { '0': 300, '1': 100 } }],
  };
  const settings = {
    regularSeasonEnd: 4,
    playoffTeams: 2,
    rules: {
      provider: 'ESPN' as const,
      season: 2026,
      tiebreakers: ['points-for' as const],
      divisionByTeam: {},
      divisionWinnersFirst: false,
      roundWeeks: [[5, 6]],
      reseed: false,
    },
  };
  expect(forecastPlayoffs(data, settings, 4, 2000).rows[0].advance[0]).toBe(1);
  expect(
    forecastPlayoffs(
      { ...data, playoffProjection: { provider: 'ESPN', ...first } },
      settings,
      4,
      2000,
    ).rows[0].advance[0],
  ).toBe(0);
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

it('uses a current first-round projection, never a later-week snapshot', () => {
  const data = fixture(2);
  const settings = { regularSeasonEnd: 4, playoffTeams: 2 };
  data.playoffProjection = {
    provider: 'ESPN',
    week: 5,
    teamPoints: { '0': 200, '1': 50 },
    coveredStarters: 2,
    totalStarters: 2,
  };
  const result = forecastPlayoffs(data, settings, 4);
  expect(result.rows[0].advance[0]).toBe(1);
  expect(result.samplingMargin).toBeCloseTo(0.00693, 5);
  data.playoffProjection.week = 6;
  expect(forecastPlayoffs(data, settings, 4).projection.used).toBe(false);
});

it('uses the standings comparison without current projections while retaining banked wins and points', () => {
  const data = fixture(4);
  data.scores.forEach((s) => {
    s.actual = Number(s.teamId) % 2 === 0 ? 120 : 90;
  });
  const settings = { regularSeasonEnd: 5, playoffTeams: 2 };
  const before = forecastPlayoffs(data, settings, 4, 20000, 'equal-strength');
  data.playoffProjection = {
    provider: 'ESPN',
    week: 5,
    teamPoints: { '0': 0, '1': 1000, '2': 0, '3': 1000 },
    coveredStarters: 4,
    totalStarters: 4,
  };
  const after = forecastPlayoffs(data, settings, 4, 20000, 'equal-strength');
  expect(after.rows).toEqual(before.rows);
  expect(after.projection.used).toBe(false);
  expect(after.validation).toBeUndefined();
  expect(after.rows.filter((r) => Number(r.teamId) % 2 === 0).every((r) => r.playoff === 1)).toBe(
    true,
  );
});
