import axios from 'axios';
import HttpException from '../exceptions/HttpException';
import { League, LeagueInfo } from '../interfaces/league.interface';
import { Matchup, Team } from '../interfaces/teams.interface';
import { LeagueProvider } from './league-provider';

interface EspnData {
  id: number;
  settings?: { name?: string; size?: number };
  members?: { id: string; firstName?: string; lastName?: string; displayName?: string }[];
  teams?: {
    id: number;
    name?: string;
    location?: string;
    nickname?: string;
    owners?: string[];
    primaryOwner?: string;
    record?: { overall?: { wins?: number; losses?: number; ties?: number } };
  }[];
  schedule?: {
    id: number;
    matchupPeriodId: number;
    home?: { teamId: number; totalPoints: number };
    away?: { teamId: number; totalPoints: number };
  }[];
}

export type EspnAccess = 'public' | 'environment';

export default class EspnProvider implements LeagueProvider {
  constructor(private readonly access: EspnAccess = 'environment') {}

  async get<T extends { id: number } = EspnData>(
    leagueId: string,
    seasonId: number,
    views: string[],
    week?: number,
  ): Promise<T> {
    const params = new URLSearchParams();
    views.forEach((view) => params.append('view', view));
    if (week) params.set('scoringPeriodId', String(week));
    const headers: Record<string, string> = {};
    if (this.access === 'environment' && process.env.ESPN_S2 && process.env.SWID) {
      headers.Cookie = `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.SWID}`;
    }
    const { data } = await axios.get<T>(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}`,
      { params, headers, timeout: 10000 },
    );
    if (!data?.id)
      throw new HttpException(
        404,
        'League was not found on ESPN. Check its ID and privacy settings.',
      );
    return data;
  }

  async getLeague(league: League, seasonId: number): Promise<LeagueInfo> {
    const data = await this.get(league.leagueId, seasonId, ['mSettings']);
    return {
      ...league,
      leagueName: league.leagueName || data.settings?.name || `League ${league.leagueId}`,
      seasonId,
      teamCount: data.settings?.size,
      maxWeek: 18,
    };
  }

  async getTeams(league: League, seasonId: number, week: number): Promise<Team[]> {
    const data = await this.get(league.leagueId, seasonId, ['mTeam'], week);
    return (data.teams || []).map((team) => {
      const ownerIds = team.owners || (team.primaryOwner ? [team.primaryOwner] : []);
      const managerName =
        ownerIds
          .map((id) => {
            const member = data.members?.find((candidate) => candidate.id === id);
            return (
              [member?.firstName, member?.lastName].filter(Boolean).join(' ') || member?.displayName
            );
          })
          .filter(Boolean)
          .join(', ') || 'Unassigned manager';
      return {
        teamId: String(team.id),
        teamName:
          team.name ||
          [team.location, team.nickname].filter(Boolean).join(' ') ||
          `Team ${team.id}`,
        managerName,
        managerKey: ownerIds.length
          ? `espn:${ownerIds
              .map((id) => id.toLowerCase())
              .sort()
              .join(',')}`
          : undefined,
        wins: team.record?.overall?.wins ?? 0,
        loss: team.record?.overall?.losses ?? 0,
        ties: team.record?.overall?.ties ?? 0,
      };
    });
  }

  async getMatchups(league: League, seasonId: number, week: number): Promise<Matchup[]> {
    const data = await this.get(league.leagueId, seasonId, ['mMatchup'], week);
    return (data.schedule || [])
      .filter((matchup) => matchup.matchupPeriodId === week && matchup.home)
      .map((matchup) => ({
        matchupId: String(matchup.id),
        homeTeamId: String(matchup.home!.teamId),
        awayTeamId: matchup.away ? String(matchup.away.teamId) : null,
        homeScore: matchup.home!.totalPoints ?? 0,
        awayScore: matchup.away ? (matchup.away.totalPoints ?? 0) : null,
      }));
  }
}
