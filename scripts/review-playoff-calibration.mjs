// Local, score-only retrospective review. No network or credentials.
// node scripts/review-playoff-calibration.mjs <corrected-export.json> <corrected-export.json> [--output-dir <directory>]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import ts from 'typescript';
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output-dir');
const outputDir = outputIndex < 0 ? null : args[outputIndex + 1];
const files = outputIndex < 0 ? args : args.slice(0, outputIndex);
if (files.length < 2 || (outputIndex >= 0 && !outputDir))
  throw new Error('Supply at least two season-rule calibration exports and optional --output-dir.');

// Frozen predecessor (normal-season-rules-v2), for a comparison on identical rules.
function predecessorFit(histories, equalStrength = false) {
  const all = histories.flat();
  if (!all.length || histories.some((h) => !h.length)) return [];
  const average = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const centre = average(all),
    means = histories.map(average);
  const sse = histories.map((h, i) => h.reduce((sum, x) => sum + (x - means[i]) ** 2, 0));
  const degrees = all.length - histories.length;
  const pooled = Math.max(
    1,
    degrees > 0
      ? sse.reduce((a, b) => a + b, 0) / degrees
      : all.reduce((sum, x) => sum + (x - centre) ** 2, 0) / all.length,
  );
  return histories.map((h, i) => ({
    mean: equalStrength ? centre : (h.length * means[i] + 3 * centre) / (h.length + 3),
    sd: Math.sqrt(
      (equalStrength ? pooled : Math.max(1, (sse[i] + 3 * pooled) / (h.length + 2))) *
        (1 + 1 / (h.length + 3)),
    ),
  }));
}
async function loadModules(predecessor = false) {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'playoff-review-'));
  const names = [
    'forecast-statistics',
    'playoff-rules',
    'playoff-forecast',
    'playoff-calibration',
    'playoff-calibration-export',
  ];
  try {
    for (const name of names) {
      let source = await fs.readFile(path.join(root, 'src', name + '.ts'), 'utf8');
      if (predecessor && name === 'forecast-statistics')
        source =
          source.replace('export function fitScoreDistributions(', 'function unusedJointFit(') +
          '\nexport const fitScoreDistributions = ' +
          predecessorFit.toString() +
          ';';
      const compiled = ts
        .transpileModule(source, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
        })
        .outputText.replace(/from '(\.\/[\w-]+)'/g, "from '$1.mjs'");
      await fs.writeFile(path.join(directory, name + '.mjs'), compiled);
    }
    const modules = await Promise.all(
      names.map((name) => import(pathToFileURL(path.join(directory, name + '.mjs')))),
    );
    return Object.assign({}, ...modules);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
const current = await loadModules(),
  previous = await loadModules(true);
const mean = (rows, value) => rows.reduce((sum, row) => sum + value(row), 0) / rows.length;
function metrics(rows, model) {
  if (!rows.length) return null;
  return {
    forecasts: rows.length,
    brier: mean(rows, (r) => (r.probabilities[model] - Number(r.qualified)) ** 2),
    logLoss: mean(
      rows,
      (r) =>
        -Math.log(
          Math.max(
            1e-6,
            Math.min(1 - 1e-6, r.qualified ? r.probabilities[model] : 1 - r.probabilities[model]),
          ),
        ),
    ),
    reliability: Array.from({ length: 10 }, (_, bin) => {
      const subset = rows.filter(
        (r) => Math.min(9, Math.floor(r.probabilities[model] * 10)) === bin,
      );
      return {
        lower: bin / 10,
        upper: (bin + 1) / 10,
        count: subset.length,
        predicted: subset.length ? mean(subset, (r) => r.probabilities[model]) : null,
        observed: subset.length ? mean(subset, (r) => Number(r.qualified)) : null,
      };
    }),
  };
}
const compare = (rows) =>
  Object.fromEntries(
    ['previous', 'current', 'standings'].map((model) => [model, metrics(rows, model)]),
  );
