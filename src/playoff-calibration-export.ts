import type { SeasonInsights } from './insights';
import {
  summarizeCalibration,
  summarizeCalibrationSeasons,
  type CalibrationObservation,
} from './playoff-calibration';

// Select only the fields needed to replay the historical forecast. Reports also contain
// manager identities, player rosters and transactions that do not belong in this artifact.
export function calibrationReplayInputs(year: number, data: SeasonInsights) {
  const settings = data.playoffSettings!;
  return {
    year,
    reportGeneratedAt: data.generatedAt ?? null,
    completedWeek: data.completedWeek,
    playoffSettings: {
      regularSeasonEnd: settings.regularSeasonEnd,
      playoffTeams: settings.playoffTeams,
      ...(settings.rules
        ? {
            rules: {
              provider: settings.rules.provider,
              season: settings.rules.season,
              tiebreakers: [...settings.rules.tiebreakers],
              divisionByTeam: { ...settings.rules.divisionByTeam },
              divisionWinnersFirst: settings.rules.divisionWinnersFirst,
              roundWeeks: settings.rules.roundWeeks.map((weeks) => [...weeks]),
              reseed: settings.rules.reseed,
              ...(settings.rules.unsupportedReason
                ? { unsupportedReason: settings.rules.unsupportedReason }
                : {}),
            },
          }
        : {}),
    },
    teams: data.teams.map((t) => ({ teamId: t.teamId })),
    scores: data.scores
      .filter((s) => s.week >= 1 && s.week <= settings.regularSeasonEnd)
      .map((s) => ({
        teamId: s.teamId,
        week: s.week,
        actual: s.actual,
        opponentTeamId: s.opponentTeamId ?? null,
      })),
    forecastSchedule: (data.forecastSchedule || [])
      .filter((m) => m.week >= 1 && m.week <= settings.regularSeasonEnd)
      .map((m) => ({ week: m.week, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId })),
    results: data.teams.map((t) => ({
      teamId: t.teamId,
      playoff: data.results!.find((r) => r.teamId === t.teamId)!.playoff,
    })),
  };
}
export type CalibrationReplaySeason = ReturnType<typeof calibrationReplayInputs>;

export function buildCalibrationExport(input: {
  leagueId: string;
  selectedSeason: number;
  completedAt: string;
  requestedSeasons: number[];
  seasons: CalibrationReplaySeason[];
  observations: CalibrationObservation[];
  notes: string[];
}) {
  const ends = new Map(input.seasons.map((s) => [s.year, s.playoffSettings.regularSeasonEnd]));
  const observations = input.observations.map((r) => ({
    year: r.year,
    teamId: r.teamId,
    week: r.week,
    probability: r.probability,
    qualified: r.qualified,
    baseline: r.baseline,
    standingsProbability: r.standingsProbability,
    regularSeasonEnd: ends.get(r.year)!,
    remainingRegularSeasonWeeks: ends.get(r.year)! - r.week,
    outcomeKnown: r.week === ends.get(r.year),
  }));
  return {
    schemaVersion: 4,
    artifactType: 'fantasy-playoff-calibration',
    completedAt: input.completedAt,
    context: { leagueId: input.leagueId, selectedSeason: input.selectedSeason },
    model: {
      id: 'historical-score-joint-posterior-v3',
      simulationsPerCutoff: 20000,
      meanPriorWeeks: 3,
      variancePriorDegrees: 3,
      pooledVarianceFloor: 1,
      posteriorDegrees: 'completedWeeks + 3',
      posteriorScale:
        '(3 * pooledVariance + withinTeamSSE + 3 * n / (n + 3) * (teamMean - leagueMean)^2) / (n + 3)',
      predictiveVariance: 'posteriorScale * degrees / (degrees - 2) * (1 + 1 / (n + 3))',
      scoring:
        'Draw team variance from inverse-chi-square and team mean conditional on it once per trial; conditionally normal weekly draws share those parameters, including playoff rounds. Marginal scores are Student-t.',
      hyperparameters:
        'Cutoff-only league mean and pooled variance are plug-in empirical-Bayes estimates.',
      schedule: 'Published complete weekly pairings; otherwise random pairings.',
      seeding:
        'Each season’s provider division qualification and ordered tiebreakers; one seed at a time, with coin flip for unresolved exact ties. Legacy inputs without rules use wins then points.',
      projectionsUsed: false,
      deterministic: true,
    },
    interpretation: {
      probabilityUnits: 'Fraction from 0 to 1, unrounded.',
      baseline: 'Playoff places divided by team count for each season.',
      standingsBenchmark:
        'Preserves cutoff wins, points and remaining schedule; uses identical league-average means and independent normal draws with pooled within-team variance * (1 + 1 / (n + 3)). 20,000 deterministic trials per cutoff, with current projections excluded.',
      standingsSkill:
        '1 - model Brier / standings Brier. Positive is better; null when the benchmark has zero error or is unavailable.',
      logLossClip: [0.000001, 0.999999],
      classificationThreshold: 0.5,
      reliabilityBins: '10 percentage-point bins; lower inclusive, upper exclusive except 100%.',
      limitations: [
        'Final regular-season cutoffs know all game results; evaluate predictive improvement separately from those rules checks.',
        'Teams within a season and repeated weekly forecasts are dependent observations.',
        'Later cutoffs may cover fewer seasons when regular-season lengths differ.',
        'No archived provider projections or injury forecasts. Unsupported season rules and median-win formats are excluded; future commissioner overrides cannot be predicted.',
        'These backtests apply the current methodology retrospectively, not archived historical model versions.',
        'Variance and strength uncertainty do not estimate future injury occurrence, duration or point loss. Player correlations and future strength changes are not modeled.',
        'League hyperparameter uncertainty is not integrated; the three-week and three-degree prior strengths are fixed assumptions, not tuned league-specific coefficients.',
      ],
    },
    coverage: {
      requestedSeasons: [...input.requestedSeasons],
      evaluatedSeasons: input.seasons.map((s) => s.year),
      notes: [...input.notes],
    },
    weeklyMetrics: summarizeCalibration(input.observations),
    // Separate out the trivial known-outcome cutoffs for methodology comparisons.
    predictiveWeeklyMetrics: summarizeCalibration(observations.filter((r) => !r.outcomeKnown)),
    seasonMetrics: summarizeCalibrationSeasons(observations),
    finalWeekRulesChecks: summarizeCalibration(observations.filter((r) => r.outcomeKnown)),
    observations,
    seasons: input.seasons,
  };
}

export function downloadCalibrationExport(artifact: ReturnType<typeof buildCalibrationExport>) {
  const content = `${JSON.stringify(artifact, null, 2)}\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  const league = artifact.context.leagueId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  link.href = url;
  link.download = `playoff-calibration-${league}-${artifact.context.selectedSeason}.json`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
