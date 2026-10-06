export interface League {
  deleting?: boolean;
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
  homeScore: number | null;
  scoringWeek?: number;
  matchupPeriodId?: number;
  periodWeeks?: number[];
  scoreContext?: 'selected-week' | 'matchup-period' | 'unavailable';
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

export interface ManagedTeamSelection {
  teams: { teamId: string; teamName: string; managerName: string }[];
  teamId: string | null;
  needsReselection: boolean;
}

export interface LeagueApi {
  waivers?: { get(leagueId: string, year: number): Promise<import('./waivers').WaiverPool> };
  managedTeam?: {
    get(leagueId: string, year: number, refresh?: boolean): Promise<ManagedTeamSelection>;
    set(leagueId: string, year: number, teamId: string | null): Promise<ManagedTeamSelection>;
  };
  getLiveMatchups(refresh?: boolean): Promise<import('./live-matchups').LiveLeague[]>;
  getLiveLeague(leagueId: string, refresh?: boolean): Promise<import('./live-matchups').LiveLeague>;
  createReportSnapshot?(
    input: import('./report-snapshot').SnapshotInput,
  ): Promise<{ publicId: string; savedAt: string }>;
  management?: {
    deleting?(): Promise<League[]>;
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
    list(id: string, before?: number): Promise<{ savedAt: string; ranking: WeeklyRanking }[]>;
    restore(id: string, revision: number, expectedRevision: number): Promise<WeeklyRanking>;
  };
  publishing?: import('./publishing').PublishingApi;
  subject?: string;
  writing?: import('./writing').WritingApi;
  listLeagues(refresh?: boolean): Promise<League[]>;
  createLeague(league: Omit<League, '_id'>): Promise<League>;
  getLeagueInfo(
    leagueId: string,
    year: number,
    refresh?: boolean,
  ): Promise<
    League & {
      isCurrentSeason?: boolean;
      defaultWeek?: number;
      defaultWeekNote?: string;
      teamCount?: number;
      maxWeek: number;
      validWeeks: number[];
      scheduleNote: string;
    }
  >;
  getTeams(leagueId: string, year: number, week: number, refresh?: boolean): Promise<Team[]>;
  getMatchups(leagueId: string, year: number, week: number, refresh?: boolean): Promise<Matchup[]>;
  getRankings(leagueId: string, refresh?: boolean): Promise<WeeklyRanking[]>;
  saveRanking(ranking: WeeklyRanking): Promise<WeeklyRanking>;
}
