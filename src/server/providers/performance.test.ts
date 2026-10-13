// @vitest-environment node
import axios from 'axios';
import SleeperProvider from './sleeper.provider';
import EspnProvider from './espn.provider';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(axios.get);
const league = { leagueId: '123', leagueName: 'League', leagueType: 0 as const, seasonId: 2026 };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
  get.mockReset();
});

it('shares six HTTP slots across Sleeper and ESPN instances, releasing failed requests', async () => {
  const pending: ReturnType<typeof deferred<{ data: { id: number } }>>[] = [];
  let active = 0;
  let peak = 0;
  get.mockImplementation(() => {
    const read = deferred<{ data: { id: number } }>();
    pending.push(read);
    peak = Math.max(peak, ++active);
    return read.promise.finally(() => active--);
  });
  const requests = Array.from({ length: 9 }, (_, index) =>
    index % 2
      ? new EspnProvider().get(String(index), 2026, ['mSettings'])
      : new SleeperProvider().get(String(index)),
  );
  const settled = Promise.allSettled(requests);
  await vi.waitFor(() => expect(pending).toHaveLength(6));
  expect(active).toBe(6);
  pending[0].reject(new Error('provider unavailable'));
  await vi.waitFor(() => expect(pending).toHaveLength(7));
  expect(active).toBe(6);
  pending[1].resolve({ data: { id: 123 } });
  await vi.waitFor(() => expect(pending).toHaveLength(8));
  pending[2].resolve({ data: { id: 123 } });
  await vi.waitFor(() => expect(pending).toHaveLength(9));
  pending.slice(3).forEach((read) => read.resolve({ data: { id: 123 } }));
  const outcomes = await settled;
  expect(outcomes.filter((result) => result.status === 'rejected')).toHaveLength(1);
  expect(peak).toBe(6);
  expect(active).toBe(0);
  get.mockResolvedValue({ data: { id: 123 } });
  await expect(new SleeperProvider().get('retry')).resolves.toEqual({ id: 123 });
});

it('reuses in-flight and successful report reads, while failed reads can be retried', async () => {
  const provider = new SleeperProvider(true);
  const pending = deferred<{ data: string[] }>();
  get.mockReturnValueOnce(pending.promise);
  const first = provider.get('123/rosters');
  const duplicate = provider.get('123/rosters');
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  pending.resolve({ data: ['roster'] });
  expect(await Promise.all([first, duplicate])).toEqual([['roster'], ['roster']]);
  await expect(provider.get('123/rosters')).resolves.toEqual(['roster']);
  expect(get).toHaveBeenCalledTimes(1);

  get.mockRejectedValueOnce(new Error('temporary failure'));
  await expect(provider.get('123/users')).rejects.toThrow('temporary failure');
  get.mockResolvedValueOnce({ data: ['user'] });
  await expect(provider.get('123/users')).resolves.toEqual(['user']);
  expect(get).toHaveBeenCalledTimes(3);

  get.mockResolvedValueOnce({ data: ['new report'] });
  await expect(new SleeperProvider(true).get('123/rosters')).resolves.toEqual(['new report']);
});

it('keeps default provider reads fresh for subsequent requests', async () => {
  const provider = new SleeperProvider();
  get.mockResolvedValueOnce({ data: ['before'] }).mockResolvedValueOnce({ data: ['after'] });
  await expect(provider.get('123/rosters')).resolves.toEqual(['before']);
  await expect(provider.get('123/rosters')).resolves.toEqual(['after']);
  expect(get).toHaveBeenCalledTimes(2);
});

it('loads historical weeks with three rolling slots and preserves reconstructed records', async () => {
  const provider = new SleeperProvider();
  vi.spyOn(provider, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    season: '2026',
    name: 'League',
    total_rosters: 2,
    settings: { start_week: 1, last_scored_leg: 4, playoff_week_start: 5 },
  });
  const teams = [1, 2].map((id) => ({
    teamId: String(id),
    teamName: `Team ${id}`,
    managerName: 'Manager',
    wins: 9,
    loss: 5,
    ties: 0,
  }));
  vi.spyOn(provider, 'getTeams').mockResolvedValue(teams);
  get.mockResolvedValue({ data: { season: '2026', season_type: 'regular', leg: 5 } });
  type Rows = { roster_id: number; matchup_id: number; points: number; custom_points?: number }[];
  const weeks = new Map<number, ReturnType<typeof deferred<Rows>>>();
  let active = 0;
  let peak = 0;
  vi.spyOn(provider, 'get').mockImplementation((path) => {
    const week = Number(path.split('/').at(-1));
    const read = deferred<Rows>();
    weeks.set(week, read);
    peak = Math.max(peak, ++active);
    return read.promise.finally(() => active--) as never;
  });
  const rows = (week: number): Rows => [
    {
      roster_id: 1,
      matchup_id: 1,
      points: week === 1 ? 100 : 90,
      ...(week === 4 ? { custom_points: 110 } : {}),
    },
    { roster_id: 2, matchup_id: 1, points: week === 2 ? 100 : 90 },
  ];
  const report = provider.getHistoricalTeams(league, 2026, 10);
  await vi.waitFor(() => expect([...weeks.keys()]).toEqual([1, 2, 3]));
  weeks.get(3)!.resolve(rows(3));
  await vi.waitFor(() => expect([...weeks.keys()]).toEqual([1, 2, 3, 4]));
  weeks.get(4)!.resolve(rows(4));
  weeks.get(2)!.resolve(rows(2));
  weeks.get(1)!.resolve(rows(1));
  expect(await report).toMatchObject([
    { teamId: '1', wins: 2, loss: 1, ties: 1 },
    { teamId: '2', wins: 1, loss: 2, ties: 1 },
  ]);
  expect(peak).toBe(3);
  expect(active).toBe(0);
  expect(teams[0].wins).toBe(9);
});
