import type { League, LeagueApi, ManagedTeamSelection, Team } from './types';
import type { SeasonInsights } from './insights';
import type { LiveLeague, LiveMatchup } from './live-matchups';
import { forecastPlayoffs } from './playoff-forecast';

export interface OverviewApi extends Pick<
  LeagueApi,
  'listLeagues' | 'getLiveMatchups' | 'getTeams'
> {
  managedTeam: NonNullable<LeagueApi['managedTeam']>;
  getInsights(leagueId: string, year: number): Promise<SeasonInsights>;
}
export interface WeeklyOverviewRow {
  league: League;
  week: number | null;
  selection?: ManagedTeamSelection;
  team?: Team;
  matchup?: LiveMatchup;
  playoff: number | null;
  refreshedAt?: string;
  completedWeek?: number;
  notices: string[];
}
export async function loadWeeklyOverview(api: OverviewApi): Promise<WeeklyOverviewRow[]> {
  const leagues = await api.listLeagues();
  if (!leagues.length) return [];
  const live = await api.getLiveMatchups().catch(() => [] as LiveLeague[]);
  const rows: WeeklyOverviewRow[] = [];
  // Three concurrent league reads at most; no automatic full-report refresh.
  for (let offset = 0; offset < leagues.length; offset += 3) {
    rows.push(
      ...(await Promise.all(
        leagues.slice(offset, offset + 3).map(async (league) => {
          const scores = live.find(
            (entry) => entry.leagueId === league.leagueId && entry.season === league.seasonId,
          );
          const row: WeeklyOverviewRow = {
            league,
            week: scores && !scores.error ? scores.week : null,
            playoff: null,
            notices: [],
          };
          try {
            row.selection = await api.managedTeam.get(league.leagueId, league.seasonId);
          } catch {
            row.notices.push('Your team selection is unavailable.');
            return row;
          }
          if (!row.selection.teamId) {
            if (row.selection.needsReselection)
              row.notices.push('Choose your team again: its roster or manager changed.');
            return row;
          }
          if (!scores || scores.error) row.notices.push('Current week and matchup unavailable.');
          row.matchup = scores?.matchups.find((matchup) =>
            [matchup.home.teamId, matchup.away?.teamId].includes(row.selection!.teamId!),
          );
          if (scores && !scores.error && !row.matchup)
            row.notices.push('No matchup is available for this scoring period.');
          const [teams, report] = await Promise.allSettled([
            row.week === null
              ? Promise.resolve([] as Team[])
              : api.getTeams(league.leagueId, league.seasonId, row.week),
            api.getInsights(league.leagueId, league.seasonId),
          ]);
          if (teams.status === 'fulfilled')
            row.team = teams.value.find((team) => team.teamId === row.selection!.teamId);
          if (!row.team) row.notices.push('Current record unavailable.');
          if (report.status === 'fulfilled') {
            row.refreshedAt = report.value.generatedAt;
            row.completedWeek = report.value.completedWeek;
            row.notices.push(
              ...(report.value.partialFailures ?? []).map((failure) => failure.message),
            );
            if (report.value.playoffSettings) {
              const forecast = forecastPlayoffs(
                report.value,
                report.value.playoffSettings,
                report.value.completedWeek,
                2000,
              );
              if (!forecast.reason)
                row.playoff =
                  forecast.rows.find((team) => team.teamId === row.selection!.teamId)?.playoff ??
                  null;
              else row.notices.push(forecast.reason);
            }
          } else row.notices.push('Season and playoff context unavailable.');
          return row;
        }),
      )),
    );
  }
  return rows;
}
