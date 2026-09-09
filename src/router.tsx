import { createRouter, defaultParseSearch } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    parseSearch: (search) => {
      const parsed = defaultParseSearch(search);
      // Provider IDs are strings, including long Sleeper IDs beyond safe integer precision.
      const leagueId = new URLSearchParams(search).get('leagueId');
      return { ...parsed, ...(leagueId && /^\d{1,30}$/.test(leagueId) ? { leagueId } : {}) };
    },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
