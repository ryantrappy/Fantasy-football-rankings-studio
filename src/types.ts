export interface League {
  providerLeagueId?: string;
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

export interface Matchup {
  matchupId: string;
  homeTeamId: string;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number | null;
}

export interface TeamRanking extends Team {
  description: string;
  position: number;
}

export interface WeeklyRanking {
  revision?: number;
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
  createReportSnapshot?(
    input: import('./report-snapshot').SnapshotInput,
  ): Promise<{ publicId: string; savedAt: string }>;
  management?: {
    archived(): Promise<League[]>;
    archive(leagueId: string, archived: boolean): Promise<void>;
    rename(leagueId: string, leagueName: string): Promise<League>;
    updateProviderId(leagueId: string, providerLeagueId: string): Promise<League>;
    delete(leagueId: string): Promise<void>;
  };
  reportSharing?: {
    get(leagueId: string): Promise<boolean>;
    set(leagueId: string, enabled: boolean): Promise<boolean>;
  };
  revisions?: {
    list(id: string): Promise<{ savedAt: string; ranking: WeeklyRanking }[]>;
    restore(id: string, revision: number, expectedRevision: number): Promise<WeeklyRanking>;
  };
  publishing?: import('./publishing').PublishingApi;
  subject?: string;
  writing?: import('./writing').WritingApi;
  listLeagues(): Promise<League[]>;
  createLeague(league: Omit<League, '_id'>): Promise<League>;
  getLeagueInfo(
    leagueId: string,
    year: number,
  ): Promise<
    League & { teamCount?: number; maxWeek: number; validWeeks: number[]; scheduleNote: string }
  >;
  getTeams(leagueId: string, year: number, week: number): Promise<Team[]>;
  getMatchups(leagueId: string, year: number, week: number): Promise<Matchup[]>;
  getRankings(leagueId: string): Promise<WeeklyRanking[]>;
  saveRanking(ranking: WeeklyRanking): Promise<WeeklyRanking>;
}
