import * as publishingFunctions from '../functions/publishing.functions';
import * as writingFunctions from '../functions/writing.functions';
import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { QueryClient } from '@tanstack/query-core';
import * as functions from '../functions/rankings.functions';
import * as profile from '../functions/profile.functions';
import type { League, LeagueApi, WeeklyRanking } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function unwrap<T>(
  result: { ok: true; data: T } | { ok: false; error: { status: number; message: string } },
): T {
  if (!result.ok) throw new ApiError(result.error.message, result.error.status);
  return result.data;
}
// Constructed inside an authenticated session, never shared across users or SSR requests.
export function createApi(getToken: () => Promise<string>, subject?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30000 } },
  });
  const headers = async () => ({ Authorization: `Bearer ${await getToken()}` });
  const leagueCollection = createCollection(
    queryCollectionOptions({
      queryKey: [subject, 'leagues'],
      queryClient,
      queryFn: async ({ signal }) =>
        unwrap(await functions.listLeagues({ headers: await headers(), signal })),
      getKey: (league: League) => league.leagueId,
      startSync: false,
    }),
  );
  function makeRankingCollection(leagueId: string) {
    return createCollection(
      queryCollectionOptions({
        queryKey: [subject, 'rankings', leagueId],
        queryClient,
        queryFn: async ({ signal }) =>
          unwrap(
            await functions.getRankings({ data: { leagueId }, headers: await headers(), signal }),
          ),
        getKey: (ranking: WeeklyRanking) => `${ranking.leagueId}:${ranking.year}:${ranking.week}`,
        startSync: false,
      }),
    );
  }
  const rankingCollections = new Map<string, ReturnType<typeof makeRankingCollection>>();
  function rankingsFor(leagueId: string) {
    let collection = rankingCollections.get(leagueId);
    if (!collection) {
      collection = makeRankingCollection(leagueId);
      rankingCollections.set(leagueId, collection);
    }
    return collection;
  }
  const api: LeagueApi = {
    subject,
    revisions: {
      list: async (id) =>
        unwrap(await functions.getRankingRevisions({ data: { id }, headers: await headers() })),
      restore: async (id, revision, expectedRevision) =>
        unwrap(
          await functions.restoreRankingRevision({
            data: { id, revision, expectedRevision },
            headers: await headers(),
          }),
        ),
    },
    publishing: {
      status: async (id) =>
        unwrap(
          await publishingFunctions.publicationStatus({ data: { id }, headers: await headers() }),
        ),
      publish: async (id, revision) =>
        unwrap(
          await publishingFunctions.publishEdition({
            data: { id, revision },
            headers: await headers(),
          }),
        ),
      unpublish: async (id) =>
        unwrap(
          await publishingFunctions.unpublishEdition({ data: { id }, headers: await headers() }),
        ),
    },
    writing: {
      context: async (data) =>
        unwrap(await writingFunctions.getContext({ data, headers: await headers() })),
      providers: async () =>
        unwrap(await writingFunctions.getProviders({ headers: await headers() })),
      generate: async (data) =>
        unwrap(await writingFunctions.generateSuggestions({ data, headers: await headers() })),
    },
    listLeagues: async () => {
      await leagueCollection.preload();
      await leagueCollection.utils.refetch({ throwOnError: true });
      return leagueCollection.toArray;
    },
    createLeague: async (league) => {
      await leagueCollection.preload();
      const saved = unwrap(
        await functions.createLeague({ data: league, headers: await headers() }),
      );
      leagueCollection.utils.writeUpsert(saved);
      return saved;
    },
    getTeams: async (leagueId, year, week) =>
      unwrap(
        await functions.getTeams({ data: { leagueId, year, week }, headers: await headers() }),
      ),
    getRankings: async (leagueId) => {
      const collection = rankingsFor(leagueId);
      await collection.preload();
      await collection.utils.refetch({ throwOnError: true });
      return collection.toArray;
    },
    saveRanking: async (ranking) => {
      await rankingsFor(ranking.leagueId).preload();
      const saved = unwrap(
        await functions.saveRanking({ data: ranking, headers: await headers() }),
      );
      rankingsFor(ranking.leagueId).utils.writeUpsert(saved);
      return saved;
    },
  };
  return {
    ...api,
    getProfile: async () => unwrap(await profile.getProfile({ headers: await headers() })),
    updateProfile: async (data: import('../profile').ProfileUpdate) =>
      unwrap(await profile.updateProfile({ data, headers: await headers() })),
    getEspnCredentialStatus: async () =>
      unwrap(await functions.getEspnCredentialStatus({ headers: await headers() })),
    saveEspnCredentials: async (data: import('../espn-credentials').EspnCredentials) => {
      const status = unwrap(
        await functions.saveEspnCredentials({ data, headers: await headers() }),
      );
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (q) => ['league-seasons', 'insights-v4'].includes(String(q.queryKey[1])),
      });
      return status;
    },
    removeEspnCredentials: async () => {
      const status = unwrap(await functions.removeEspnCredentials({ headers: await headers() }));
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (q) => ['league-seasons', 'insights-v4'].includes(String(q.queryKey[1])),
      });
      return status;
    },
    skipEspnSetup: async () => unwrap(await functions.skipEspnSetup({ headers: await headers() })),
    getLeagueSeasons: async (leagueId: string) =>
      queryClient.fetchQuery({
        queryKey: [subject, 'league-seasons', leagueId],
        staleTime: 5 * 60 * 1000,
        queryFn: async ({ signal }) =>
          unwrap(
            await functions.getLeagueSeasons({
              data: { leagueId },
              headers: await headers(),
              signal,
            }),
          ),
      }),
    getInsights: async (leagueId: string, year: number, refresh = false) => {
      const queryKey = [subject, 'insights-v4', leagueId, year];
      if (refresh) await queryClient.invalidateQueries({ queryKey });
      return queryClient.fetchQuery({
        queryKey,
        staleTime: 5 * 60 * 1000,
        queryFn: async ({ signal }) =>
          unwrap(
            await functions.getInsights({
              data: { leagueId, year },
              headers: await headers(),
              signal,
            }),
          ),
      });
    },
    leagueCollection,
    rankingsFor,
    dispose: async () => {
      await Promise.all([
        leagueCollection.cleanup(),
        ...[...rankingCollections.values()].map((collection) => collection.cleanup()),
      ]);
      queryClient.clear();
    },
  };
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
