import { unavailableRecords, withHistoricalRecords, type RecordGame } from './historical-records';
import axios from 'axios';
import type { EspnCredentials } from '../../espn-credentials';
import HttpException from '../exceptions/HttpException';
import { League, LeagueInfo } from '../interfaces/league.interface';
import { Matchup, Team } from '../interfaces/teams.interface';
import { LeagueProvider } from './league-provider';

interface EspnData {
  id: number;
  settings?: {
    name?: string;
    size?: number;
    scheduleSettings?: {
      matchupPeriods?: Record<string, number[]>;
      matchupPeriodCount?: number;
      matchupPeriodLength?: number;
    };
    scoringSettings?: { scoringType?: string };
  };
  status?: { latestScoringPeriod?: number; finalScoringPeriod?: number };
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
    winner?: string;
    playoffTierType?: string;
    home?: { teamId: number; totalPoints: number };
    away?: { teamId: number; totalPoints: number };
  }[];
}

export type EspnAccess = 'public' | Readonly<EspnCredentials>;

export default class EspnProvider implements LeagueProvider {
  constructor(private readonly access: EspnAccess = 'public') {}

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
    if (this.access !== 'public') {
      headers.Cookie = `espn_s2=${this.access.espnS2}; SWID=${this.access.swid}`;
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

  async getHistoricalTeams(league: League, seasonId: number, week: number): Promise<Team[]> {
    const data = await this.get(league.leagueId, seasonId, ['mSettings', 'mMatchup', 'mStatus']);
    const teams = await this.getTeams(league, seasonId, week);
    const settings = data.settings?.scheduleSettings;
    const count = settings?.matchupPeriodCount;
    const latest = data.status?.latestScoringPeriod;
    const final = data.status?.finalScoringPeriod;
    if (!count || !latest || !final || !Array.isArray(data.schedule)) unavailableRecords();
    if (data.settings?.scoringSettings?.scoringType !== 'H2H_POINTS') unavailableRecords();
    const cutoff = Math.min(week, latest - 1, final);
    const games: RecordGame[] = [];
    for (let period = 1; period <= count; period++) {
      const weeks =
        settings?.matchupPeriods?.[String(period)] ||
        (settings?.matchupPeriodLength === 1 ? [period] : undefined);
      if (!weeks?.length || weeks.some((w) => !Number.isInteger(w))) unavailableRecords();
      if (Math.max(...weeks) > cutoff) continue;
      const matches = data.schedule.filter(
        (m) => m.matchupPeriodId === period && (!m.playoffTierType || m.playoffTierType === 'NONE'),
      );
      if (!matches.length) unavailableRecords();
      const represented = new Set<string>();
      for (const match of matches) {
        if (match.home) represented.add(String(match.home.teamId));
        if (match.away) represented.add(String(match.away.teamId));
        if (!match.home || !match.away) continue;
        if (!['HOME', 'AWAY', 'TIE'].includes(match.winner || '')) unavailableRecords();
        games.push({
          home: String(match.home.teamId),
          away: String(match.away.teamId),
          homeScore: match.home.totalPoints,
          awayScore: match.away.totalPoints,
          winner: match.winner as RecordGame['winner'],
        });
      }
      if (teams.some((t) => !represented.has(t.teamId))) unavailableRecords();
    }
    return withHistoricalRecords(teams, games);
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
