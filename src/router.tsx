import { createRouter, defaultParseSearch, defaultStringifySearch } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { createPublicInsightsApi } from './api/public-insights';

export function getRouter() {
  return createRouter({
    routeTree,
    context: { publicInsightsApi: createPublicInsightsApi() },
    scrollRestoration: true,
    stringifySearch: (search) =>
      defaultStringifySearch(search).replace(/([?&]leagueId=)%22(\d{1,30})%22(?=&|$)/, '$1$2'),
    parseSearch: (search) => {
      const parsed = defaultParseSearch(search);
      // Provider IDs are strings, including long Sleeper IDs beyond safe integer precision.
      const rawLeagueId = new URLSearchParams(search).get('leagueId');
      const leagueId = rawLeagueId?.replace(/^"(.+)"$/, '$1');
      return { ...parsed, ...(leagueId && /^\d{1,30}$/.test(leagueId) ? { leagueId } : {}) };
    },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
