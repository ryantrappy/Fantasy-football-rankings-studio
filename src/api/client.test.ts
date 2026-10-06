import { withOwnerInsights } from './owner-insights';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApi } from './client';
import * as functions from '../functions/rankings.functions';
import type { League, WeeklyRanking } from '../types';

vi.mock('../functions/rankings.functions', () => ({
  getEspnCredentialStatus: vi.fn(),
  saveEspnCredentials: vi.fn(),
  removeEspnCredentials: vi.fn(),
  skipEspnSetup: vi.fn(),
  getLeagueSeasons: vi.fn(),
  getInsights: vi.fn(),
  listLeagues: vi.fn(),
  createLeague: vi.fn(),
  getRankings: vi.fn(),
  saveRanking: vi.fn(),
  getTeams: vi.fn(),
  getLeagueInfo: vi.fn(),
  getLiveLeague: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { leagueId: '123', season: 2026, matchups: [] } }),
  getLiveMatchups: vi.fn(),
  getMatchups: vi.fn(),
  getManagedTeam: vi.fn(),
  setManagedTeam: vi.fn(),
  updateLeagueProviderId: vi.fn(),
  deleteLeague: vi.fn(),
}));
const league: League = {
  leagueId: '1312529175982129152',
  leagueName: 'Test',
  leagueType: 0,
  seasonId: 2026,
};
const ranking: WeeklyRanking = {
  _id: '0123456789abcdef01234567',
  leagueId: league.leagueId,
  year: 2026,
  week: 1,
  rankingsTitle: 'Saved',
  introduction: '',
  teams: [],
};
const sessions: ReturnType<typeof createApi>[] = [];
function session(subject: string) {
  const api = createApi(async () => `${subject}-token`, subject);
  sessions.push(api);
  return api;
}
beforeEach(() => {
  vi.clearAllMocks();
});

it('sends provider-ID updates and permanent deletes through authenticated management calls', async () => {
  vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
  vi.mocked(functions.updateLeagueProviderId).mockResolvedValue({
    ok: true,
    data: { ...league, providerLeagueId: '99' },
  });
  vi.mocked(functions.deleteLeague).mockResolvedValue({ ok: true, data: undefined });
  const api = session('owner');
  await api.management!.updateProviderId(league.leagueId, '99');
  await api.management!.delete(league.leagueId);
  expect(functions.updateLeagueProviderId).toHaveBeenCalledWith({
    data: { leagueId: league.leagueId, providerLeagueId: '99' },
    headers: { Authorization: 'Bearer owner-token' },
  });
  expect(functions.deleteLeague).toHaveBeenCalledWith({
    data: { leagueId: league.leagueId },
    headers: { Authorization: 'Bearer owner-token' },
  });
});
afterEach(async () => {
  await Promise.all(sessions.splice(0).map((api) => api.dispose()));
});
describe('Start-backed collections', () => {
  it('updates the live league collection after creation before a list screen mounts', async () => {
    vi.mocked(functions.createLeague).mockResolvedValue({ ok: true, data: league });
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
    const api = session('owner');
    await api.createLeague(league);
    expect(api.leagueCollection.get(league.leagueId)).toMatchObject(league);
    expect(functions.createLeague).toHaveBeenCalledWith({
      data: league,
      headers: { Authorization: 'Bearer owner-token' },
    });
    expect(await api.listLeagues()).toMatchObject([league]);
  });
  it('keeps confirmed data on a failed save and publishes successful changes', async () => {
    vi.mocked(functions.getRankings).mockResolvedValue({ ok: true, data: [ranking] });
    const api = session('owner');
    await api.getRankings(league.leagueId);
    vi.mocked(functions.saveRanking).mockResolvedValue({
      ok: false,
      error: { status: 500, message: 'Retry' },
    });
    await expect(api.saveRanking({ ...ranking, rankingsTitle: 'Draft' })).rejects.toThrow('Retry');
    expect(api.rankingsFor(league.leagueId).toArray[0].rankingsTitle).toBe('Saved');
    vi.mocked(functions.saveRanking).mockResolvedValue({
      ok: true,
      data: { ...ranking, rankingsTitle: 'Updated' },
    });
    await api.saveRanking({ ...ranking, rankingsTitle: 'Updated' });
    expect(api.rankingsFor(league.leagueId).toArray[0].rankingsTitle).toBe('Updated');
  });
  it('does not share cached leagues between accounts', async () => {
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
    vi.mocked(functions.getRankings).mockResolvedValue({ ok: true, data: [ranking] });
    const owner = session('owner');
    await owner.listLeagues();
    await owner.getRankings(league.leagueId);
    const ownerRankings = owner.rankingsFor(league.leagueId);
    await owner.dispose();
    expect(owner.leagueCollection.status).toBe('cleaned-up');
    expect(owner.leagueCollection.toArray).toEqual([]);
    expect(ownerRankings.status).toBe('cleaned-up');
    expect(ownerRankings.toArray).toEqual([]);
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [] });
    const other = session('other');
    expect(await other.listLeagues()).toEqual([]);
  });
});

