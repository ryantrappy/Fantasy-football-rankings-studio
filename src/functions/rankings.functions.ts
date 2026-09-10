import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute, operations } from '../server/operations.server';
import type { League, WeeklyRanking } from '../types';

async function run<T>(operation: string, action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await execute(getRequestHeader('Authorization'), action, operation);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
// The input validator preserves type inference; runtime schemas run after authentication in operations.
export const listLeagues = createServerFn({ method: 'GET' }).handler(() =>
  run('listLeagues', operations.listLeagues),
);
export const createLeague = createServerFn({ method: 'POST' })
  .validator((data: Omit<League, '_id'>) => data)
  .handler(({ data }) => run('createLeague', (owner) => operations.createLeague(owner, data)));
export const getLeague = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run('getLeague', (owner) => operations.getLeague(owner, data)));
export const getLeagueInfo = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number }) => data)
  .handler(({ data }) => run('getLeagueInfo', (owner) => operations.getLeagueInfo(owner, data)));
export const getTeams = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number; week: number }) => data)
  .handler(({ data }) => run('getTeams', (owner) => operations.getTeams(owner, data)));
export const getMatchups = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number; week: number }) => data)
  .handler(({ data }) => run('getMatchups', (owner) => operations.getMatchups(owner, data)));
export const getRankings = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) => run('getRankings', (owner) => operations.getRankings(owner, data)));
export const getRanking = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(({ data }) => run('getRanking', (owner) => operations.getRanking(owner, data)));
export const saveRanking = createServerFn({ method: 'POST' })
  .validator((data: WeeklyRanking) => data)
  .handler(({ data }) => run('saveRanking', (owner) => operations.saveRanking(owner, data)));
export const updateRankingByWeek = createServerFn({ method: 'POST' })
  .validator(
    (data: { leagueId: string; year: number; week: number; ranking: WeeklyRanking }) => data,
  )
  .handler(({ data }) =>
    run('updateRankingByWeek', (owner) => operations.updateRankingByWeek(owner, data)),
  );

export const getInsights = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string; year: number }) => data)
  .handler(({ data }) => run('getInsights', (owner) => operations.getInsights(owner, data)));

export const getLeagueSeasons = createServerFn({ method: 'GET' })
  .validator((data: { leagueId: string }) => data)
  .handler(({ data }) =>
    run('getLeagueSeasons', (owner) => operations.getLeagueSeasons(owner, data)),
  );

export const getEspnCredentialStatus = createServerFn({ method: 'GET' }).handler(() =>
  run('getEspnCredentialStatus', operations.getEspnCredentialStatus),
);
export const saveEspnCredentials = createServerFn({ method: 'POST' })
  .validator((data: import('../espn-credentials').EspnCredentials) => data)
  .handler(({ data }) =>
    run('saveEspnCredentials', (owner) => operations.saveEspnCredentials(owner, data)),
  );
export const removeEspnCredentials = createServerFn({ method: 'POST' }).handler(() =>
  run('removeEspnCredentials', operations.removeEspnCredentials),
);
export const skipEspnSetup = createServerFn({ method: 'POST' }).handler(() =>
  run('skipEspnSetup', operations.skipEspnSetup),
);

export const getRankingRevisions = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(({ data }) =>
    run('getRankingRevisions', (owner) => operations.getRankingRevisions(owner, data)),
  );
export const restoreRankingRevision = createServerFn({ method: 'POST' })
  .validator((data: { id: string; revision: number; expectedRevision: number }) => data)
  .handler(({ data }) =>
    run('restoreRankingRevision', (owner) => operations.restoreRankingRevision(owner, data)),
  );
