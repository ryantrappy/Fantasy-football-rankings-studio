import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApi } from './client';
import * as functions from '../functions/rankings.functions';
import type { League, WeeklyRanking } from '../types';

vi.mock('../functions/rankings.functions', () => ({
  listLeagues: vi.fn(),
  createLeague: vi.fn(),
  getRankings: vi.fn(),
  saveRanking: vi.fn(),
  getTeams: vi.fn(),
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
    const owner = session('owner');
    await owner.listLeagues();
    vi.mocked(functions.listLeagues).mockResolvedValue({ ok: true, data: [] });
    const other = session('other');
    expect(await other.listLeagues()).toEqual([]);
    expect(owner.leagueCollection.toArray).toMatchObject([league]);
  });
});
