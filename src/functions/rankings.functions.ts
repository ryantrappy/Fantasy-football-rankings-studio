import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute, operations } from '../server/operations.server';
import type { League, WeeklyRanking } from '../types';

async function run<T>(action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await execute(getRequestHeader('Authorization'), action);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
// The input validator preserves type inference; runtime schemas run after authentication in operations.
export const listLeagues = createServerFn({ method: 'GET' }).handler(() =>
  run(operations.listLeagues),
);
export const createLeague = createServerFn({ method: 'POST' })
  .validator((data: Omit<League, '_id'>) => data)
  .handler(({ data }) => run((owner) => operations.createLeague(owner, data)));
export const getLeague = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run((owner) => operations.getLeague(owner, data)));
export const getLeagueInfo = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number }) => data)
  .handler(({ data }) => run((owner) => operations.getLeagueInfo(owner, data)));
export const getTeams = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number; week: number }) => data)
  .handler(({ data }) => run((owner) => operations.getTeams(owner, data)));
export const getMatchups = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number; week: number }) => data)
  .handler(({ data }) => run((owner) => operations.getMatchups(owner, data)));
export const getRankings = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run((owner) => operations.getRankings(owner, data)));
export const getRanking = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(({ data }) => run((owner) => operations.getRanking(owner, data)));
export const saveRanking = createServerFn({ method: 'POST' })
  .validator((data: WeeklyRanking) => data)
  .handler(({ data }) => run((owner) => operations.saveRanking(owner, data)));
export const updateRankingByWeek = createServerFn({ method: 'POST' })
  .validator(
    (data: { leagueId: string; year: number; week: number; ranking: WeeklyRanking }) => data,
  )
  .handler(({ data }) => run((owner) => operations.updateRankingByWeek(owner, data)));

export const getInsights = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number }) => data)
  .handler(({ data }) => run((owner) => operations.getInsights(owner, data)));

export const getLeagueSeasons = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run((owner) => operations.getLeagueSeasons(owner, data)));
