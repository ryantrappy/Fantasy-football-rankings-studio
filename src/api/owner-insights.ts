import type { createApi } from './client';
import type { createPublicInsightsApi } from './public-insights';
export type PrivateInsightsApi = Pick<
  ReturnType<typeof createApi>,
  'listLeagues' | 'getLeagueSeasons' | 'getInsights'
>;

export function withOwnerInsights(
  publicApi: ReturnType<typeof createPublicInsightsApi>,
  privateApi: PrivateInsightsApi,
) {
  // This only selects the endpoint; private endpoints still enforce ownership on the server.
  let ownedIds = new Set<string>();
  return {
    ...publicApi,
    listLeagues: async () => {
      ownedIds = new Set();
      const leagues = await privateApi.listLeagues();
      ownedIds = new Set(leagues.map((league) => league.leagueId));
      // Pages may append a shared league to the picker without granting private access.
      return [...leagues];
    },
    getLeagueSeasons: (leagueId: string) =>
      ownedIds.has(leagueId)
        ? privateApi.getLeagueSeasons(leagueId)
        : publicApi.getLeagueSeasons(leagueId),
    getInsights: (leagueId: string, year: number, refresh = false) =>
      ownedIds.has(leagueId)
        ? privateApi.getInsights(leagueId, year, refresh)
        : publicApi.getInsights(leagueId, year, refresh),
  };
}