// 80% / 95% Student-t central quantiles, df 4..21, from scipy.stats.t.ppf.
const tQuantiles = {
  4: [1.533206274, 2.776445105],
  5: [1.475884049, 2.570581836],
  6: [1.439755747, 2.446911851],
  7: [1.414923928, 2.364624252],
  8: [1.39681531, 2.306004135],
  9: [1.383028738, 2.262157163],
  10: [1.372183641, 2.228138852],
  11: [1.363430318, 2.20098516],
  12: [1.356217335, 2.17881283],
  13: [1.350171288, 2.160368656],
  14: [1.345030374, 2.144786688],
  15: [1.340605608, 2.131449546],
  16: [1.336757168, 2.119905299],
  17: [1.333379389, 2.109815578],
  18: [1.330390944, 2.10092204],
  19: [1.327728209, 2.093024054],
  20: [1.325340707, 2.085963447],
  21: [1.323187874, 2.079613845],
};
function intervals(season) {
  const end = season.playoffSettings.regularSeasonEnd;
  const ids = season.teams.map((t) => t.teamId).sort();
  const rows = [];
  for (let n = 1; n < end; n++) {
    const histories = ids.map((id) =>
      season.scores.filter((s) => s.teamId === id && s.week <= n).map((s) => s.actual),
    );
    const ds = current.fitScoreDistributions(histories),
      old = previous.fitScoreDistributions(histories);
    for (const horizon of [1, 4]) {
      if (n + horizon > end) continue;
      for (let i = 0; i < ids.length; i++) {
        const actual = mean(
          season.scores.filter((s) => s.teamId === ids[i] && s.week > n && s.week <= n + horizon),
          (s) => s.actual,
        );
        for (let level = 0; level < 2; level++) {
          const nominal = level ? 0.95 : 0.8;
          const { scale, meanPrecision, degrees } = ds[i].posterior;
          for (const model of ['previous', 'current']) {
            const width =
              model === 'previous'
                ? ([1.281551566, 1.959963985][level] * old[i].sd) / Math.sqrt(horizon)
                : tQuantiles[degrees][level] * Math.sqrt(scale * (1 / horizon + 1 / meanPrecision));
            const error = Math.abs(actual - ds[i].mean);
            // Interval score penalizes width and uncovered outcomes; lower is better.
            rows.push({
              year: season.year,
              week: n,
              horizon,
              nominal,
              model,
              covered: error <= width,
              width: 2 * width,
              intervalScore: 2 * width + (2 / (1 - nominal)) * Math.max(0, error - width),
            });
          }
        }
      }
    }
  }
  return rows;
}
function coverage(rows) {
  return Object.fromEntries(
    [1, 4].map((horizon) => [
      horizon,
      Object.fromEntries(
        ['previous', 'current'].map((model) => [
          model,
          [0.8, 0.95].map((nominal) => {
            const subset = rows.filter(
              (r) => r.horizon === horizon && r.model === model && r.nominal === nominal,
            );
            return {
              nominal,
              forecasts: subset.length,
              coverage: mean(subset, (r) => Number(r.covered)),
              meanWidth: mean(subset, (r) => r.width),
              intervalScore: mean(subset, (r) => r.intervalScore),
            };
          }),
        ]),
      ),
    ]),
  );
}
const report = {
  simulationsPerCutoff: 20000,
  model: 'historical-score-joint-posterior-v3',
  interpretation:
    'Retrospective rolling-origin evaluation. Two related league lineages, five seasons each; teams and repeated cutoffs are dependent. These inspected years are not an untouched holdout. Prior strengths remain 3; no outcome-based league-specific coefficients or injury rates. Empirical-Bayes league hyperparameter uncertainty is not integrated.',
  leagues: [],
};
if (outputDir) await fs.mkdir(outputDir, { recursive: true });
for (const file of files) {
  const input = JSON.parse(await fs.readFile(file, 'utf8'));
  if (
    input.artifactType !== 'fantasy-playoff-calibration' ||
    input.schemaVersion < 3 ||
    input.seasons.some((s) => !s.playoffSettings.rules)
  )
    throw new Error('Use corrected schema >= 3 exports with each season’s rules.');
  const leagueId = input.context.leagueId;
  const observations = [],
    reviewRows = [],
    intervalRows = [];
  for (const season of input.seasons) {
    const data = {
      ...season,
      teams: season.teams.map((t) => ({ ...t, teamName: t.teamId })),
      playoffProjection: undefined,
    };
    const reason = current.calibrationEligibility(data);
    if (reason) throw new Error(`${leagueId} ${season.year}: ${reason}`);
    for (let week = 1; week <= season.playoffSettings.regularSeasonEnd; week++) {
      const forecast = current.forecastPlayoffs(data, season.playoffSettings, week);
      const standings = current.forecastPlayoffs(
        data,
        season.playoffSettings,
        week,
        20000,
        'equal-strength',
      );
      const before = previous.forecastPlayoffs(data, season.playoffSettings, week);
      if (forecast.reason || standings.reason || before.reason)
        throw new Error('Forecast unavailable.');
      observations.push(...current.calibrationObservations(season.year, data, forecast, standings));
      if (week === season.playoffSettings.regularSeasonEnd) continue;
      for (const row of forecast.rows)
        reviewRows.push({
          year: season.year,
          week,
          teamId: row.teamId,
          qualified: season.results.find((r) => r.teamId === row.teamId).playoff,
          probabilities: {
            current: row.playoff,
            previous: before.rows.find((r) => r.teamId === row.teamId).playoff,
            standings: standings.rows.find((r) => r.teamId === row.teamId).playoff,
          },
        });
    }
    intervalRows.push(...intervals(season));
    console.error(`Reviewed ${leagueId} ${season.year}`);
  }
  const seasons = [...new Set(reviewRows.map((r) => r.year))];
  const bySeason = Object.fromEntries(
    seasons.map((year) => [year, compare(reviewRows.filter((r) => r.year === year))]),
  );
  const deltas = seasons.map(
    (year) => bySeason[year].current.brier - bySeason[year].previous.brier,
  );
  report.leagues.push({
    leagueId,
    all: compare(reviewRows),
    earlyWeeks1to3: compare(reviewRows.filter((r) => r.week <= 3)),
    earlier2021to2023: compare(reviewRows.filter((r) => r.year <= 2023)),
    later2024to2025: compare(reviewRows.filter((r) => r.year >= 2024)),
    bySeason,
    seasonSensitivity: {
      seasonsImproved: deltas.filter((d) => d < 0).length,
      seasons: deltas.length,
      meanBrierDelta: mean(deltas, (d) => d),
      leaveOneSeasonOutBrierDelta: deltas.map((_, i) =>
        mean(
          deltas.filter((_, j) => j !== i),
          (d) => d,
        ),
      ),
    },
    scoreIntervals: coverage(intervalRows),
    earlyScoreIntervals: coverage(intervalRows.filter((r) => r.week <= 3)),
    finalWeekRulesChecks: current.summarizeCalibration(
      observations.filter((r) => r.week === r.regularSeasonEnd),
    ),
    observations: reviewRows,
  });
  if (outputDir) {
    const artifact = current.buildCalibrationExport({
      leagueId,
      selectedSeason: input.context.selectedSeason,
      completedAt: new Date().toISOString(),
      requestedSeasons: input.coverage.requestedSeasons,
      seasons: input.seasons,
      observations,
      notes: input.coverage.notes,
    });
    await fs.writeFile(
      path.join(
        outputDir,
        `playoff-calibration-${leagueId}-${input.context.selectedSeason}-joint-posterior.json`,
      ),
      JSON.stringify(artifact, null, 2) + '\n',
    );
  }
}
const content = JSON.stringify(report, null, 2) + '\n';
if (outputDir) await fs.writeFile(path.join(outputDir, 'playoff-uncertainty-review.json'), content);
else process.stdout.write(content);
