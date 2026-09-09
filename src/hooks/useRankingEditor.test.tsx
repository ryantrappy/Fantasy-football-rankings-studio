import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { League, LeagueApi, WeeklyRanking } from '../types';
import { useRankingEditor } from './useRankingEditor';

const league: League = {
  leagueId: 'league-1',
  leagueName: 'Sunday league',
  leagueType: 0,
  seasonId: 2026,
};
const existing: WeeklyRanking = {
  _id: 'ranking-1',
  leagueId: league.leagueId,
  year: 2026,
  week: 2,
  rankingsTitle: 'My rankings',
  introduction: 'Opening thoughts',
  teams: [
    {
      teamId: 'team-1',
      teamName: 'First team',
      managerName: 'Taylor',
      wins: 1,
      loss: 0,
      ties: 0,
      description: '',
      position: 1,
    },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

function makeApi() {
  return {
    listLeagues: vi.fn<LeagueApi['listLeagues']>().mockResolvedValue([league]),
    createLeague: vi.fn<LeagueApi['createLeague']>(),
    getRankings: vi.fn<LeagueApi['getRankings']>().mockResolvedValue([existing]),
    getTeams: vi.fn<LeagueApi['getTeams']>().mockResolvedValue(existing.teams),
    saveRanking: vi
      .fn<LeagueApi['saveRanking']>()
      .mockImplementation(async (ranking) => ({ ...ranking, _id: 'ranking-1' })),
  };
}

describe('useRankingEditor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('loads saved work before considering provider teams and never saves on opening', async () => {
    const api = makeApi();
    const pending = deferred<WeeklyRanking[]>();
    api.getRankings.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));

    expect(result.current.loading).toBe(true);
    expect(api.getTeams).not.toHaveBeenCalled();
    await act(async () => pending.resolve([existing]));
    await act(async () => vi.advanceTimersByTimeAsync(5000));

    expect(result.current.ranking).toEqual(existing);
    expect(result.current.dirty).toBe(false);
    expect(api.getTeams).not.toHaveBeenCalled();
    expect(api.saveRanking).not.toHaveBeenCalled();
  });

  it('loads teams only after confirming the requested season and week do not exist', async () => {
    const api = makeApi();
    const pending = deferred<WeeklyRanking[]>();
    api.getRankings.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 3));
    expect(api.getTeams).not.toHaveBeenCalled();
    await act(async () => pending.resolve([existing]));
    await act(async () => vi.advanceTimersByTimeAsync(5000));

    expect(api.getTeams).toHaveBeenCalledExactlyOnceWith('league-1', 2026, 3);
    expect(result.current.ranking).toMatchObject({ year: 2026, week: 3 });
    expect(api.saveRanking).not.toHaveBeenCalled();
    await act(async () => result.current.flush(true));
    expect(api.saveRanking).toHaveBeenCalledTimes(1);
    expect(result.current.ranking?._id).toBe('ranking-1');
  });

  it('exposes load errors and retries without creating a replacement for inaccessible saved work', async () => {
    const api = makeApi();
    api.getRankings.mockRejectedValueOnce(new Error('Unable to load saved rankings'));
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));
    await act(async () => {});

    expect(result.current.loadError).toBe('Unable to load saved rankings');
    expect(result.current.loading).toBe(false);
    expect(api.getTeams).not.toHaveBeenCalled();
    expect(api.saveRanking).not.toHaveBeenCalled();
    await act(async () => result.current.reload());

    expect(api.getRankings).toHaveBeenCalledTimes(2);
    expect(result.current.loadError).toBe('');
    expect(result.current.ranking).toEqual(existing);
  });

  it('debounces successive edits into one save of the latest contents', async () => {
    const api = makeApi();
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));
    await act(async () => {});
    act(() => result.current.update((ranking) => ({ ...ranking, introduction: 'First edit' })));
    await act(async () => vi.advanceTimersByTimeAsync(900));
    act(() => result.current.update((ranking) => ({ ...ranking, introduction: 'Latest edit' })));
    await act(async () => vi.advanceTimersByTimeAsync(999));
    expect(api.saveRanking).not.toHaveBeenCalled();
    expect(result.current.dirty).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(api.saveRanking).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ introduction: 'Latest edit' }),
    );
    expect(result.current.dirty).toBe(false);
    expect(result.current.savedAt).toBeInstanceOf(Date);
  });

  it('serializes pending creation and subsequent edits using the newly assigned ID', async () => {
    const api = makeApi();
    api.getRankings.mockResolvedValue([]);
    const first = deferred<WeeklyRanking>();
    const second = deferred<WeeklyRanking>();
    api.saveRanking.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));
    await act(async () => {});
    act(() => result.current.update((ranking) => ({ ...ranking, introduction: 'First edit' })));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    const firstSnapshot = api.saveRanking.mock.calls[0][0];
    expect(firstSnapshot._id).toBeUndefined();

    act(() =>
      result.current.update((ranking) => ({ ...ranking, introduction: 'Edit during save' })),
    );
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(api.saveRanking).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
    await act(async () => first.resolve({ ...firstSnapshot, _id: 'created-id' }));

    expect(api.saveRanking).toHaveBeenCalledTimes(2);
    expect(api.saveRanking.mock.calls[1][0]).toMatchObject({
      _id: 'created-id',
      introduction: 'Edit during save',
    });
    expect(result.current.dirty).toBe(true);
    await act(async () =>
      second.resolve({ ...api.saveRanking.mock.calls[1][0], _id: 'created-id' }),
    );
    expect(result.current.ranking).toMatchObject({
      _id: 'created-id',
      introduction: 'Edit during save',
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.dirty).toBe(false);
  });

  it('retains failed edits and permits an explicit retry without a background retry loop', async () => {
    const api = makeApi();
    api.saveRanking.mockRejectedValueOnce(new Error('Save unavailable'));
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));
    await act(async () => {});
    act(() => result.current.update((ranking) => ({ ...ranking, introduction: 'Keep this work' })));
    await act(async () => vi.advanceTimersByTimeAsync(1000));

    expect(result.current.saveError).toBe('Save unavailable');
    expect(result.current.dirty).toBe(true);
    expect(result.current.ranking?.introduction).toBe('Keep this work');
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(api.saveRanking).toHaveBeenCalledTimes(1);
    await act(async () => result.current.flush());
    expect(api.saveRanking).toHaveBeenCalledTimes(2);
    expect(result.current.saveError).toBe('');
    expect(result.current.dirty).toBe(false);
  });

  it('does not consider a save successful when the server omits its ID', async () => {
    const api = makeApi();
    api.getRankings.mockResolvedValue([]);
    api.saveRanking.mockImplementationOnce(async (ranking) => ranking);
    const { result } = renderHook(() => useRankingEditor(api, league, 2026, 2));
    await act(async () => {});
    act(() => result.current.update((ranking) => ({ ...ranking, introduction: 'Unsaved draft' })));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.saveError).toContain('ranking ID');
    expect(result.current.dirty).toBe(true);
    expect(result.current.savedAt).toBeUndefined();
  });
});
