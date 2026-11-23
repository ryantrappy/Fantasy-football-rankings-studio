// @vitest-environment node
const get = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { get } }));

const revision = 'a'.repeat(40);
const updatedAt = '2026-11-20T07:36:14Z';
const meta = (date = updatedAt) => ({
  data: [{ sha: revision, commit: { committer: { date } } }],
});
const csv = [
  'name,espn_id,sleeper_id',
  '"Example, Player",901,13501',
  '"A repeated"" name",901,13501',
  'Ambiguous,902,13502',
  'Ambiguous,903,13502',
  'Another,902,13503',
  'Invalid,NA,13504',
].join('\r\n');

let load: typeof import('../dynastyprocess-player-ids.server').loadDynastyProcessPlayerIds;
beforeEach(async () => {
  vi.resetModules();
  get.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-23T00:00:00Z'));
  load = (await import('../dynastyprocess-player-ids.server')).loadDynastyProcessPlayerIds;
});
afterEach(() => vi.useRealTimers());

it('coalesces reads, parses quoted fields, and reads CSV by verified revision', async () => {
  get.mockResolvedValueOnce(meta()).mockResolvedValueOnce({ data: csv });
  const [snapshot, concurrent] = await Promise.all([load(), load()]);
  expect(snapshot).toBe(concurrent);
  expect(snapshot).toMatchObject({ revision, updatedAt });
  expect(snapshot?.bySleeper.get('13501')).toEqual(new Set(['901']));
  expect(snapshot?.bySleeper.get('13502')).toEqual(new Set(['902', '903']));
  expect(snapshot?.byEspn.get('902')).toEqual(new Set(['13502', '13503']));
  expect(snapshot?.bySleeper.has('13504')).toBe(false);
  expect(get.mock.calls[1][0]).toContain(`/${revision}/files/db_playerids.csv`);
  expect(await load()).toBe(snapshot);
  expect(get).toHaveBeenCalledTimes(2);
});

it('ignores an old upstream snapshot and delays retries', async () => {
  get.mockResolvedValueOnce(meta('2026-09-01T00:00:00Z'));
  expect(await load()).toBeUndefined();
  expect(await load()).toBeUndefined();
  expect(get).toHaveBeenCalledTimes(1);
});

it('retains the last fresh version during an outage and discards it after it ages out', async () => {
  get.mockResolvedValueOnce(meta()).mockResolvedValueOnce({ data: csv });
  const snapshot = await load();
  get.mockRejectedValue(new Error('Unavailable'));
  vi.setSystemTime(new Date('2026-11-25T00:00:00Z'));
  expect(await load()).toBe(snapshot);
  vi.setSystemTime(new Date('2027-01-06T00:00:00Z'));
  expect(await load()).toBeUndefined();
});

it('ignores malformed or changed CSV schema', async () => {
  get.mockResolvedValueOnce(meta()).mockResolvedValueOnce({ data: 'name,espn_id,"unclosed\n' });
  expect(await load()).toBeUndefined();
});
