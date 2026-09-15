import type { SeasonInsights } from './insights';
import {
  fitScoreDistributions,
  matchupWinProbability,
  normalCdf,
  validateHistoricalForecast,
} from './forecast-statistics';

const fixture = (): SeasonInsights =>
  ({
    completedWeek: 6,
    teams: [{ teamId: 'a' }, { teamId: 'b' }],
    scores: [1, 2, 3, 4, 5, 6].flatMap((week) => [
      { teamId: 'a', opponentTeamId: 'b', week, actual: week % 2 ? 110 : 90 },
      { teamId: 'b', opponentTeamId: 'a', week, actual: week % 2 ? 90 : 110 },
    ]),
  }) as SeasonInsights;

it('has symmetric finite probabilities with correct Gaussian tail values', () => {
  expect(normalCdf(0)).toBe(0.5);
  expect(normalCdf(1.96)).toBeCloseTo(0.975, 5);
  expect(normalCdf(-1.96)).toBeCloseTo(0.025, 5);
  expect(normalCdf(40)).toBe(1);
  const [a, b] = fitScoreDistributions([
    [90, 100, 110],
    [80, 105, 125],
  ]);
  expect(matchupWinProbability(a, b) + matchupWinProbability(b, a)).toBeCloseTo(1, 10);
  expect(fitScoreDistributions([[100], [100]]).every((d) => d.sd > 1)).toBe(true);
});

it('pools weekly variability without confusing between-team strength with noise', () => {
  const same = fitScoreDistributions([
    [90, 100, 110],
    [90, 100, 110],
  ]);
  const offset = fitScoreDistributions([
    [190, 200, 210],
    [90, 100, 110],
  ]);
  expect(offset[0].sd).toBeCloseTo(same[0].sd, 10);
  expect(offset[0].mean).toBeLessThan(200);
  expect(offset[0].mean).toBeGreaterThan(150);
});

it('evaluates each held-out game once with matching reliability counts', () => {
  const result = validateHistoricalForecast(fixture(), 6);
  expect(result.games).toBe(4);
  expect(result.reliability.reduce((n, b) => n + b.count, 0)).toBe(4);
  expect(result.brier).toBeGreaterThanOrEqual(0.25);
  expect(result.logLoss).toBeGreaterThanOrEqual(Math.log(2));
  expect(validateHistoricalForecast(fixture(), 2).brier).toBeNull();
});

it('never fits the target week, future weeks, or current projection/injury data', () => {
  const data = fixture();
  const before = validateHistoricalForecast(data, 4);
  data.scores.filter((s) => s.week > 4).forEach((s) => (s.actual = 99999));
  data.playoffProjection = {
    provider: 'ESPN',
    week: 7,
    teamPoints: { a: 99999 },
    totalStarters: 2,
    coveredStarters: 1,
  };
  expect(validateHistoricalForecast(data, 4)).toEqual(before);
  const predictions = before.reliability.map((b) => [b.count, b.predicted]);
  data.scores.filter((s) => s.week === 4).forEach((s) => (s.actual = 1000 - s.actual));
  expect(
    validateHistoricalForecast(data, 4).reliability.map((b) => [b.count, b.predicted]),
  ).toEqual(predictions);
});

it('skips ties, duplicate observations and unpaired matchups', () => {
  const data = fixture();
  data.scores.filter((s) => s.week === 3).forEach((s) => (s.actual = 100));
  data.scores.find((s) => s.week === 4)!.opponentTeamId = null;
  const result = validateHistoricalForecast(data, 4);
  expect(result.games).toBe(0);
  expect(result.skippedTies).toBe(1);
  data.scores.push(data.scores[0]);
  expect(validateHistoricalForecast(data, 6).games).toBe(0);
});
