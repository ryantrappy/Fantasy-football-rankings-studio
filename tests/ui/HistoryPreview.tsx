import { HistoryAnalytics } from '../../src/components/history/HistoryAnalytics';
import { calculateInsights } from '../../src/server/insights/calculate';

const teams = ['Alex', 'Blair', 'Casey', 'Devon'].map((managerName, index) => ({
  teamId: String(index + 1),
  managerKey: `manager-${index}`,
  managerName,
  teamName: `${managerName}'s team`,
}));
const records = [2024, 2025].map((year) => ({
  year,
  data: calculateInsights({
    completedWeek: 4,
    reportingStartWeek: 1,
    playoffSettings: { regularSeasonEnd: 4, playoffTeams: 2 },
    teams,
    results: teams.map((team, index) => ({
      teamId: team.teamId,
      playoff: index < 2,
      finish: index + 1,
      champion: index === 0,
      lastPlace: index === 3,
    })),
    scores: Array.from({ length: 4 }, (_, index) => index + 1).flatMap((week) =>
      teams.map((team, index) => ({
        teamId: team.teamId,
        week,
        actual: 110 - index * 8 + week * 2,
        projected: null,
        opponentTeamId: teams[index ^ 1].teamId,
        lineupAvailable: true,
        starters: [{ playerId: `player-${index}`, points: 25 + week }],
        players: [
          { playerId: `player-${index}`, points: 25 + week },
          { playerId: `bench-${index}`, points: 35 + week },
        ],
        bestLineup: { points: 120 - index * 8 + week * 2, correctStarts: 0, slots: 1 },
      })),
    ),
    moves: [
      {
        id: 'pickup',
        week: 1,
        timestamp: Date.UTC(year, 8, 8),
        type: 'pickup',
        playerId: 'player-0',
        from: null,
        to: '1',
      },
    ],
    moveCoverage: {
      weeks: [1, 2, 3, 4],
      types: ['pickup', 'drop', 'trade'],
      complete: false,
      note: 'Preview sample',
    },
    draftPicks: teams.map((team, index) => ({
      teamId: team.teamId,
      playerId: `player-${index}`,
      overallPick: index + 1,
    })),
    draftFormat: 'snake',
    draftCoverage: 'Preview sample',
    matchupArchive: [
      {
        week: 1,
        teamId: '1',
        opponentTeamId: '2',
        source: 'Demonstration archive',
        preMondayAt: `${year}-09-08T23:00:00Z`,
        snapshots: [
          { capturedAt: `${year}-09-08T23:00:00Z`, probability: 0.05, contributors: [] },
          {
            capturedAt: `${year}-09-09T23:00:00Z`,
            probability: 1,
            contributors: [{ playerId: 'player-0', points: 26 }],
          },
        ],
      },
    ],
    playerNames: Object.fromEntries(
      teams.map((_, index) => [`player-${index}`, `Player ${index + 1}`]),
    ),
    notes: ['Demonstration data'],
    draftPickTrades: 0,
  }),
}));

export function HistoryPreview() {
  return (
    <HistoryAnalytics records={records} years={[2025, 2024, 2023]} leagueId="preview" shared />
  );
}