it('authenticates credential writes and discards reports cached with old credentials', async () => {
  const api = session('owner');
  const credentials = { espnS2: 'cookie', swid: 'swid' };
  vi.mocked(functions.getLeagueSeasons).mockResolvedValue({
    ok: true,
    data: { years: [2025], activeSeason: 2025, activeManagerKeys: [] },
  });
  vi.mocked(functions.saveEspnCredentials).mockResolvedValue({
    ok: true,
    data: { configured: true, onboardingComplete: true },
  });
  vi.mocked(functions.removeEspnCredentials).mockResolvedValue({
    ok: true,
    data: { configured: false, onboardingComplete: true },
  });
  await api.getLeagueSeasons('123');
  await api.getLeagueSeasons('123');
  expect(functions.getLeagueSeasons).toHaveBeenCalledTimes(1);
  await api.saveEspnCredentials(credentials);
  expect(functions.saveEspnCredentials).toHaveBeenCalledWith({
    data: credentials,
    headers: { Authorization: 'Bearer owner-token' },
  });
  await api.getLeagueSeasons('123');
  expect(functions.getLeagueSeasons).toHaveBeenCalledTimes(2);
  await api.removeEspnCredentials();
  expect(functions.removeEspnCredentials).toHaveBeenCalledWith({
    headers: { Authorization: 'Bearer owner-token' },
  });
  await api.getLeagueSeasons('123');
  expect(functions.getLeagueSeasons).toHaveBeenCalledTimes(3);
});

it('refreshes current/historical provider caches without discarding unrelated reports or editions', async () => {
  const api = session('owner');
  let source = 'old';
  vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
  vi.mocked(functions.getLeagueSeasons).mockImplementation(async () => ({
    ok: true,
    data: { years: source === 'old' ? [2025] : [2026], activeSeason: 2026, activeManagerKeys: [] },
  }));
  vi.mocked(functions.getInsights).mockImplementation(async () => ({
    ok: true,
    data: { generatedAt: source } as never,
  }));
  vi.mocked(functions.getRankings).mockResolvedValue({ ok: true, data: [ranking] });
  vi.mocked(functions.updateLeagueProviderId).mockResolvedValue({
    ok: true,
    data: { ...league, providerLeagueId: '99' },
  });
  await api.getLeagueSeasons(league.leagueId);
  await api.getInsights(league.leagueId, 2025);
  await api.getInsights(league.leagueId, 2026);
  await api.getInsights('other', 2025);
  await api.getRankings(league.leagueId);
  source = 'new';
  await api.management!.updateProviderId(league.leagueId, '99');
  expect((await api.getLeagueSeasons(league.leagueId)).years).toEqual([2026]);
  expect((await api.getInsights(league.leagueId, 2025)).generatedAt).toBe('new');
  expect((await api.getInsights(league.leagueId, 2026)).generatedAt).toBe('new');
  expect((await api.getInsights('other', 2025)).generatedAt).toBe('old');
  expect(api.rankingsFor(league.leagueId).toArray[0].rankingsTitle).toBe('Saved');
});
it('prevents a delayed old-provider read from repopulating the new workspace cache', async () => {
  const api = session('owner');
  let finish!: (result: never) => void;
  vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
  vi.mocked(functions.updateLeagueProviderId).mockResolvedValue({
    ok: true,
    data: { ...league, providerLeagueId: '99' },
  });
  vi.mocked(functions.getInsights)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ ok: true, data: { generatedAt: 'new' } as never });
  const old = api.getInsights(league.leagueId, 2025).catch(() => undefined);
  await vi.waitFor(() => expect(finish).toBeDefined());
  await api.management!.updateProviderId(league.leagueId, '99');
  expect((await api.getInsights(league.leagueId, 2025)).generatedAt).toBe('new');
  finish({ ok: true, data: { generatedAt: 'old' } } as never);
  await old;
  expect((await api.getInsights(league.leagueId, 2025)).generatedAt).toBe('new');
  expect(functions.getInsights).toHaveBeenCalledTimes(2);
});

