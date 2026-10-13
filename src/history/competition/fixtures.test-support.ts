import type { SeasonRecord } from '../../league-summary';
export function season(
  year = 2024,
  points = [
    [100, 90, 80, 70],
    [80, 80, 120, 60],
  ],
): SeasonRecord {
  return {
    year,
    data: {
      completedWeek: points.length,
      generatedAt: '2025-01-01',
      notes: [],
      tradeComparisons: [],
      pickups: [],
      playoffSettings: { regularSeasonEnd: points.length, playoffTeams: 2 },
      teams: ['a', 'b', 'c', 'd'].map((id) => ({
        teamId: id,
        managerKey: id,
        managerName: id,
        teamName: id,
      })),
      scores: points.flatMap((ps, i) =>
        ps.map((actual, j) => ({
          teamId: ['a', 'b', 'c', 'd'][j],
          week: i + 1,
          actual,
          projected: null,
          starters: [],
          opponentTeamId: ['b', 'a', 'd', 'c'][j],
        })),
      ),
    } as unknown as SeasonRecord['data'],
  };
}
