// Public score-only benchmark. No credentials, player names, or account data.
// Node 22: node --experimental-strip-types scripts/benchmark-forecast.mjs <league-id>
import { validateHistoricalForecast } from '../src/forecast-statistics.ts';

let leagueId = process.argv[2];
if (!/^\d+$/.test(leagueId || '')) throw new Error('Supply a public Sleeper league ID.');
const get = async (path) => {
  const response = await fetch(`https://api.sleeper.app/v1/${path}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Sleeper returned HTTP ${response.status}`);
  return response.json();
};
const legacyFit = (histories) => {
  const all = histories.flat();
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  const variance = all.reduce((sum, x) => sum + (x - mean) ** 2, 0) / all.length;
  return histories.map((h) => {
    const m = h.reduce((a, b) => a + b, 0) / h.length;
    const v = h.reduce((sum, x) => sum + (x - m) ** 2, 0) / h.length;
    const weight = h.length / (h.length + 3);
    return {
      mean: weight * m + (1 - weight) * mean,
      sd: Math.sqrt(Math.max(1, weight * v + (1 - weight) * variance)),
    };
  });
};
const results = [];
for (let season = 0; season < 4 && leagueId; season++) {
  const league = await get(`league/${leagueId}`);
  if (!league) throw new Error('League not found.');
  const end = Math.min(18, (league.settings?.playoff_week_start || 15) - 1);
  if (league.status === 'complete') {
    const scores = [];
    for (let week = 1; week <= end; week++) {
      const rows = await get(`league/${leagueId}/matchups/${week}`);
      for (const row of rows) {
        const pair = rows.filter((r) => r.matchup_id != null && r.matchup_id === row.matchup_id);
        if (pair.length !== 2 || !Number.isFinite(row.points)) continue;
        scores.push({
          teamId: String(row.roster_id),
          week,
          actual: row.points,
          opponentTeamId: String(pair.find((r) => r.roster_id !== row.roster_id).roster_id),
        });
      }
    }
    const data = {
      teams: [...new Set(scores.map((s) => s.teamId))].map((teamId) => ({ teamId })),
      scores,
      completedWeek: end,
    };
    const summary = ({ games, brier, logLoss }) => ({ games, brier, logLoss });
    results.push({
      season: league.season,
      legacy: summary(validateHistoricalForecast(data, end, legacyFit)),
      candidate: summary(validateHistoricalForecast(data, end)),
    });
  }
  leagueId = league.previous_league_id;
}
console.log(
  JSON.stringify(
    {
      retrievedAt: new Date().toISOString(),
      scope:
        'One league lineage, completed regular seasons, historical scores only; not independent league samples or provider-projection validation.',
      baseline: { brier: 0.25, logLoss: Math.log(2) },
      results,
    },
    null,
    2,
  ),
);
