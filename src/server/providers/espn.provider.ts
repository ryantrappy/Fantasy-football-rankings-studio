import { unavailableRecords, withHistoricalRecords, type RecordGame } from './historical-records';
import axios from 'axios';
import type { EspnCredentials } from '../../espn-credentials';
import HttpException from '../exceptions/HttpException';
import { League, LeagueInfo } from '../interfaces/league.interface';
import { Matchup, Team } from '../interfaces/teams.interface';
import { LeagueProvider } from './league-provider';
import { defaultSeason } from '../../util/rankings';

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
    home?: { teamId: number; totalPoints: number; pointsByScoringPeriod?: Record<string, number> };
    away?: { teamId: number; totalPoints: number; pointsByScoringPeriod?: Record<string, number> };
  }[];
}

export type EspnAccess = 'public' | Readonly<EspnCredentials>;

export default class EspnProvider implements LeagueProvider {
  constructor(
    private readonly access: EspnAccess = 'public',
    private readonly apiBaseUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl',
  ) {}

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
      `${this.apiBaseUrl}/seasons/${seasonId}/segments/0/leagues/${leagueId}`,
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
    const data = await this.get(league.providerLeagueId ?? league.leagueId, seasonId, [
      'mSettings',
      'mStatus',
    ]);
    const configuredWeeks = Object.values(
      data.settings?.scheduleSettings?.matchupPeriods || {},
    ).flat();
    const lastWeek = Math.max(
      1,
      Math.min(
        seasonId >= 2021 ? 18 : 17,
        data.status?.finalScoringPeriod ||
          (configuredWeeks.length ? Math.max(...configuredWeeks) : seasonId >= 2021 ? 18 : 17),
      ),
    );
    const validWeeks = Array.from({ length: lastWeek }, (_, i) => i + 1);
    return {
      ...league,
      leagueName:
        league.leagueName ||
        data.settings?.name ||
        `League ${league.providerLeagueId ?? league.leagueId}`,
      seasonId,
      teamCount: data.settings?.size,
      maxWeek: lastWeek,
      currentWeek: data.status?.latestScoringPeriod,
      validWeeks,
      scheduleNote:
        seasonId === defaultSeason() && (data.status?.latestScoringPeriod ?? 1) <= 1
          ? `Preseason schedule: ESPN reports weeks 1–${lastWeek}; teams and matchups may remain empty until the league schedule is published.`
          : `ESPN reports scoring periods 1 through ${lastWeek} for ${seasonId}.`,
    };
  }

  async getTeams(league: League, seasonId: number, week: number): Promise<Team[]> {
    const data = await this.get(
      league.providerLeagueId ?? league.leagueId,
      seasonId,
      ['mTeam'],
      week,
    );
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
    const data = await this.get(league.providerLeagueId ?? league.leagueId, seasonId, [
      'mSettings',
      'mMatchup',
      'mStatus',
    ]);
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
    const data = await this.get(
      league.providerLeagueId ?? league.leagueId,
      seasonId,
      ['mSettings', 'mMatchup', 'mMatchupScore'],
      week,
    );
    const settings = data.settings?.scheduleSettings;
    const periods = new Map(Object.entries(settings?.matchupPeriods ?? {}));
    const count = settings?.matchupPeriodCount;
    if (
      settings?.matchupPeriodLength === 1 &&
      Number.isInteger(count) &&
      count! >= 1 &&
      count! <= 18
    )
      for (let period = 1; period <= count!; period++)
        if (!periods.has(String(period))) periods.set(String(period), [period]);
    const seen = new Set<number>();
    if (!periods.size) throw new HttpException(422, 'ESPN matchup calendar is unavailable.');
    for (const [id, weeks] of periods) {
      if (
        !/^[1-9]\d*$/.test(id) ||
        !Array.isArray(weeks) ||
        !weeks.length ||
        weeks.some(
          (value) => !Number.isInteger(value) || value < 1 || value > 18 || seen.has(value),
        )
      )
        throw new HttpException(422, 'ESPN matchup calendar is invalid or ambiguous.');
      for (const value of weeks) {
        if (seen.has(value))
          throw new HttpException(422, 'ESPN matchup calendar is invalid or ambiguous.');
        seen.add(value);
      }
    }
    const selected = [...periods].find(([, weeks]) => weeks.includes(week));
    if (!selected)
      throw new HttpException(
        422,
        'The selected scoring week is unavailable in ESPN’s matchup calendar.',
      );
    const [period, periodWeeks] = selected;
    return (data.schedule || [])
      .filter((matchup) => matchup.matchupPeriodId === Number(period) && matchup.home)
      .map((matchup) => {
        const homeWeekly = matchup.home!.pointsByScoringPeriod?.[String(week)];
        const awayWeekly = matchup.away?.pointsByScoringPeriod?.[String(week)];
        const weekly =
          Number.isFinite(homeWeekly) && (!matchup.away || Number.isFinite(awayWeekly));
        const home = weekly ? homeWeekly : matchup.home!.totalPoints;
        const away = matchup.away ? (weekly ? awayWeekly : matchup.away.totalPoints) : null;
        const available = Number.isFinite(home) && (!matchup.away || Number.isFinite(away));
        return {
          matchupId: String(matchup.id),
          homeTeamId: String(matchup.home!.teamId),
          awayTeamId: matchup.away ? String(matchup.away.teamId) : null,
          homeScore: available ? home! : null,
          awayScore: available ? away! : null,
          scoringWeek: week,
          matchupPeriodId: Number(period),
          periodWeeks,
          scoreContext: !available
            ? ('unavailable' as const)
            : weekly || periodWeeks.length === 1
              ? ('selected-week' as const)
              : ('matchup-period' as const),
        };
      });
  }
}