describe('tab query caching', () => {
  it('coalesces concurrent and fresh live reads, refreshes on demand, and expires live data', async () => {
    vi.mocked(functions.getLiveMatchups).mockResolvedValue({ ok: true, data: [] });
    const api = session('cache-owner');
    let now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    try {
      await Promise.all([api.getLiveMatchups(), api.getLiveMatchups(), api.getLiveMatchups()]);
      await api.getLiveMatchups();
      expect(functions.getLiveMatchups).toHaveBeenCalledTimes(1);
      await api.getLiveMatchups(true);
      expect(functions.getLiveMatchups).toHaveBeenCalledTimes(2);
      now += 15001;
      await api.getLiveMatchups();
      expect(functions.getLiveMatchups).toHaveBeenCalledTimes(3);
    } finally {
      clock.mockRestore();
    }
  });
  it('coalesces stale collection refreshes without canceling a sibling tab request', async () => {
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
    vi.mocked(functions.getRankings).mockResolvedValue({ ok: true, data: [ranking] });
    const api = session('collection-owner');
    await Promise.all([api.listLeagues(), api.getRankings(league.leagueId)]);
    await Promise.all([
      api.listLeagues(),
      api.listLeagues(),
      api.getRankings(league.leagueId),
      api.getRankings(league.leagueId),
    ]);
    expect(functions.listLeagues).toHaveBeenCalledTimes(1);
    expect(functions.getRankings).toHaveBeenCalledTimes(1);
    await Promise.all([
      api.listLeagues(true),
      api.listLeagues(true),
      api.getRankings(league.leagueId, true),
      api.getRankings(league.leagueId, true),
    ]);
    expect(functions.listLeagues).toHaveBeenCalledTimes(2);
    expect(functions.getRankings).toHaveBeenCalledTimes(2);
  });
  it('isolates scopes and sessions, and preserves historical reads until explicit refresh', async () => {
    vi.mocked(functions.getTeams).mockResolvedValue({ ok: true, data: [] });
    const owner = session('one');
    const other = session('two');
    let now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    try {
      await Promise.all([owner.getTeams('123', 2025, 1), owner.getTeams('123', 2025, 1)]);
      now += 360000;
      await owner.getTeams('123', 2025, 1);
      expect(functions.getTeams).toHaveBeenCalledTimes(1);
      await Promise.all([
        owner.getTeams('123', 2025, 2),
        owner.getTeams('456', 2025, 1),
        other.getTeams('123', 2025, 1),
      ]);
      expect(functions.getTeams).toHaveBeenCalledTimes(4);
      await owner.getTeams('123', 2025, 1, true);
      expect(functions.getTeams).toHaveBeenCalledTimes(5);
      await owner.dispose();
      await expect(owner.getTeams('123', 2025, 1)).rejects.toThrow('session has ended');
      expect(functions.getTeams).toHaveBeenCalledTimes(5);
    } finally {
      clock.mockRestore();
    }
  });
  it('drops warmed live and team data after changing credentials or provider IDs', async () => {
    vi.mocked(functions.getLiveMatchups).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(functions.getTeams).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
    vi.mocked(functions.updateLeagueProviderId).mockResolvedValue({
      ok: true,
      data: { ...league, providerLeagueId: '99' },
    });
    vi.mocked(functions.removeEspnCredentials).mockResolvedValue({
      ok: true,
      data: { configured: false, onboardingComplete: true },
    });
    const api = session('provider-owner');
    const read = () => Promise.all([api.getLiveMatchups(), api.getTeams(league.leagueId, 2025, 1)]);
    await read();
    await api.management!.updateProviderId(league.leagueId, '99');
    await read();
    await api.removeEspnCredentials();
    await read();
    expect(functions.getLiveMatchups).toHaveBeenCalledTimes(3);
    expect(functions.getTeams).toHaveBeenCalledTimes(3);
  });
  it('publishes a saved managed-team selection into the shared read cache', async () => {
    vi.mocked(functions.getManagedTeam).mockResolvedValue({
      ok: true,
      data: { teamId: null, needsReselection: false, teams: [] },
    });
    vi.mocked(functions.setManagedTeam).mockResolvedValue({
      ok: true,
      data: { teamId: '1', needsReselection: false, teams: [] },
    });
    const api = session('selection-owner');
    await api.managedTeam!.get('123', 2026);
    await api.managedTeam!.set('123', 2026, '1');
    expect(await api.managedTeam!.get('123', 2026)).toMatchObject({ teamId: '1' });
    expect(functions.getManagedTeam).toHaveBeenCalledTimes(1);
    await api.managedTeam!.get('123', 2026, true);
    expect(functions.getManagedTeam).toHaveBeenCalledTimes(2);
  });
});

