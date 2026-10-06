import * as publishingFunctions from '../functions/publishing.functions';
import { createReportSnapshot } from '../functions/report-snapshots.functions';
import { insightsCacheOptions } from './insights-cache';
import * as writingFunctions from '../functions/writing.functions';
import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { QueryClient } from '@tanstack/query-core';
import * as functions from '../functions/rankings.functions';
import * as profile from '../functions/profile.functions';
import * as aiCredentials from '../functions/ai-credentials.functions';
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
  const providerGeneration = new Map<string, number>();
  const collectionRefreshes = new Map<string, Promise<void>>();
  async function refetchCollection(key: string, fetch: () => Promise<unknown>) {
    const pending = collectionRefreshes.get(key);
    if (pending) return pending;
    const request = fetch().then(() => {});
    collectionRefreshes.set(key, request);
    try {
      await request;
    } finally {
      collectionRefreshes.delete(key);
    }
  }
  let disposed = false;
  const assertActive = () => {
    if (disposed) throw new Error('This account session has ended.');
  };
  const generation = (leagueId: string) => providerGeneration.get(leagueId) ?? 0;
  const headers = async () => {
    assertActive();
    const token = await getToken();
    assertActive();
    return { Authorization: `Bearer ${token}` };
  };
  const providerKinds = new Set([
    'league-seasons',
    'insights-v4',
    'league-info',
    'teams',
    'matchups',
    'managed-team',
    'live-matchups',
    'live-league',
  ]);
  async function invalidateProviderData(leagueId?: string) {
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        providerKinds.has(String(query.queryKey[1])) &&
        (!leagueId || query.queryKey[2] === leagueId || query.queryKey[1] === 'live-matchups'),
    };
    await queryClient.cancelQueries(filters);
    queryClient.removeQueries(filters);
  }
  async function read<T>(
    kind: string,
    scope: readonly unknown[],
    fetch: (signal: AbortSignal) => Promise<T>,
    staleTime = 30000,
    refresh = false,
  ) {
    assertActive();
    const queryKey = [subject, kind, ...scope];
    if (refresh) await queryClient.invalidateQueries({ queryKey, exact: true });
    return queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => fetch(signal),
      staleTime,
      gcTime: 60 * 60 * 1000,
    });
  }
  function providerScope(leagueId: string, ...scope: unknown[]) {
    return [leagueId, ...scope, generation(leagueId)];
  }
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
  let disposePromise: Promise<void> | undefined;
  function dispose() {
    disposePromise ??= (async () => {
      disposed = true;
      const collections = [leagueCollection, ...rankingCollections.values()];
      await queryClient.cancelQueries();
      while (collections.some((collection) => collection.subscriberCount > 0))
        await new Promise((resolve) => setTimeout(resolve, 0));
      await Promise.all(collections.map((collection) => collection.cleanup()));
      queryClient.clear();
    })();
    return disposePromise;
  }
  const api: LeagueApi = {
    getLiveLeague: (leagueId, refresh = false) =>
      read(
        'live-league',
        [leagueId, generation(leagueId)],
        async (signal) =>
          unwrap(
            await functions.getLiveLeague({ data: { leagueId }, headers: await headers(), signal }),
          ),
        15000,
        refresh,
      ),
    getLiveMatchups: (refresh = false) =>
      read(
        'live-matchups',
        [],
        async (signal) =>
          unwrap(await functions.getLiveMatchups({ headers: await headers(), signal })),
        15000,
        refresh,
      ),
    createReportSnapshot: async (data) =>
      unwrap(await createReportSnapshot({ data, headers: await headers() })),
    subject,
    waivers: {
      get: async (leagueId, year) =>
        unwrap(
          await functions.getWaiverPool({ data: { leagueId, year }, headers: await headers() }),
        ),
    },
    managedTeam: {
      get: (leagueId, year, refresh = false) =>
        read(
          'managed-team',
          providerScope(leagueId, year),
          async (signal) =>
            unwrap(
              await functions.getManagedTeam({
                data: { leagueId, year },
                headers: await headers(),
                signal,
              }),
            ),
          30000,
          refresh,
        ),
      set: async (leagueId, year, teamId) => {
        const saved = unwrap(
          await functions.setManagedTeam({
            data: { leagueId, year, teamId },
            headers: await headers(),
          }),
        );
        const queryKey = [subject, 'managed-team', ...providerScope(leagueId, year)];
        await queryClient.cancelQueries({ queryKey, exact: true });
        queryClient.setQueryData(queryKey, saved);
        return saved;
      },
    },
    management: {
      deleting: async () =>
        unwrap(await functions.listDeletingLeagues({ headers: await headers() })),
      archived: async () =>
        unwrap(await functions.listArchivedLeagues({ headers: await headers() })),
      archive: async (leagueId, archived) => {
        unwrap(
          await functions.setLeagueArchived({
            data: { leagueId, archived },
            headers: await headers(),
          }),
        );
        await invalidateProviderData();
        await leagueCollection.utils.refetch({ throwOnError: true });
      },
      rename: async (leagueId, leagueName) => {
        const renamed = unwrap(
          await functions.renameLeague({
            data: { leagueId, leagueName },
            headers: await headers(),
          }),
        );
        await invalidateProviderData(leagueId);
        await leagueCollection.utils.refetch({ throwOnError: true });
        return renamed;
      },
      updateProviderId: async (leagueId, providerLeagueId) => {
        const updated = unwrap(
          await functions.updateLeagueProviderId({
            data: { leagueId, providerLeagueId },
            headers: await headers(),
          }),
        );
        const nextGeneration = generation(leagueId) + 1;
        providerGeneration.set(leagueId, nextGeneration);
        await invalidateProviderData(leagueId);
        await leagueCollection.utils.refetch({ throwOnError: true });
        return updated;
      },
      delete: async (leagueId) => {
        unwrap(await functions.deleteLeague({ data: { leagueId }, headers: await headers() }));
        await invalidateProviderData(leagueId);
        await leagueCollection.utils.refetch({ throwOnError: true });
      },
    },
    reportSharing: {
      get: async (leagueId) =>
        unwrap(await functions.getReportSharing({ data: { leagueId }, headers: await headers() })),
      set: async (leagueId, enabled) =>
        unwrap(
          await functions.setReportSharing({
            data: { leagueId, enabled },
            headers: await headers(),
          }),
        ),
    },
    revisions: {
      list: async (id, before) =>
        unwrap(
          await functions.getRankingRevisions({
            data: { id, ...(before === undefined ? {} : { before }) },
            headers: await headers(),
          }),
        ),
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
      consent: async () => unwrap(await writingFunctions.getConsent({ headers: await headers() })),
      saveConsent: async (data) =>
        unwrap(await writingFunctions.saveConsent({ data, headers: await headers() })),
      context: async (data) =>
        unwrap(await writingFunctions.getContext({ data, headers: await headers() })),
      providers: async () =>
        unwrap(await writingFunctions.getProviders({ headers: await headers() })),
      generate: async (data, signal) =>
        unwrap(
          await writingFunctions.generateSuggestions({ data, headers: await headers(), signal }),
        ),
    },
    listLeagues: async (refresh = false) => {
      assertActive();
      await leagueCollection.preload();
      const state = queryClient.getQueryState([subject, 'leagues']);
      if (
        refresh ||
        state?.isInvalidated ||
        !state?.dataUpdatedAt ||
        Date.now() - state.dataUpdatedAt >= 30000
      )
        await refetchCollection('leagues', () =>
          leagueCollection.utils.refetch({ throwOnError: true }),
        );
      return leagueCollection.toArray;
    },
    createLeague: async (league) => {
      await leagueCollection.preload();
      const saved = unwrap(
        await functions.createLeague({ data: league, headers: await headers() }),
      );
      leagueCollection.utils.writeUpsert(saved);
      await invalidateProviderData();
      return saved;
    },
    getLeagueInfo: (leagueId, year, refresh = false) =>
      read(
        'league-info',
        providerScope(leagueId, year),
        async (signal) =>
          unwrap(
            await functions.getLeagueInfo({
              data: { leagueId, year },
              headers: await headers(),
              signal,
            }),
          ),
        insightsCacheOptions(year).staleTime,
        refresh,
      ),
    getTeams: (leagueId, year, week, refresh = false) =>
      read(
        'teams',
        providerScope(leagueId, year, week),
        async (signal) =>
          unwrap(
            await functions.getTeams({
              data: { leagueId, year, week },
              headers: await headers(),
              signal,
            }),
          ),
        insightsCacheOptions(year).staleTime,
        refresh,
      ),
    getMatchups: (leagueId, year, week, refresh = false) =>
      read(
        'matchups',
        providerScope(leagueId, year, week),
        async (signal) =>
          unwrap(
            await functions.getMatchups({
              data: { leagueId, year, week },
              headers: await headers(),
              signal,
            }),
          ),
        insightsCacheOptions(year).staleTime,
        refresh,
      ),
    getRankings: async (leagueId, refresh = false) => {
      assertActive();
      const collection = rankingsFor(leagueId);
      await collection.preload();
      const state = queryClient.getQueryState([subject, 'rankings', leagueId]);
      if (
        refresh ||
        state?.isInvalidated ||
        !state?.dataUpdatedAt ||
        Date.now() - state.dataUpdatedAt >= 30000
      )
        await refetchCollection(`rankings:${leagueId}`, () =>
          collection.utils.refetch({ throwOnError: true }),
        );
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
    getAiCredentialStatus: async () =>
      unwrap(await aiCredentials.getAiCredentialStatus({ headers: await headers() })),
    saveAiCredential: async (data: {
      provider: import('../writing').WritingProvider;
      apiKey: string;
    }) => unwrap(await aiCredentials.saveAiCredential({ data, headers: await headers() })),
    removeAiCredential: async (provider: import('../writing').WritingProvider) =>
      unwrap(
        await aiCredentials.removeAiCredential({ data: { provider }, headers: await headers() }),
      ),
    getEspnCredentialStatus: async () =>
      unwrap(await functions.getEspnCredentialStatus({ headers: await headers() })),
    saveEspnCredentials: async (data: import('../espn-credentials').EspnCredentials) => {
      const status = unwrap(
        await functions.saveEspnCredentials({ data, headers: await headers() }),
      );
      await invalidateProviderData();
      return status;
    },
    removeEspnCredentials: async () => {
      const status = unwrap(await functions.removeEspnCredentials({ headers: await headers() }));
      await invalidateProviderData();
      return status;
    },
    skipEspnSetup: async () => unwrap(await functions.skipEspnSetup({ headers: await headers() })),
    getLeagueSeasons: (leagueId: string) =>
      read(
        'league-seasons',
        providerScope(leagueId),
        async (signal) =>
          unwrap(
            await functions.getLeagueSeasons({
              data: { leagueId },
              headers: await headers(),
              signal,
            }),
          ),
        5 * 60 * 1000,
      ),
    getInsights: async (leagueId: string, year: number, refresh = false) => {
      assertActive();
      const queryKey = [subject, 'insights-v4', leagueId, year, generation(leagueId)];
      if (refresh) await queryClient.invalidateQueries({ queryKey });
      return queryClient.fetchQuery({
        queryKey,
        ...insightsCacheOptions(year),
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
    dispose,
  };
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
