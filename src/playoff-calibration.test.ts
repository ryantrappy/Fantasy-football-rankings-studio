import {
  backtestPlayoffSeason,
  calibrationEligibility,
  summarizeCalibration,
  type CalibrationObservation,
} from './playoff-calibration';
import type { SeasonInsights } from './insights';

export function calibrationFixture(): SeasonInsights {
  return {
    completedWeek: 3,
    playoffSettings: { regularSeasonEnd: 3, playoffTeams: 2 },
    teams: ['0', '1', '2', '3'].map((teamId) => ({ teamId, teamName: `Team ${teamId}` })),
    scores: [1, 2, 3].flatMap((week) =>
      [0, 1, 2, 3].map((i) => ({
        teamId: String(i),
        opponentTeamId: String(i ^ 1),
        week,
        actual: 130 - i * 10 + week,
      })),
    ),
    results: [0, 1, 2, 3].map((i) => ({
      teamId: String(i),
      playoff: i % 2 === 0,
      champion: i === 0,
      finish: i + 1,
      lastPlace: i === 3,
    })),
  } as SeasonInsights;
}
const collect = async (data: SeasonInsights) => {
  const rows: CalibrationObservation[] = [];
  const reason = await backtestPlayoffSeason(2025, data, (week) => rows.push(...week));
  return { rows, reason };
};
it('scores probabilities and reliability against actual outcomes, including confidently wrong predictions', () => {
  const rows: CalibrationObservation[] = [
    { year: 2024, teamId: 'a', week: 1, probability: 0.9, qualified: false, baseline: 0.5 },
    { year: 2024, teamId: 'b', week: 1, probability: 0.1, qualified: true, baseline: 0.5 },
    { year: 2025, teamId: 'c', week: 1, probability: 1, qualified: true, baseline: 0.25 },
    { year: 2024, teamId: 'a', week: 2, probability: 0, qualified: false, baseline: 0.5 },
  ];
  const [first, last] = summarizeCalibration(rows);
  expect(first.teams).toBe(3);
  expect(first.seasons).toBe(2);
  expect(first.brier).toBeCloseTo(0.54);
  expect(first.baselineBrier).toBeCloseTo((0.25 + 0.25 + 0.5625) / 3);
  expect(first.logLoss).toBeCloseTo((-2 * Math.log(0.1) - Math.log(0.999999)) / 3);
  expect(first.accuracy).toBeCloseTo(1 / 3);
  expect(first.reliability[9]).toMatchObject({ count: 2, predicted: 0.95, observed: 0.5 });
  expect(last.teams).toBe(1);
  expect(last.brier).toBe(0);
  expect(Number.isFinite(last.logLoss)).toBe(true);
});
it('replays all cutoffs while excluding current projections and future scores from earlier predictions', async () => {
  const data = calibrationFixture();
  const first = await collect(data);
  expect(first.reason).toBeUndefined();
  expect(first.rows).toHaveLength(12);
  data.scores
    .filter((s) => s.week > 1)
    .forEach((s) => {
      s.actual += Number(s.teamId) * 1000;
    });
  data.playoffProjection = {
    provider: 'ESPN',
    week: 4,
    teamPoints: { '0': 9999, '1': 0, '2': 0, '3': 0 },
    coveredStarters: 4,
    totalStarters: 4,
    weekly: [1, 2, 3, 4].map((week) => ({
      week,
      teamPoints: { '0': 9999, '1': 0, '2': 0, '3': 0 },
      coveredStarters: 4,
      totalStarters: 4,
    })),
  };
  const second = await collect(data);
  expect(second.rows.filter((r) => r.week === 1)).toEqual(first.rows.filter((r) => r.week === 1));
  const withProjection = await collect(calibrationFixture());
  const projected = calibrationFixture();
  projected.playoffProjection = data.playoffProjection;
  expect((await collect(projected)).rows).toEqual(withProjection.rows);
  expect(
    first.rows.filter((r) => r.week === 3).every((r) => r.probability === Number(r.qualified)),
  ).toBe(true);
});
it('keeps provider outcomes as ground truth when the model seeding differs', async () => {
  const data = calibrationFixture();
  data.results!.forEach((r) => {
    r.playoff = !r.playoff;
  });
  const result = await collect(data);
  expect(summarizeCalibration(result.rows).at(-1)?.brier).toBe(1);
});
it('rejects incomplete seasons, unknown entrants, duplicate scores and broken opponents without publishing a partial cohort', async () => {
  const data = calibrationFixture();
  data.completedWeek = 2;
  expect(calibrationEligibility(data)).toMatch(/incomplete/);
  data.completedWeek = 3;
  data.results![0].playoff = null;
  expect((await collect(data)).rows).toEqual([]);
  data.results![0].playoff = true;
  data.scores.push(data.scores[0]);
  expect(calibrationEligibility(data)).toMatch(/distinct/);
  data.scores.pop();
  data.scores[0].opponentTeamId = '0';
  expect(calibrationEligibility(data)).toMatch(/paired/);
});
it('stops cancelled work without publishing observations', async () => {
  const publish = vi.fn();
  await backtestPlayoffSeason(2025, calibrationFixture(), publish, () => true);
  expect(publish).not.toHaveBeenCalled();
});

