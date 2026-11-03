// @vitest-environment node
import axios from 'axios';
import { historicalSleeperProjections } from './historical-projections.server';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => vi.resetAllMocks());

it('loads the exact historical season/week and uses that league’s scoring, preserving zero and negative projections', async () => {
  vi.mocked(axios.get).mockResolvedValue({
    data: [
      { player_id: 'rb', stats: { rush_yd: 100, rec: 2 } },
      { player_id: 'zero', stats: { rush_yd: 0 } },
      { player_id: 'negative', stats: { rush_yd: -10 } },
      { player_id: 'missing', stats: {} },
      { player_id: 'unrelated', stats: { pass_yd: 100 } },
      { player_id: 'invalid', stats: { rush_yd: Infinity } },
      { player_id: 'wrong-season', season: '2024', week: 7, stats: { rush_yd: 100 } },
      { player_id: 'wrong-week', season: '2023', week: 8, stats: { rush_yd: 100 } },
    ],
  });
  expect([...(await historicalSleeperProjections(2023, 7, { rush_yd: 0.1, rec: 0.5 }))]).toEqual([
    ['rb', 11],
    ['zero', 0],
    ['negative', -1],
  ]);
  expect(axios.get).toHaveBeenCalledWith(
    'https://api.sleeper.app/projections/nfl/2023/7',
    expect.objectContaining({ params: expect.objectContaining({ season_type: 'regular' }) }),
  );
});

it('does not substitute empty or malformed provider responses with a current-season forecast', async () => {
  vi.mocked(axios.get).mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: {} });
  expect(await historicalSleeperProjections(2021, 2, { rec: 1 })).toEqual(new Map());
  await expect(historicalSleeperProjections(2021, 3, { rec: 1 })).rejects.toThrow(
    'Invalid historical Sleeper projection response',
  );
  expect(vi.mocked(axios.get).mock.calls.map(([url]) => url)).toEqual([
    'https://api.sleeper.app/projections/nfl/2021/2',
    'https://api.sleeper.app/projections/nfl/2021/3',
  ]);
});
