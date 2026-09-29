import type { SeasonInsights } from './insights';
import {
  fitScoreDistributions,
  matchupWinProbability,
  normalCdf,
  sampleScoreParameters,
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
  expect(normalCdf(Number.POSITIVE_INFINITY)).toBe(1);
  expect(normalCdf(Number.NEGATIVE_INFINITY)).toBe(0);
  expect(matchupWinProbability({ mean: 100, sd: 0 }, { mean: 100, sd: 0 })).toBe(0.5);
  expect(matchupWinProbability({ mean: 110, sd: 0 }, { mean: 90, sd: 0 })).toBe(1);
  const [a, b] = fitScoreDistributions([
    [90, 100, 110],
    [80, 105, 125],
  ]);
  expect(matchupWinProbability(a, b) + matchupWinProbability(b, a)).toBeCloseTo(1, 10);
  expect(fitScoreDistributions([[100], [100]]).every((d) => d.sd > 1)).toBe(true);
});

it('pools within-team noise and includes prior-mean disagreement in the posterior', () => {
  const same = fitScoreDistributions([
    [90, 100, 110],
    [90, 100, 110],
  ]);
  const offset = fitScoreDistributions([
    [190, 200, 210],
    [90, 100, 110],
  ]);
  expect(same[0].posterior).toEqual({ degrees: 6, scale: 500 / 6, meanPrecision: 6 });
  // The pooled noise is still 100. The offset contributes only the conjugate
  // mean-disagreement term (3 * 3 / 6) * (200 - 150)^2.
  expect(offset[0].posterior!.scale).toBeCloseTo((500 + 1.5 * 50 ** 2) / 6, 10);
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

it('gives the standings benchmark identical future distributions using cutoff-only pooled noise', () => {
  const histories = [
    [80, 100],
    [120, 140],
  ];
  const distributions = fitScoreDistributions(histories, true);
  expect(distributions[0]).toEqual(distributions[1]);
  expect(distributions[0].mean).toBe(110);
  expect(distributions[0].sd ** 2).toBeCloseTo(200 * (1 + 1 / 5));
  expect(fitScoreDistributions(histories)).toEqual(fitScoreDistributions(histories, false));
});

it('draws the joint posterior with the correct predictive variance and cross-week covariance', () => {
  const d = fitScoreDistributions([
    [90, 110, 95, 105, 85, 115],
    [80, 100, 85, 95, 75, 105],
  ])[0];
  let seed = 7123;
  const uniform = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
  let first = 0,
    second = 0,
    square = 0,
    product = 0;
  const trials = 50000;
  for (let j = 0; j < trials; j++) {
    const parameters = sampleScoreParameters(d, normal);
    const x = parameters.mean + parameters.sd * normal() - d.mean;
    const y = parameters.mean + parameters.sd * normal() - d.mean;
    first += x;
    second += y;
    square += x * x;
    product += x * y;
  }
  const { degrees, scale, meanPrecision } = d.posterior!;
  const covariance = (scale * degrees) / ((degrees - 2) * meanPrecision);
  expect(Math.abs(first / trials)).toBeLessThan(0.3);
  expect(square / trials / d.sd ** 2).toBeCloseTo(1, 1);
  expect((product / trials - (first * second) / trials ** 2) / covariance).toBeCloseTo(1, 1);
});

it('integrates heavy-tailed predictive win probabilities and preserves team-order symmetry', () => {
  const a = {
    mean: 160,
    sd: Math.sqrt(((400 * 5) / 3) * 1.2),
    posterior: { degrees: 5, scale: 400, meanPrecision: 5 },
  };
  const b = { ...a, mean: 100 };
  const p = matchupWinProbability(a, b);
  // Independently computed Student-t convolution (SciPy quadrature): 0.941066.
  expect(p).toBeCloseTo(0.941066, 2);
  expect(matchupWinProbability(b, a) + p).toBeCloseTo(1, 12);
  expect(matchupWinProbability(a, a)).toBe(0.5);
  expect(matchupWinProbability({ mean: 110, sd: 10 }, { mean: 90, sd: 10 })).toBeCloseTo(
    normalCdf(Math.SQRT2),
    10,
  );
});