it('records standings probabilities, preserves cutoff information and separates predictive from resolved observations', async () => {
  const { predictiveObservations, summarizeCalibrationSeasons } =
    await import('./playoff-calibration');
  const first = await collect(calibrationFixture());
  expect(first.rows.every((r) => typeof r.standingsProbability === 'number')).toBe(true);
  for (const week of [1, 2, 3]) {
    const rows = first.rows.filter((r) => r.week === week);
    expect(rows.reduce((sum, r) => sum + r.standingsProbability!, 0)).toBeCloseTo(2, 8);
  }
  const predictive = predictiveObservations(first.rows);
  expect(predictive).toHaveLength(8);
  expect(predictive.every((r) => r.week < 3)).toBe(true);
  const [season] = summarizeCalibrationSeasons(first.rows);
  expect(season).toMatchObject({ year: 2025, uniqueTeams: 4, cutoffs: 2, forecasts: 8 });
  const altered = calibrationFixture();
  altered.scores
    .filter((r) => r.week > 1)
    .forEach((r) => {
      r.actual += 100 * Number(r.teamId);
    });
  expect((await collect(altered)).rows.filter((r) => r.week === 1)).toEqual(
    first.rows.filter((r) => r.week === 1),
  );
});
it('scores the standings benchmark and handles a perfect benchmark without division by zero', () => {
  const rows: CalibrationObservation[] = [
    {
      year: 2025,
      teamId: 'a',
      week: 1,
      probability: 0.9,
      standingsProbability: 0.7,
      qualified: true,
      baseline: 0.5,
    },
    {
      year: 2025,
      teamId: 'b',
      week: 1,
      probability: 0.1,
      standingsProbability: 0.3,
      qualified: false,
      baseline: 0.5,
    },
  ];
  const [score] = summarizeCalibration(rows);
  expect(score.standingsBrier).toBeCloseTo(0.09);
  expect(score.standingsSkill).toBeCloseTo(1 - 0.01 / 0.09);
  rows.forEach((r) => {
    r.standingsProbability = Number(r.qualified);
  });
  expect(summarizeCalibration(rows)[0].standingsSkill).toBeNull();
});

it('excludes each season own final cutoff when lengths differ', async () => {
  const { predictiveObservations, summarizeCalibrationSeasons } =
    await import('./playoff-calibration');
  const rows: CalibrationObservation[] = [
    {
      year: 2024,
      teamId: 'a',
      week: 1,
      probability: 0.8,
      standingsProbability: 0.6,
      qualified: true,
      baseline: 0.5,
      regularSeasonEnd: 2,
    },
    {
      year: 2024,
      teamId: 'a',
      week: 2,
      probability: 1,
      standingsProbability: 1,
      qualified: true,
      baseline: 0.5,
      regularSeasonEnd: 2,
    },
    {
      year: 2025,
      teamId: 'a',
      week: 1,
      probability: 0.8,
      standingsProbability: 0.6,
      qualified: true,
      baseline: 0.5,
      regularSeasonEnd: 3,
    },
    {
      year: 2025,
      teamId: 'a',
      week: 2,
      probability: 0.8,
      standingsProbability: 0.6,
      qualified: true,
      baseline: 0.5,
      regularSeasonEnd: 3,
    },
    {
      year: 2025,
      teamId: 'a',
      week: 3,
      probability: 1,
      standingsProbability: 1,
      qualified: true,
      baseline: 0.5,
      regularSeasonEnd: 3,
    },
  ];
  const predictive = predictiveObservations(rows);
  expect(predictive).toHaveLength(3);
  expect(summarizeCalibration(predictive)[1].seasons).toBe(1);
  expect(summarizeCalibrationSeasons(rows).map((s) => s.cutoffs)).toEqual([2, 1]);
});
