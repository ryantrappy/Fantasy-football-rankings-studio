import type { RouterContext } from './router-context';
import type { PublicInsightsApi } from './api/public-insights';
import type { StudioSearch } from './studio-selection';
import {
  preferredStudioWeek,
  readStudioSelection,
  resolveStudioSelection,
} from './studio-selection';
import { safeWeek, weekChoices } from './week-options';
import { defaultSeason } from './util/rankings';

type Tab = 'studio' | 'players' | 'insights' | 'history' | 'live' | 'trades' | 'overview';
type Scope = StudioSearch & { years?: number[] };

export async function warmReport(
  api: Pick<PublicInsightsApi, 'getInsights' | 'getLeagueSeasons'>,
  scope: Scope,
  history = false,
) {
  if (!scope.leagueId) return;
  if (!history) {
    await Promise.allSettled([
      api.getInsights(scope.leagueId, scope.year ?? defaultSeason()),
      api.getLeagueSeasons(scope.leagueId),
    ]);
    return;
  }
  const catalog = await api.getLeagueSeasons(scope.leagueId);
  const prior = catalog.years.filter((year) => year < defaultSeason());
  const years = scope.years ?? (prior.length ? prior : catalog.years).slice(0, 3);
  // Match the page's bounded default; do not fetch every historical season.
  for (let offset = 0; offset < years.length; offset += 3)
    await Promise.allSettled(
      years.slice(offset, offset + 3).map((year) => api.getInsights(scope.leagueId!, year)),
    );
}

export async function warmTab(tab: Tab, context: RouterContext, scope: Scope = {}) {
  const api = context.sessionApi;
  if (!api) return;
  // A failed background read must leave the page's retry/error UI available.
  try {
    const leagues = await (context.sessionInsightsApi ?? api).listLeagues();
    if (tab === 'live' || tab === 'trades' || tab === 'overview') {
      const live = await api.getLiveMatchups();
      for (let offset = 0; offset < leagues.length; offset += 3) {
        await Promise.allSettled(
          leagues.slice(offset, offset + 3).map(async (league) => {
            const selection = await api.managedTeam?.get(league.leagueId, league.seasonId);
            if (tab !== 'overview' || !selection?.teamId) return;
            const scores = live.find(
              (entry) =>
                entry.leagueId === league.leagueId &&
                entry.season === league.seasonId &&
                !entry.error,
            );
            await Promise.allSettled([
              api.getInsights(league.leagueId, league.seasonId),
              ...(scores ? [api.getTeams(league.leagueId, league.seasonId, scores.week)] : []),
            ]);
          }),
        );
      }
      return;
    }
    if (tab === 'insights' || tab === 'history') {
      const leagueId = scope.leagueId || leagues[0]?.leagueId;
      if (!leagueId) return;
      const reportApi =
        context.sessionInsightsApi ??
        (leagues.some((league) => league.leagueId === leagueId) ? api : context.publicInsightsApi);
      await warmReport(reportApi, { ...scope, leagueId }, tab === 'history');
      return;
    }
    if (tab === 'players') {
      const league = leagues.find((entry) => entry.leagueId === scope.leagueId) ?? leagues[0];
      const leagueId = scope.leagueId || league?.leagueId;
      if (!leagueId) return;
      await Promise.allSettled([
        api.getInsights(leagueId, scope.year ?? league?.seasonId ?? defaultSeason()),
        api.getLiveMatchups(),
      ]);
      return;
    }
    const selection = resolveStudioSelection(leagues, scope, readStudioSelection(api.subject));
    if (!selection) return;
    const { leagueId, year } = selection;
    const [info, rankings] = await Promise.all([
      api.getLeagueInfo(leagueId, year),
      api.getRankings(leagueId),
    ]);
    const week = safeWeek(
      preferredStudioWeek(selection.week, scope.week, info),
      weekChoices(info.validWeeks, rankings, year),
    );
    if (!week || rankings.some((ranking) => ranking.year === year && ranking.week === week)) return;
    await Promise.allSettled([
      api.getTeams(leagueId, year, week),
      ...Array.from({ length: week - 1 }, (_, index) =>
        api.getMatchups?.(leagueId, year, index + 1),
      ),
    ]);
  } catch {
    // Errors are not cached as successful data; entering the tab retries normally.
  }
}
