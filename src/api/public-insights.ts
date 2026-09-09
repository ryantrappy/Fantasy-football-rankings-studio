import { QueryClient } from '@tanstack/query-core';
import * as functions from '../functions/public-insights.functions';
import { ApiError } from './client';
import type { League } from '../types';
import type { OperationResult } from '../server/operations.server';
function unwrap<T>(result: OperationResult<T>): T {
  if (!result.ok) throw new ApiError(result.error.message, result.error.status);
  return result.data;
}
export function createPublicInsightsApi() {
  const queries = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 300000 } },
  });
  return {
    listLeagues: async (): Promise<League[]> => [],
    getLeague: (leagueId: string) =>
      queries.fetchQuery({
        queryKey: ['public-league', leagueId],
        queryFn: async ({ signal }) =>
          unwrap(await functions.getPublicLeague({ data: { leagueId }, signal })),
      }),
    getLeagueSeasons: (leagueId: string) =>
      queries.fetchQuery({
        queryKey: ['public-seasons', leagueId],
        queryFn: async ({ signal }) =>
          unwrap(await functions.getPublicLeagueSeasons({ data: { leagueId }, signal })),
      }),
    getInsights: async (leagueId: string, year: number, refresh = false) => {
      const queryKey = ['public-insights', leagueId, year];
      if (refresh) await queries.invalidateQueries({ queryKey });
      return queries.fetchQuery({
        queryKey,
        queryFn: async ({ signal }) =>
          unwrap(await functions.getPublicInsights({ data: { leagueId, year }, signal })),
      });
    },
    dispose: () => queries.clear(),
  };
}
