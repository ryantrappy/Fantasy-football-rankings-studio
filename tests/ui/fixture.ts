import type { League, LeagueApi, WeeklyRanking } from '../../src/types';
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
export const api: LeagueApi = {
  listLeagues: async () => [league],
  createLeague: async (value) => value,
  getTeams: async () => ranking.teams,
  getRankings: async () => [...history, ranking],
  saveRanking: async (value) => value,
};
