// @vitest-environment node
import axios from 'axios';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
let read: (typeof import('../insights/load.server'))['sleeperNames'];
let now: number;
const catalog = {
  p: {
    full_name: 'Public Player',
    position: 'RB',
    team: 'BUF',
    espn_id: 7,
    injury_status: 'QUESTIONABLE',
    ownerSubject: 'ignored',
    roster_id: 1,
  },
  BUF: { first_name: 'Buffalo', last_name: 'Bills', position: 'DEF' },
};
beforeEach(async () => {
  vi.resetModules();
  vi.mocked(axios.get).mockReset();
  now = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  read = (await import('../insights/load.server')).sleeperNames;
});
afterEach(() => vi.restoreAllMocks());

function deferred() {
  let resolve!: (value: any) => void, reject!: (error: Error) => void;
  const promise = new Promise((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  vi.mocked(axios.get).mockReturnValueOnce(promise as never);
  return { resolve, reject };
}

it('coalesces concurrent cold reads and normalizes only public player fields without credentials', async () => {
  const pending = deferred();
  const calls = [read(), read(), read(), read()];
  expect(calls.every((call) => call === calls[0])).toBe(true);
  expect(axios.get).toHaveBeenCalledTimes(1);
  pending.resolve({ data: catalog });
  const results = await Promise.all(calls);
  expect(results.every((value) => value === results[0])).toBe(true);
  expect(results[0]).toMatchObject({
    names: { p: 'Public Player', BUF: 'Buffalo Bills' },
    positions: { p: 'RB', BUF: 'DST' },
    teams: { p: 'BUF' },
    espnIds: { p: '7' },
    availability: { p: 'QUESTIONABLE', BUF: null },
  });
  expect(JSON.stringify(results[0])).not.toMatch(/ownerSubject|roster_id|ignored/);
  expect(axios.get).toHaveBeenCalledWith('https://api.sleeper.app/v1/players/nfl', {
    timeout: 20000,
  });
  expect(await read()).toBe(results[0]);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it('shares expired refreshes and starts the next five-minute TTL after completion', async () => {
  vi.mocked(axios.get).mockResolvedValueOnce({ data: catalog });
  const original = await read();
  now = 299999;
  expect(await read()).toBe(original);
  now = 300000;
  const pending = deferred();
  const first = read(),
    second = read();
  expect(first).toBe(second);
  expect(axios.get).toHaveBeenCalledTimes(2);
  now = 310000;
  pending.resolve({ data: { p: { full_name: 'Updated Player', position: 'WR' } } });
  const updated = await first;
  expect(updated.names.p).toBe('Updated Player');
  now = 609999;
  expect(await read()).toBe(updated);
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it.each([false, true])(
  'shares failures and retries after cold/expired reads (%s)',
  async (expired) => {
    if (expired) {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: catalog });
      await read();
      now = 300000;
    }
    const pending = deferred();
    const results = Promise.allSettled([read(), read()]);
    pending.reject(new Error('Provider unavailable'));
    expect((await results).every((result) => result.status === 'rejected')).toBe(true);
    vi.mocked(axios.get).mockResolvedValueOnce({ data: catalog });
    expect((await read()).names.p).toBe('Public Player');
    expect(axios.get).toHaveBeenCalledTimes(expired ? 3 : 2);
  },
);
