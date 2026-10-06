export interface Team {
  teamId: string;
  teamName: string;
  managerName: string;
  managerKey?: string;
  divisionId?: string;
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
