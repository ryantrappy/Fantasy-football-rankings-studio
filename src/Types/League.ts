export enum LeagueType {
  Sleeper,
  Espn,
}
export interface League {
  _id?: string;
  leagueId: string;
  leagueName?: string;
  leagueType: LeagueType;
}
