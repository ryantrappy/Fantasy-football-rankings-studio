import { warmTab } from './tab-data';
it.each(['players', 'trades', 'live', 'overview'] as const)(
  'prefetches %s with the correct league scope',
  async (tab) => {
    const api = {
      listLeagues: vi.fn().mockResolvedValue([
        { leagueId: '1', seasonId: 2026 },
        { leagueId: '2', seasonId: 2026 },
      ]),
      getInsights: vi.fn().mockResolvedValue({}),
      getLiveLeague: vi.fn().mockResolvedValue({}),
      getLiveMatchups: vi.fn().mockResolvedValue([]),
    };
    await warmTab(tab, { sessionApi: api } as never, { leagueId: '2' });
    if (tab === 'players' || tab === 'trades') {
      expect(api.getLiveLeague).toHaveBeenCalledTimes(1);
      expect(api.getLiveLeague).toHaveBeenCalledWith('2');
      expect(api.getLiveMatchups).not.toHaveBeenCalled();
    } else {
      expect(api.getLiveMatchups).toHaveBeenCalledTimes(1);
      expect(api.getLiveLeague).not.toHaveBeenCalled();
    }
  },
);
