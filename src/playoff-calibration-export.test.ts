import { buildCalibrationExport, calibrationReplayInputs } from './playoff-calibration-export';
import { summarizeCalibration, type CalibrationObservation } from './playoff-calibration';
import type { SeasonInsights } from './insights';

const data = {
  generatedAt: '2026-09-28T12:00:00.000Z',
  completedWeek: 3,
  playoffSettings: { regularSeasonEnd: 2, playoffTeams: 2, privateField: 'omit-settings' },
  teams: [{ teamId: 'a', teamName: 'omit-name', managerKey: 'omit-manager' }, { teamId: 'b' }],
  scores: [1, 2, 3].map((week) => ({
    teamId: 'a',
    week,
    actual: 120.12345,
    opponentTeamId: 'b',
    starters: [{ playerId: 'omit-player', points: 100 }],
    bestLineup: { points: 999 },
  })),
  forecastSchedule: [
    { week: 2, homeTeamId: 'a', awayTeamId: 'b', secret: 'omit-schedule' },
    { week: 3, homeTeamId: 'a', awayTeamId: 'b' },
  ],
  results: [
    { teamId: 'a', playoff: true, champion: true },
    { teamId: 'b', playoff: false },
  ],
  playoffProjection: { note: 'omit-projections' },
} as unknown as SeasonInsights;
const observations: CalibrationObservation[] = [
  { year: 2025, teamId: 'a', week: 1, probability: 0.94915, qualified: true, baseline: 0.5 },
  { year: 2025, teamId: 'b', week: 1, probability: 0.05085, qualified: false, baseline: 0.5 },
  { year: 2025, teamId: 'a', week: 2, probability: 1, qualified: true, baseline: 0.5 },
  { year: 2025, teamId: 'b', week: 2, probability: 0, qualified: false, baseline: 0.5 },
];
it('exports only replay inputs and excludes postseason scores, projections and report identities', () => {
  const season = calibrationReplayInputs(2025, data);
  expect(season.scores).toHaveLength(2);
  expect(season.forecastSchedule).toHaveLength(1);
  expect(season.scores[0].actual).toBe(120.12345);
  expect(season.teams).toEqual([{ teamId: 'a' }, { teamId: 'b' }]);
  expect(season.playoffSettings).toEqual({ regularSeasonEnd: 2, playoffTeams: 2 });
  expect(JSON.stringify(season)).not.toContain('omit-');
});
it('retains the specific season’s rules and divisions without unrelated provider data', () => {
  const seasonData: SeasonInsights = {
    ...data,
    playoffSettings: {
      regularSeasonEnd: 2,
      playoffTeams: 2,
      rules: {
        provider: 'ESPN',
        season: 2024,
        tiebreakers: ['head-to-head', 'points-for'],
        divisionByTeam: { a: 'East', b: 'West' },
        divisionWinnersFirst: true,
        roundWeeks: [[3, 4]],
        reseed: true,
      },
    },
  };
  expect(calibrationReplayInputs(2024, seasonData).playoffSettings.rules).toEqual(
    seasonData.playoffSettings!.rules,
  );
  expect(calibrationReplayInputs(2025, data).playoffSettings.rules).toBeUndefined();
});
it('preserves precision, coverage and all cutoffs while distinguishing predictive metrics from known outcomes', () => {
  const artifact = buildCalibrationExport({
    leagueId: 'league',
    selectedSeason: 2026,
    completedAt: '2026-09-28T12:00:00.000Z',
    requestedSeasons: [2025, 2024],
    seasons: [calibrationReplayInputs(2025, data)],
    observations,
    notes: ['2024 unavailable'],
  });
  const exported = JSON.parse(JSON.stringify(artifact));
  expect(exported.schemaVersion).toBe(4);
  expect(exported.observations[0].probability).toBe(0.94915);
  expect(exported.observations[0]).toMatchObject({
    outcomeKnown: false,
    remainingRegularSeasonWeeks: 1,
  });
  expect(exported.observations[2]).toMatchObject({
    outcomeKnown: true,
    remainingRegularSeasonWeeks: 0,
  });
  expect(exported.weeklyMetrics).toEqual(summarizeCalibration(observations));
  expect(exported.predictiveWeeklyMetrics).toEqual(
    summarizeCalibration(observations.filter((r) => r.week === 1)),
  );
  expect(exported.coverage).toEqual({
    requestedSeasons: [2025, 2024],
    evaluatedSeasons: [2025],
    notes: ['2024 unavailable'],
  });
  expect(exported.model.simulationsPerCutoff).toBe(20000);
  expect(exported.model.id).toBe('historical-score-joint-posterior-v3');
  expect(exported.model.meanPriorWeeks).toBe(3);
  expect(exported.model.scoring).toMatch(/once per trial/);
  expect(exported.interpretation.limitations.join(' ')).toMatch(/future injury occurrence/);
});
