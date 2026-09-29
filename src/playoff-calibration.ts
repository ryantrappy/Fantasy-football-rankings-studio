import type { SeasonInsights } from './insights';
import { forecastPlayoffs, type PlayoffForecast } from './playoff-forecast';
import { playoffRulesReason } from './playoff-rules';

export interface CalibrationObservation {
  year: number;
  teamId: string;
  week: number;
  probability: number;
  qualified: boolean;
  baseline: number;
  standingsProbability?: number;
  regularSeasonEnd?: number;
}
export interface CalibrationWeek {
  week: number;
  seasons: number;
  teams: number;
  brier: number;
  baselineBrier: number;
  logLoss: number;
  baselineLogLoss: number;
  accuracy: number;
  standingsBrier: number | null;
  standingsLogLoss: number | null;
  standingsSkill: number | null;
  reliability: { label: string; count: number; predicted: number; observed: number }[];
}

// Require the same complete cohort at every cutoff. Never infer outcomes from model seeds.
export function calibrationEligibility(data: SeasonInsights): string | undefined {
  const settings = data.playoffSettings;
  if (!settings) return 'Playoff settings are unavailable.';
  if (
    !Number.isInteger(settings.regularSeasonEnd) ||
    settings.regularSeasonEnd < 1 ||
    settings.regularSeasonEnd > 18 ||
    ![2, 4, 6, 8].includes(settings.playoffTeams) ||
    settings.playoffTeams > data.teams.length ||
    data.teams.length % 2 !== 0 ||
    data.teams.length > 32
  )
    return 'The league format is unsupported by the forecast model.';
  if (data.completedWeek < settings.regularSeasonEnd) return 'Regular season is incomplete.';
  const rulesReason = playoffRulesReason(
    data.teams.map((t) => t.teamId),
    settings.playoffTeams,
    settings.regularSeasonEnd,
    settings.rules,
  );
  if (rulesReason) return rulesReason;
  if (!data.teams.length || new Set(data.teams.map((t) => t.teamId)).size !== data.teams.length)
    return 'Team identities are incomplete or duplicated.';
  const results = data.results || [];
  if (
    data.teams.some((t) => {
      const rows = results.filter((r) => r.teamId === t.teamId);
      return rows.length !== 1 || typeof rows[0].playoff !== 'boolean';
    })
  )
    return 'Actual playoff qualification is unavailable for one or more teams.';
  if (
    data.teams.filter((t) => results.find((r) => r.teamId === t.teamId)?.playoff).length !==
    settings.playoffTeams
  )
    return 'Actual playoff entrants do not match the configured playoff places.';
  for (const team of data.teams) {
    for (let week = 1; week <= settings.regularSeasonEnd; week++) {
      const rows = data.scores.filter((s) => s.teamId === team.teamId && s.week === week);
      if (rows.length !== 1 || !Number.isFinite(rows[0].actual))
        return 'Complete distinct regular-season scores are required for every team.';
      const row = rows[0];
      const opponents = data.scores.filter(
        (s) => s.teamId === row.opponentTeamId && s.week === week,
      );
      if (
        row.opponentTeamId === team.teamId ||
        !data.teams.some((t) => t.teamId === row.opponentTeamId) ||
        opponents.length !== 1 ||
        opponents[0].opponentTeamId !== team.teamId
      )
        return 'Complete paired regular-season opponents are required.';
    }
  }
}

export function calibrationObservations(
  year: number,
  data: SeasonInsights,
  forecast: PlayoffForecast,
  standings?: PlayoffForecast,
): CalibrationObservation[] {
  if (forecast.reason) return [];
  return forecast.rows.map((row) => ({
    year,
    teamId: row.teamId,
    week: forecast.throughWeek,
    probability: row.playoff,
    qualified: data.results!.find((r) => r.teamId === row.teamId)!.playoff!,
    baseline: data.playoffSettings!.playoffTeams / data.teams.length,
    ...(standings
      ? { standingsProbability: standings.rows.find((s) => s.teamId === row.teamId)!.playoff }
      : {}),
    regularSeasonEnd: data.playoffSettings!.regularSeasonEnd,
  }));
}

