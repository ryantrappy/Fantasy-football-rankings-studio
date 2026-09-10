import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader, setResponseStatus } from '@tanstack/react-start/server';
import { executePublic } from '../server/operations.server';
import { publicInsights } from '../server/public-insights.server';

async function run<T>(operation: string, action: () => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await executePublic(action, operation);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
export const getPublicLeague = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run('public.getLeague', () => publicInsights.getLeague(data)));
export const getPublicLeagueSeasons = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) =>
    run('public.getLeagueSeasons', () => publicInsights.getLeagueSeasons(data)),
  );
export const getPublicInsights = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number }) => data)
  .handler(({ data }) => run('public.getInsights', () => publicInsights.getInsights(data)));
