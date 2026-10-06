import { useContext, useEffect } from 'react';
import { useRouter, useRouterState, useSearch } from '@tanstack/react-router';
import { ApiContext } from '../auth/session';
import { useInsightsApi } from '../auth/InsightsAccess';
import { defaultSeason } from '../util/rankings';

export function WorkspacePreloader({ shared }: { shared: boolean }) {
  const router = useRouter();
  const api = useContext(ApiContext);
  const insightsApi = useInsightsApi();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false });
  const { leagueId, year, week, years } = search;
  const yearsKey = JSON.stringify(years);
  useEffect(() => {
    if (!shared && !api) return;
    if (!shared)
      router.update({
        context: { ...router.options.context, sessionApi: api!, sessionInsightsApi: insightsApi },
      });
    async function preload() {
      const reportSearch = { leagueId: leagueId || '', year: year ?? defaultSeason() };
      const historySearch = { leagueId: leagueId || '', ...(years ? { years } : {}) };
      const targets = shared
        ? [
            {
              path: '/shared/insights',
              load: () => router.preloadRoute({ to: '/shared/insights', search: reportSearch }),
            },
            {
              path: '/shared/playoffs',
              load: () => router.preloadRoute({ to: '/shared/playoffs', search: reportSearch }),
            },
            {
              path: '/shared/history',
              load: () => router.preloadRoute({ to: '/shared/history', search: historySearch }),
            },
          ]
        : [
            {
              path: '/',
              load: () =>
                router.preloadRoute({
                  to: '/',
                  search: { leagueId, year, week },
                }),
            },
            {
              path: '/players',
              load: () => router.preloadRoute({ to: '/players', search: { leagueId, year } }),
            },
            { path: '/trades', load: () => router.preloadRoute({ to: '/trades' }) },
            { path: '/overview', load: () => router.preloadRoute({ to: '/overview' }) },
            { path: '/live', load: () => router.preloadRoute({ to: '/live' }) },
            {
              path: '/insights',
              load: () => router.preloadRoute({ to: '/insights', search: reportSearch }),
            },
            {
              path: '/playoffs',
              load: () => router.preloadRoute({ to: '/playoffs', search: reportSearch }),
            },
            {
              path: '/history',
              load: () => router.preloadRoute({ to: '/history', search: historySearch }),
            },
          ];
      await Promise.allSettled(
        targets.filter((target) => target.path !== pathname).map((target) => target.load()),
      );
    }
    // Warm code and data without holding the current page's render behind other tabs.
    void preload().catch(() => {});
    return () => {
      if (!shared && router.options.context.sessionApi === api)
        router.update({
          context: {
            ...router.options.context,
            sessionApi: undefined,
            sessionInsightsApi: undefined,
          },
        });
    };
    // The serialized years avoid rerunning this effect for equivalent search arrays.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [router, api, insightsApi, shared, pathname, leagueId, year, week, yearsKey]);
  return null;
}
