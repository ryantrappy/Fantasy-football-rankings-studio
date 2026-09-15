import type { SeasonInsights } from './insights';

export interface ScoreDistribution {
  mean: number;
  sd: number;
}

// Three prior observations regularize short histories. This is an assumption,
// not a coefficient fitted to the games shown in the accuracy panel.
export function fitScoreDistributions(histories: number[][]): ScoreDistribution[] {
  const all = histories.flat();
  if (!all.length || histories.some((h) => !h.length)) return [];
  const average = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const leagueMean = average(all);
  const means = histories.map(average);
  const degrees = all.length - histories.length;
  // Pool variation WITHIN teams; differences in team strength are not weekly noise.
  const pooledVariance = Math.max(
    1,
    degrees > 0
      ? histories.reduce((sum, h, i) => sum + h.reduce((s, x) => s + (x - means[i]) ** 2, 0), 0) /
          degrees
      : all.reduce((sum, x) => sum + (x - leagueMean) ** 2, 0) / all.length,
  );
  return histories.map((h, i) => {
    const n = h.length;
    const residuals = h.reduce((sum, x) => sum + (x - means[i]) ** 2, 0);
    const variance = (residuals + 3 * pooledVariance) / (n - 1 + 3);
    return {
      mean: (n * means[i] + 3 * leagueMean) / (n + 3),
      // Include uncertainty in the estimated mean, especially early in a season.
      sd: Math.sqrt(Math.max(1, variance) * (1 + 1 / (n + 3))),
    };
  });
}

// Standard normal CDF, absolute error < 8e-8 (A&S 26.2.17).
export function normalCdf(z: number): number {
  if (z === 0) return 0.5;
  const x = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * x);
  const tail =
    (Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)) *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - tail : tail;
}

export function matchupWinProbability(a: ScoreDistribution, b: ScoreDistribution) {
  return normalCdf((a.mean - b.mean) / Math.hypot(a.sd, b.sd));
}

export interface ForecastValidation {
  games: number;
  skippedTies: number;
  brier: number | null;
  logLoss: number | null;
  baselineBrier: number;
  baselineLogLoss: number;
  reliability: { label: string; count: number; predicted: number; observed: number }[];
}

export function validateHistoricalForecast(
  data: Pick<SeasonInsights, 'teams' | 'scores' | 'completedWeek'>,
  cutoff: number,
  fit: typeof fitScoreDistributions = fitScoreDistributions,
): ForecastValidation {
  const result: ForecastValidation = {
    games: 0,
    skippedTies: 0,
    brier: null,
    logLoss: null,
    baselineBrier: 0.25,
    baselineLogLoss: Math.log(2),
    reliability: Array.from({ length: 5 }, (_, i) => ({
      label: `${50 + i * 10}–${60 + i * 10}%`,
      count: 0,
      predicted: 0,
      observed: 0,
    })),
  };
  const ids = data.teams.map((t) => t.teamId).sort();
  const end = Math.min(cutoff, data.completedWeek);
  let brier = 0;
  let logLoss = 0;
  // Each target week is held out. Today's projections/injuries are never inputs.
  for (let week = 3; week <= end; week++) {
    const prior = ids.map((id) =>
      data.scores.filter(
        (s) => s.teamId === id && s.week >= 1 && s.week < week && Number.isFinite(s.actual),
      ),
    );
    if (prior.some((h) => h.length < 2 || new Set(h.map((s) => s.week)).size !== h.length))
      continue;
    const distributions = fit(prior.map((h) => h.map((s) => s.actual)));
    for (let i = 0; i < ids.length; i++) {
      const scores = data.scores.filter((s) => s.teamId === ids[i] && s.week === week);
      if (scores.length !== 1) continue;
      const score = scores[0];
      const j = ids.indexOf(score.opponentTeamId || '');
      if (j <= i) continue;
      const opponents = data.scores.filter((s) => s.teamId === ids[j] && s.week === week);
      if (opponents.length !== 1) continue;
      const opponent = opponents[0];
      if (
        opponent.opponentTeamId !== ids[i] ||
        !Number.isFinite(score.actual) ||
        !Number.isFinite(opponent.actual)
      )
        continue;
      if (score.actual === opponent.actual) {
        result.skippedTies++;
        continue;
      }
      const p = matchupWinProbability(distributions[i], distributions[j]);
      const outcome = Number(score.actual > opponent.actual);
      brier += (p - outcome) ** 2;
      const clipped = Math.max(1e-6, Math.min(1 - 1e-6, p));
      logLoss -= outcome * Math.log(clipped) + (1 - outcome) * Math.log(1 - clipped);
      // One observation per game, oriented toward the predicted favorite.
      const favorite = Math.max(p, 1 - p);
      const bin = result.reliability[Math.min(4, Math.floor((favorite - 0.5) * 10))];
      bin.count++;
      bin.predicted += favorite;
      bin.observed += p >= 0.5 ? outcome : 1 - outcome;
      result.games++;
    }
  }
  if (result.games) {
    result.brier = brier / result.games;
    result.logLoss = logLoss / result.games;
  }
  for (const bin of result.reliability) {
    if (!bin.count) continue;
    bin.predicted /= bin.count;
    bin.observed /= bin.count;
  }
  return result;
}
