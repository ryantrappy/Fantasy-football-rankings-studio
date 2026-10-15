import { warmReport, warmTab } from './tab-data';
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

function historyApi(years = [2026, 2025, 2024, 2023, 2022, 2021, 2020]) {
  return {
    listLeagues: vi.fn().mockResolvedValue([{ leagueId: '123', seasonId: 2026 }]),
    getLeagueSeasons: vi.fn().mockResolvedValue({ years }),
    getInsights: vi.fn().mockResolvedValue({}),
  };
}
it('warms every private History catalogue season in batches of at most three', async () => {
  const api = historyApi();
  const releases: (() => void)[] = [];
  let active = 0,
    peak = 0;
  api.getInsights.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        active++;
        peak = Math.max(peak, active);
        releases.push(() => {
          active--;
          resolve();
        });
      }),
  );
  const warming = warmTab('history', { sessionApi: api } as never, { leagueId: '123', year: 2026 });
  await vi.waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(3));
  releases.splice(0).forEach((release) => release());
  await vi.waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(6));
  releases.splice(0).forEach((release) => release());
  await vi.waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(7));
  releases.splice(0).forEach((release) => release());
  await warming;
  expect(peak).toBe(3);
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual([
    2026, 2025, 2024, 2023, 2022, 2021, 2020,
  ]);
});
it.each([{ years: [2024, 2021] }, { years: [] }])(
  'keeps an explicit private History selection $years during preload',
  async ({ years }) => {
    const api = historyApi();
    await warmTab('history', { sessionApi: api } as never, { leagueId: '123', years });
    expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual(years);
  },
);
it('keeps shared default warming limited to the prior three seasons and preserves explicit selection', async () => {
  const api = historyApi();
  await warmReport(api as never, { leagueId: '123' }, true);
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual([2025, 2024, 2023]);
  api.getInsights.mockClear();
  await warmReport(api as never, { leagueId: '123', years: [2020] }, true);
  expect(api.getInsights).toHaveBeenCalledTimes(1);
  expect(api.getInsights).toHaveBeenCalledWith('123', 2020);
  api.getInsights.mockClear();
  await warmReport(api as never, { leagueId: '123', years: [] }, true);
  expect(api.getInsights).not.toHaveBeenCalled();
});
