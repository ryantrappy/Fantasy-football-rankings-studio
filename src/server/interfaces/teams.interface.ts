export interface Team {
  teamId: string;
  teamName: string;
  managerName: string;
  managerKey?: string;
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
