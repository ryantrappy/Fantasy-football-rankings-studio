import { PlayoffCalibration } from '../../src/components/PlayoffCalibration';
import type { SeasonInsights } from '../../src/insights';
const api = {
  getLeagueSeasons: async () => ({
    years: [2026, 2025, 2024],
    activeSeason: 2026,
    activeManagerKeys: [],
  }),
  getInsights: async (_leagueId: string, year: number) =>
    ({
      completedWeek: 10,
      playoffSettings: { regularSeasonEnd: 10, playoffTeams: 4 },
      teams: Array.from({ length: 8 }, (_, i) => ({ teamId: String(i), teamName: `Team ${i}` })),
      scores: Array.from({ length: 10 }, (_, w) =>
        Array.from({ length: 8 }, (_, i) => ({
          teamId: String(i),
          opponentTeamId: String(i ^ 1),
          week: w + 1,
          actual: 105 + (i % 2 === 0 ? 10 : -10) + Math.sin(w * (i + 1) + year) * 30,
        })),
      ).flat(),
      results: Array.from({ length: 8 }, (_, i) => ({ teamId: String(i), playoff: i % 2 === 0 })),
    }) as SeasonInsights,
};
export function CalibrationPreview() {
  return <PlayoffCalibration api={api} leagueId="fixture" year={2026} />;
}