it('keeps owner report access during a sibling league lookup and clears it after lookup failure', async () => {
  const publicApi = {
    listLeagues: vi.fn().mockResolvedValue([]),
    getLeague: vi.fn(),
    getLeagueSeasons: vi.fn(),
    getInsights: vi.fn(),
    dispose: vi.fn(),
  };
  let rejectLookup!: (error: Error) => void;
  const privateApi = {
    listLeagues: vi
      .fn()
      .mockResolvedValueOnce([league])
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectLookup = reject;
          }),
      ),
    getLeagueSeasons: vi.fn(),
    getInsights: vi.fn(),
  };
  const api = withOwnerInsights(publicApi, privateApi);
  await api.listLeagues();
  const pending = api.listLeagues();
  await api.getInsights(league.leagueId, 2026);
  expect(privateApi.getInsights).toHaveBeenCalledTimes(1);
  expect(publicApi.getInsights).not.toHaveBeenCalled();
  rejectLookup(new Error('League lookup failed'));
  await expect(pending).rejects.toThrow('League lookup failed');
  await api.getInsights(league.leagueId, 2026);
  expect(publicApi.getInsights).toHaveBeenCalledTimes(1);
});

it.each([2025, 2026])(
  'explicitly refreshes cached player scoring for season %s while ordinary reads reuse it',
  async (year) => {
    const api = session(`profiles-${year}`);
    const old = { completedWeek: 1, scores: [{ actual: 10 }], teams: [] };
    const updated = { ...old, scores: [{ actual: 20 }] };
    vi.mocked(functions.getInsights)
      .mockResolvedValueOnce({ ok: true, data: old } as never)
      .mockResolvedValueOnce({ ok: true, data: updated } as never);
    expect(await api.getInsights(league.leagueId, year)).toEqual(old);
    expect(await api.getInsights(league.leagueId, year)).toEqual(old);
    expect(functions.getInsights).toHaveBeenCalledTimes(1);
    expect(await api.getInsights(league.leagueId, year, true)).toEqual(updated);
    expect(await api.getInsights(league.leagueId, year)).toEqual(updated);
    expect(functions.getInsights).toHaveBeenCalledTimes(2);
  },
);

it('coalesces selected-league reads and refreshes them without sharing other league or account data', async () => {
  const api = session('scoped-live');
  vi.mocked(functions.getLiveLeague).mockImplementation(
    async ({ data }) =>
      ({ ok: true, data: { leagueId: data.leagueId, season: 2026, matchups: [] } }) as never,
  );
  await Promise.all([api.getLiveLeague('1'), api.getLiveLeague('1')]);
  await api.getLiveLeague('1');
  expect(functions.getLiveLeague).toHaveBeenCalledTimes(1);
  await api.getLiveLeague('2');
  await api.getLiveLeague('1', true);
  expect(functions.getLiveLeague).toHaveBeenCalledTimes(3);
  const other = session('other-scoped-live');
  await other.getLiveLeague('1');
  expect(functions.getLiveLeague).toHaveBeenCalledTimes(4);
  expect(functions.getLiveMatchups).not.toHaveBeenCalled();
});
