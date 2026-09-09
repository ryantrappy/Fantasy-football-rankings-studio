import axios from 'axios';
import HttpException from '../exceptions/HttpException';
import { League, LeagueInfo } from '../interfaces/league.interface';
import { Matchup, Team } from '../interfaces/teams.interface';
import { LeagueProvider } from './league-provider';

interface SleeperLeagueData {
  league_id: string;
  name: string;
  season: string;
  previous_league_id?: string;
  total_rosters: number;
  settings?: { last_scored_leg?: number; playoff_week_start?: number; start_week?: number };
}
interface Roster {
  roster_id: number;
  owner_id?: string;
  settings?: { wins?: number; losses?: number; ties?: number };
}
interface User {
  user_id: string;
  display_name?: string;
  metadata?: { team_name?: string };
}
interface SleeperMatchup {
  matchup_id: number | null;
  roster_id: number;
  points: number;
  custom_points?: number | null;
}

export default class SleeperProvider implements LeagueProvider {
  async get<T>(path: string): Promise<T> {
    const response = await axios.get<T>(`https://api.sleeper.app/v1/league/${path}`, {
      timeout: 10000,
    });
    return response.data;
  }

  async resolveSeason(leagueId: string, seasonId: number): Promise<SleeperLeagueData> {
    let id = leagueId;
    const visited = new Set<string>();
    while (id && !visited.has(id) && visited.size < 30) {
      visited.add(id);
      const league = await this.get<SleeperLeagueData>(id);
      if (!league)
        throw new HttpException(404, 'League was not found on Sleeper. Check the league ID.');
      if (Number(league.season) === seasonId) return league;
      if (Number(league.season) < seasonId) break;
      id = league.previous_league_id || '';
    }
    throw new HttpException(
      404,
      `This league has no linked ${seasonId} season. Use the league ID for that season.`,
    );
  }

  async getLeague(league: League, seasonId: number): Promise<LeagueInfo> {
    const data = await this.resolveSeason(league.leagueId, seasonId);
    return {
      ...league,
      leagueName: league.leagueName || data.name,
      seasonId,
      teamCount: data.total_rosters,
      maxWeek: 18,
    };
  }

  async getTeams(league: League, seasonId: number, _week: number): Promise<Team[]> {
    const data = await this.resolveSeason(league.leagueId, seasonId);
    const [rosters, users] = await Promise.all([
      this.get<Roster[]>(`${data.league_id}/rosters`),
      this.get<User[]>(`${data.league_id}/users`),
    ]);
    return rosters.map((roster) => {
      const user = users.find((candidate) => candidate.user_id === roster.owner_id);
      return {
        teamId: String(roster.roster_id),
        teamName: user?.metadata?.team_name || user?.display_name || `Team ${roster.roster_id}`,
        managerName: user?.display_name || 'Unassigned manager',
        managerKey: roster.owner_id ? `sleeper:${roster.owner_id}` : undefined,
        wins: roster.settings?.wins ?? 0,
        loss: roster.settings?.losses ?? 0,
        ties: roster.settings?.ties ?? 0,
      };
    });
  }

  async getMatchups(league: League, seasonId: number, week: number): Promise<Matchup[]> {
    const data = await this.resolveSeason(league.leagueId, seasonId);
    const rows = await this.get<SleeperMatchup[]>(`${data.league_id}/matchups/${week}`);
    const groups = new Map<string, SleeperMatchup[]>();
    for (const row of rows) {
      const id = row.matchup_id == null ? `bye-${row.roster_id}` : String(row.matchup_id);
      groups.set(id, [...(groups.get(id) || []), row]);
    }
    return [...groups.entries()].map(([id, [home, away]]) => ({
      matchupId: id,
      homeTeamId: String(home.roster_id),
      awayTeamId: away ? String(away.roster_id) : null,
      homeScore: home.custom_points ?? home.points ?? 0,
      awayScore: away ? (away.custom_points ?? away.points ?? 0) : null,
    }));
  }
}
