export interface League {
  _id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: 0 | 1;
  seasonId: number;
}

export interface Team {
  teamId: string;
  teamName: string;
  managerName: string;
  wins: number;
  loss: number;
  ties: number;
}

export interface TeamRanking extends Team {
  description: string;
  position: number;
}

export interface WeeklyRanking {
  _id?: string;
  leagueId: string;
  leagueName?: string;
  rankingsTitle: string;
  introduction: string;
  week: number;
  year: number;
  teams: TeamRanking[];
}

export interface LeagueApi {
  subject?: string;
  writing?: import('./writing').WritingApi;
  listLeagues(): Promise<League[]>;
  createLeague(league: Omit<League, '_id'>): Promise<League>;
  getTeams(leagueId: string, year: number, week: number): Promise<Team[]>;
  getRankings(leagueId: string): Promise<WeeklyRanking[]>;
  saveRanking(ranking: WeeklyRanking): Promise<WeeklyRanking>;
}
