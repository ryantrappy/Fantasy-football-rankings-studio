import type { League, LeagueApi, WeeklyRanking } from '../../src/types';
import type { SeasonInsights } from '../../src/insights';
export const league: League = {
  leagueId: '123',
  leagueName: 'Sunday League',
  leagueType: 0,
  seasonId: 2026,
};
export const ranking: WeeklyRanking = {
  _id: 'saved',
  leagueId: '123',
  year: 2026,
  week: 2,
  rankingsTitle: 'Week 2 · The contenders',
  introduction: 'A new week. A new pecking order.\nEvery point counts.',
  teams: ['Fourth & Long', 'Sunday Stunners', 'End Zone Experts', 'The Underdogs'].map(
    (teamName, i) => ({
      teamId: String(i + 1),
      teamName,
      managerName: `Manager ${i + 1}`,
      wins: 3 - i,
      loss: i,
      ties: i === 3 ? 1 : 0,
      position: i + 1,
      description:
        i === 0
          ? 'A statement win puts them on top.\nCan they keep the momentum?'
          : 'The season is young, and there is still plenty to prove.',
    }),
  ),
};
export const history: WeeklyRanking[] = [
  {
    ...ranking,
    _id: 'previous',
    week: 1,
    teams: [ranking.teams[1], ranking.teams[0], ranking.teams[2]].map((team, i) => ({
      ...team,
      position: i + 1,
    })),
  },
];
export const playoffData: SeasonInsights = {
  completedWeek: 4,
  generatedAt: '2026-09-18T00:00:00Z',
  playoffSettings: { regularSeasonEnd: 10, playoffTeams: 2 },
  teams: ranking.teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    managerName: team.managerName,
  })) as SeasonInsights['teams'],
  scores: Array.from({ length: 4 }, (_, index) => index + 1).flatMap((week) =>
    ranking.teams.map((team, index) => ({
      teamId: team.teamId,
      week,
      actual: 90 + index * 8 + week * 2,
      projected: null,
      starters: [],
      opponentTeamId: ranking.teams[index ^ 1].teamId,
    })),
  ),
  pickups: [],
  trades: [],
  tradeComparisons: [],
  notes: [],
};
export const api: LeagueApi = {
  listLeagues: async () => [league],
  createLeague: async (value) => value,
  getLeagueInfo: async () => ({
    ...league,
    teamCount: ranking.teams.length,
    maxWeek: 17,
    validWeeks: Array.from({ length: 17 }, (_, index) => index + 1),
    scheduleNote: 'Sleeper’s configured 2026 schedule runs from week 1 through week 17.',
  }),
  getTeams: async () => ranking.teams,
  getRankings: async () => [...history, ranking],
  saveRanking: async (value) => value,
};
