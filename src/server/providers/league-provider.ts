import { League, LeagueInfo } from '../interfaces/league.interface';
import { Matchup, Team } from '../interfaces/teams.interface';

export interface LeagueProvider {
  getLeague(league: League, seasonId: number): Promise<LeagueInfo>;
  getTeams(league: League, seasonId: number, week: number): Promise<Team[]>;
  getMatchups(league: League, seasonId: number, week: number): Promise<Matchup[]>;
}
