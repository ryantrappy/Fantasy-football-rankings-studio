// @vitest-environment node
import { operations } from '../operations.server';
import LeaguesService from '../services/leagues.service';
import { loadLiveLeague } from '../live-matchups.server';
import HttpException from '../exceptions/HttpException';
vi.mock('../live-matchups.server', () => ({ loadLiveLeague: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

it('loads only the selected owned league and retains independent all-league fanout', async () => {
  const fast = {
    _id: 'saved-1',
    __v: 0,
    leagueId: '1',
    leagueName: 'Fast',
    leagueType: 1 as const,
    seasonId: 2026,
  };
  const slow = { ...fast, leagueId: '2', leagueName: 'Slow' };
  const owned = vi.spyOn(LeaguesService.prototype, 'getLeagueById').mockResolvedValue(fast);
  const list = vi.spyOn(LeaguesService.prototype, 'listLeagues').mockResolvedValue([fast, slow]);
  const access = vi
    .spyOn(LeaguesService.prototype, 'espnAccess')
    .mockImplementation(async (_league, owner) => ({
      espnS2: `${owner}-s2`,
      swid: `${owner}-swid`,
    }));
  let finish!: (value: any) => void;
  vi.mocked(loadLiveLeague).mockImplementation(async (league) =>
    league.leagueId === '1'
      ? ({ leagueId: '1', matchups: [] } as never)
      : new Promise((resolve) => {
          finish = resolve;
        }),
  );
  expect((await operations.getLiveLeague('owner-a', { leagueId: '1' })).leagueId).toBe('1');
  expect(owned).toHaveBeenCalledWith('1', 'owner-a');
  expect(list).not.toHaveBeenCalled();
  expect(loadLiveLeague).toHaveBeenCalledTimes(1);
  expect(loadLiveLeague).toHaveBeenCalledWith(fast, {
    espnS2: 'owner-a-s2',
    swid: 'owner-a-swid',
  });
  const all = operations.getLiveMatchups('owner-b');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(loadLiveLeague).toHaveBeenCalledWith(slow, { espnS2: 'owner-b-s2', swid: 'owner-b-swid' });
  finish({ leagueId: '2', matchups: [] });
  expect(await all).toHaveLength(2);
  vi.mocked(loadLiveLeague).mockClear();
  access.mockClear();
  owned.mockRejectedValue(new HttpException(404, 'Not found'));
  await expect(operations.getLiveLeague('other-owner', { leagueId: '1' })).rejects.toMatchObject({
    status: 404,
  });
  expect(loadLiveLeague).not.toHaveBeenCalled();
  expect(access).not.toHaveBeenCalled();
});

it('returns a per-league failure without loading unrelated providers', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(LeaguesService.prototype, 'getLeagueById').mockResolvedValue({
    leagueId: '1',
    leagueName: 'League',
    leagueType: 0,
    seasonId: 2026,
  });
  vi.spyOn(LeaguesService.prototype, 'espnAccess').mockResolvedValue('public');
  vi.mocked(loadLiveLeague).mockRejectedValue(new Error('Offline'));
  expect(await operations.getLiveLeague('owner', { leagueId: '1' })).toMatchObject({
    leagueId: '1',
    error: 'Live scores are unavailable for this league right now.',
    matchups: [],
  });
});