export function summarizeCalibration(observations: CalibrationObservation[]): CalibrationWeek[] {
  return [...new Set(observations.map((o) => o.week))]
    .sort((a, b) => a - b)
    .map((week) => {
      const rows = observations.filter((o) => o.week === week);
      const loss = (p: number, y: number) => {
        const clipped = Math.max(1e-6, Math.min(1 - 1e-6, p));
        return -(y * Math.log(clipped) + (1 - y) * Math.log(1 - clipped));
      };
      const average = (value: (row: CalibrationObservation) => number) =>
        rows.reduce((sum, row) => sum + value(row), 0) / rows.length;
      const brier = average((r) => (r.probability - Number(r.qualified)) ** 2);
      const standingsBrier = rows.every((r) => r.standingsProbability !== undefined)
        ? average((r) => (r.standingsProbability! - Number(r.qualified)) ** 2)
        : null;
      const reliability = Array.from({ length: 10 }, (_, i) => {
        const bin = rows.filter((r) => Math.min(9, Math.floor(r.probability * 10)) === i);
        return {
          label: `${i * 10}–${(i + 1) * 10}%`,
          count: bin.length,
          predicted: bin.length ? bin.reduce((sum, r) => sum + r.probability, 0) / bin.length : 0,
          observed: bin.length ? bin.filter((r) => r.qualified).length / bin.length : 0,
        };
      });
      return {
        week,
        seasons: new Set(rows.map((r) => r.year)).size,
        teams: rows.length,
        brier,
        standingsBrier,
        standingsLogLoss:
          standingsBrier === null
            ? null
            : average((r) => loss(r.standingsProbability!, Number(r.qualified))),
        standingsSkill:
          standingsBrier !== null && standingsBrier > 0 ? 1 - brier / standingsBrier : null,
        baselineBrier: average((r) => (r.baseline - Number(r.qualified)) ** 2),
        logLoss: average((r) => loss(r.probability, Number(r.qualified))),
        baselineLogLoss: average((r) => loss(r.baseline, Number(r.qualified))),
        accuracy: average((r) => Number(r.probability >= 0.5 === r.qualified)),
        reliability,
      };
    });
}

export async function backtestPlayoffSeason(
  year: number,
  data: SeasonInsights,
  onWeek: (rows: CalibrationObservation[]) => void,
  cancelled: () => boolean = () => false,
): Promise<string | undefined> {
  const reason = calibrationEligibility(data);
  if (reason) return reason;
  // Archived provider projections are not available. Explicitly remove today's snapshot at ALL cutoffs.
  const historical = { ...data, playoffProjection: undefined };
  const observations: CalibrationObservation[][] = [];
  for (let week = 1; week <= data.playoffSettings!.regularSeasonEnd; week++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (cancelled()) return;
    const forecast = forecastPlayoffs(historical, data.playoffSettings!, week);
    if (forecast.reason) return forecast.reason;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (cancelled()) return;
    const standings = forecastPlayoffs(
      historical,
      data.playoffSettings!,
      week,
      20000,
      'equal-strength',
    );
    if (standings.reason) return standings.reason;
    observations.push(calibrationObservations(year, data, forecast, standings));
  }
  // Publish only complete seasons so changing coverage cannot masquerade as convergence.
  for (const rows of observations) onWeek(rows);
}

export function predictiveObservations(observations: CalibrationObservation[]) {
  return observations.filter(
    (r) => r.regularSeasonEnd !== undefined && r.week < r.regularSeasonEnd,
  );
}

export function summarizeCalibrationSeasons(observations: CalibrationObservation[]) {
  return [...new Set(observations.map((r) => r.year))]
    .sort((a, b) => b - a)
    .map((year) => {
      const rows = predictiveObservations(observations.filter((r) => r.year === year));
      if (!rows.length) return null;
      // Pool cutoffs for descriptive per-season scores; observations are dependent.
      const score = summarizeCalibration(rows.map((r) => ({ ...r, week: 0 })))[0];
      return {
        year,
        cutoffs: new Set(rows.map((r) => r.week)).size,
        uniqueTeams: new Set(rows.map((r) => r.teamId)).size,
        forecasts: rows.length,
        brier: score.brier,
        standingsBrier: score.standingsBrier,
        logLoss: score.logLoss,
        standingsLogLoss: score.standingsLogLoss,
        standingsSkill: score.standingsSkill,
      };
    })
    .filter((r) => r !== null);
}
