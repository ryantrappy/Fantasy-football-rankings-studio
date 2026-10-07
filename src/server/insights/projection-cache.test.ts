// @vitest-environment node
import { cachedFutureProjection } from './projection-cache.server';
import { seasonProjectionCacheModel } from '../models/season-projection-cache.model';
import { connectDatabase } from '../database.server';
import type { PlayoffProjection } from '../../insights';

vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../logging.server', () => ({ logServerError: vi.fn() }));

const projection = (): PlayoffProjection => ({
  provider: 'Sleeper',
  week: 6,
  teamPoints: { A: 20 },
  positionPoints: { A: { QB: 20 } },
  lineups: { A: ['qb'] },
  optimizedLineup: true,
  coveredStarters: 1,
  totalStarters: 1,
});
const context = { provider: 'Sleeper', leagueId: '123', year: 2026, week: 6, roster: ['qb'] };
let documents: Map<string, { capturedAt: Date; expiresAt: Date; projection: PlayoffProjection }>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T21:00:00Z'));
  vi.mocked(connectDatabase).mockResolvedValue();
  documents = new Map();
  vi.spyOn(seasonProjectionCacheModel, 'findOne').mockImplementation((filter: any) => {
    const doc = documents.get(filter.key);
    return {
      lean: () => Promise.resolve(doc && doc.expiresAt > new Date() ? doc : null),
    } as never;
  });
  vi.spyOn(seasonProjectionCacheModel, 'updateOne').mockImplementation(
    (filter: any, update: any) => {
      documents.set(filter.key, structuredClone(update.$set));
      return Promise.resolve({}) as never;
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it.each(['Sleeper', 'ESPN'] as const)(
  'persists and reuses complete future %s projections',
  async (provider) => {
    const read = vi.fn().mockResolvedValue({ ...projection(), provider });
    const scope = { ...context, provider };
    const first = await cachedFutureProjection(scope, read);
    const cached = await cachedFutureProjection(scope, read);
    expect(read).toHaveBeenCalledTimes(1);
    expect(documents.size).toBe(1);
    expect(cached.teamPoints).toEqual(first.teamPoints);
    expect(cached.capturedAt).toBe(first.capturedAt);
    expect(cached.note).toContain('Using cached week 6');
    expect(seasonProjectionCacheModel.schema.indexes()).toContainEqual([
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    ]);
  },
);

it('refreshes after one hour and replaces the saved projection', async () => {
  const read = vi.fn().mockResolvedValue(projection());
  await cachedFutureProjection(context, read);
  vi.setSystemTime(new Date('2026-10-07T22:00:01Z'));
  read.mockResolvedValue({
    ...projection(),
    teamPoints: { A: 25 },
    positionPoints: { A: { QB: 25 } },
  });
  expect((await cachedFutureProjection(context, read)).teamPoints.A).toBe(25);
  expect(read).toHaveBeenCalledTimes(2);
  expect((await cachedFutureProjection(context, read)).teamPoints.A).toBe(25);
  expect(read).toHaveBeenCalledTimes(2);
});

it.each(['empty', 'failure'] as const)(
  'keeps prior complete data after an %s refresh',
  async (mode) => {
    const read = vi.fn().mockResolvedValue(projection());
    const first = await cachedFutureProjection(context, read);
    vi.setSystemTime(new Date('2026-10-07T23:00:00Z'));
    if (mode === 'failure') read.mockRejectedValue(new Error('Provider down'));
    else
      read.mockResolvedValue({
        ...projection(),
        teamPoints: {},
        positionPoints: {},
        coveredStarters: 0,
      });
    const cached = await cachedFutureProjection(context, read);
    expect(cached.teamPoints.A).toBe(20);
    expect(cached.capturedAt).toBe(first.capturedAt);
    expect(cached.note).toContain('Provider refresh unavailable');
    expect([...documents.values()][0].capturedAt.toISOString()).toBe(first.capturedAt);
    vi.setSystemTime(new Date('2026-10-08T21:00:01Z'));
    if (mode === 'failure')
      await expect(cachedFutureProjection(context, read)).rejects.toThrow('Provider down');
    else expect((await cachedFutureProjection(context, read)).teamPoints).toEqual({});
  },
);

it('does not cache empty or inconsistent projections', async () => {
  const read = vi.fn().mockResolvedValue({ ...projection(), teamPoints: {} });
  await cachedFutureProjection(context, read);
  read.mockResolvedValue({ ...projection(), positionPoints: { A: { QB: 999 } } });
  await cachedFutureProjection(context, read);
  expect(documents.size).toBe(0);
});

it('isolates roster, scoring, workspace, season, week, provider and access changes', async () => {
  const read = vi.fn().mockResolvedValue(projection());
  await cachedFutureProjection(context, read);
  for (const change of [
    { roster: ['new-qb'] },
    { scoring: { passing: 6 } },
    { leagueId: '456' },
    { year: 2027 },
    { week: 7 },
    { provider: 'ESPN' },
    { access: 'owner' },
  ])
    await cachedFutureProjection({ ...context, ...change }, read);
  expect(read).toHaveBeenCalledTimes(8);
  expect(documents.size).toBe(8);
  await cachedFutureProjection(
    { roster: ['qb'], week: 6, year: 2026, leagueId: '123', provider: 'Sleeper' },
    read,
  );
  expect(read).toHaveBeenCalledTimes(8);
});

it('still returns provider data if cache storage fails', async () => {
  vi.mocked(connectDatabase).mockRejectedValueOnce(new Error('Database down'));
  const result = await cachedFutureProjection(context, async () => projection());
  expect(result.teamPoints.A).toBe(20);
  expect(seasonProjectionCacheModel.updateOne).not.toHaveBeenCalled();
});
