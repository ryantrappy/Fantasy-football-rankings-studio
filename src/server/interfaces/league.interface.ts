export enum LeagueType {
  Sleeper = 0,
  Espn = 1,
}

export interface League {
  _id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: LeagueType;
  seasonId: number;
  ownerSubject?: string;
  publicReports?: boolean;
}

export interface LeagueInfo extends League {
  teamCount?: number;
  maxWeek: number;
}
