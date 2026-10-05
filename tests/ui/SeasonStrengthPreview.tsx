import { SeasonStrength } from '../../src/components/SeasonStrength';
import { calculateInsights } from '../../src/server/insights/calculate';

export const strengthData = calculateInsights({
  completedWeek: 4,
  teams: [
    'Fourth & Long',
    'Sunday Stunners',
    'End Zone Experts',
    'The Underdogs with a very long team name',
  ].map((teamName, i) => ({ teamId: String(i + 1), teamName, managerName: `Manager ${i + 1}` })),
  scores: [1, 2, 3, 4].flatMap((week) =>
    [1, 2, 3, 4].map((team) => ({
      teamId: String(team),
      week,
      actual: 90 + team * 8,
      projected: null,
      starters: [],
    })),
  ),
  moves: [],
  playerNames: {},
  notes: [],
  draftPickTrades: 0,
  regularSeasonSchedule: {
    endWeek: 10,
    fixtures: [5, 6, 7, 8, 9, 10].flatMap((week) => [
      { week, homeTeamId: '1', awayTeamId: week % 2 ? '2' : '3' },
      { week, homeTeamId: '4', awayTeamId: week % 2 ? '3' : '2' },
    ]),
  },
  playoffSettings: { regularSeasonEnd: 10, playoffTeams: 2 },
  playoffProjection: {
    provider: 'Sleeper',
    week: 5,
    capturedAt: '2026-10-05T16:00:00Z',
    teamPoints: {},
    coveredStarters: 36,
    totalStarters: 36,
    optimizedLineup: true,
    weekly: [5, 6, 7, 8, 9, 10, 11].map((week) => {
      const positions = Object.fromEntries(
        [1, 2, 3, 4].map((team) => [
          String(team),
          { RB: 24 + team * 2, WR: 36 + (5 - team) * 3, QB: 18 + team, TE: 9 + team, K: 8, DEF: 7 },
        ]),
      );
      return {
        week,
        optimizedLineup: true,
        coveredStarters: 36,
        totalStarters: 36,
        positionPoints: positions,
        teamPoints: Object.fromEntries(
          Object.entries(positions).map(([team, points]) => [
            team,
            Object.values(points).reduce((a, b) => a + b, 0),
          ]),
        ),
      };
    }),
  },
});

export function SeasonStrengthPreview() {
  return <SeasonStrength data={strengthData} managedTeamId="1" />;
}
