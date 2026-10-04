export enum LeagueType {
  Sleeper = 0,
  Espn = 1,
}

export interface League {
  providerLeagueId?: string;
  _id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: LeagueType;
  seasonId: number;
  ownerSubject?: string;
  publicReports?: boolean;
  managedTeams?: Record<string, { teamId: string; managerKey: string }>;
}

export interface LeagueInfo extends League {
  teamCount?: number;
  maxWeek: number;
  validWeeks: number[];
  scheduleNote: string;
}
