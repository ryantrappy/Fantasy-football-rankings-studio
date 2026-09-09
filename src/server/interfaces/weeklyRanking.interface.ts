import { Team } from './teams.interface';

export interface WeeklyRanking {
  revision?: number;
  _id?: string;
  rankingsTitle: string;
  introduction: string;
  leagueId: string;
  week: number;
  year: number;
  teams: TeamRanking[];
}

export interface TeamRanking extends Team {
  description: string;
  position: number;
  delta?: number;
}
