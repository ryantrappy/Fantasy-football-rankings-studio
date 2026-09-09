// @vitest-environment node
import axios from 'axios';
import EspnProvider from '../providers/espn.provider';
import { discoverSeasons } from './seasons.server';
import { loadInsights } from './load.server';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(axios.get);
const league = { leagueId: '123', leagueName: 'League', leagueType: 1 as const, seasonId: 2025 };
beforeEach(() => {
  vi.stubEnv('ESPN_S2', 'test-s2');
  vi.stubEnv('SWID', 'test-swid');
  get.mockResolvedValue({
    data: {
      id: 123,
      seasonId: 2025,
      status: { previousSeasons: [2024], latestScoringPeriod: 2, finalScoringPeriod: 18 },
      teams: [],
      schedule: [],
      transactions: [],
    },
  });
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

it('omits credentials from every public ESPN discovery and report request', async () => {
  expect((await discoverSeasons(league, 'public')).years).toEqual([2025, 2024]);
  await loadInsights(league, 2025, 'public');
  // Includes metadata, managers, weekly scores, box scores and transactions.
  expect(get.mock.calls.length).toBeGreaterThanOrEqual(7);
  for (const [, options] of get.mock.calls) {
    expect(options?.headers).not.toHaveProperty('Cookie');
  }
  expect(process.env.ESPN_S2).toBe('test-s2');
  expect(process.env.SWID).toBe('test-swid');
});
it('keeps private and public credentials isolated when requests run concurrently', async () => {
  await Promise.all([
    new EspnProvider('public').get('111', 2025, ['mSettings']),
    new EspnProvider({ espnS2: 'owner-s2', swid: 'owner-swid' }).get('222', 2025, ['mSettings']),
  ]);
  const publicCall = get.mock.calls.find(([url]) => url.includes('/111'));
  const privateCall = get.mock.calls.find(([url]) => url.includes('/222'));
  expect(publicCall?.[1]?.headers).not.toHaveProperty('Cookie');
  expect(privateCall?.[1]?.headers).toEqual({ Cookie: 'espn_s2=owner-s2; SWID=owner-swid' });
});
it('falls back to the registered season when public ESPN season discovery is denied', async () => {
  get.mockRejectedValueOnce(new Error('ESPN access denied'));
  await expect(discoverSeasons(league, 'public')).resolves.toEqual({
    years: [2025],
    activeSeason: 2025,
    activeManagerKeys: [],
  });
  expect(get).toHaveBeenCalledTimes(1);
  expect(get.mock.calls[0][1]?.headers).not.toHaveProperty('Cookie');
});
it('does not retry a rejected public request with environment credentials', async () => {
  get.mockRejectedValueOnce(new Error('ESPN access denied'));
  await expect(discoverSeasons(league, 'public')).resolves.toEqual({
    years: [2025],
    activeSeason: 2025,
    activeManagerKeys: [],
  });
  expect(get).toHaveBeenCalledTimes(1);
  expect(get.mock.calls[0][1]?.headers).not.toHaveProperty('Cookie');
});

it('default ESPN access never reads global cookies', async () => {
  await new EspnProvider().get('111', 2025, ['mSettings']);
  expect(get.mock.calls[0][1]?.headers).not.toHaveProperty('Cookie');
});
