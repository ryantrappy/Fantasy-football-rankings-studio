// @vitest-environment node
import { reportSnapshots, reportSnapshotModel } from '../report-snapshots.server';
import LeaguesService from '../services/leagues.service';
import { calculateInsights } from '../insights/calculate';
import { loadInsights } from '../insights/load.server';
import { getEspnCredentials } from '../espn-credentials.server';
import HttpException from '../exceptions/HttpException';
import { cleanupExpiredSnapshots } from '../models/report-snapshot.model';

vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../insights/load.server', () => ({ loadInsights: vi.fn() }));
vi.mock('../espn-credentials.server', () => ({ getEspnCredentials: vi.fn() }));
const league = {
  leagueId: '123',
  leagueType: 1 as const,
  leagueName: 'Private ESPN',
  seasonId: 2026,
  ownerSubject: 'owner',
  espnS2: 'secret',
};
const input = () => ({
  leagueId: '123',
  view: 'history',
  activeSeason: 2026,
  activeManagerKeys: ['espn-owner'],
  records: [2025, 2024].map((year) => ({
    year,
    data: calculateInsights({
      completedWeek: 1,
      teams: [
        { teamId: '1', teamName: 'Saved team', managerName: 'Alex', managerKey: 'espn-owner' },
      ],
      scores: [
        {
          teamId: '1',
          week: 1,
          actual: 100,
          projected: null,
          starters: [],
          bestLineup: { points: 120, correctStarts: 1, slots: 2 },
        },
      ],
      moves: [],
      notes: [],
      draftPickTrades: 0,
      playerNames: {},
    }),
  })),
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('stores independent snapshots and reads them without provider calls or credentials', async () => {
  const owned = vi.spyOn(LeaguesService.prototype, 'getLeagueById').mockResolvedValue(league);
  const documents = new Map<string, unknown>();
  vi.spyOn(reportSnapshotModel, 'create').mockImplementation((doc) => {
    const value = JSON.parse(JSON.stringify(doc));
    documents.set(value.publicId, value);
    return Promise.resolve(value) as never;
  });
  vi.spyOn(reportSnapshotModel, 'findOne').mockImplementation(
    (filter) =>
      Promise.resolve(documents.get((filter as unknown as { publicId: string }).publicId)) as never,
  );
  const original = input();
  const dirty = {
    ...original,
    espnS2: 'secret',
    records: original.records.map((record) => ({
      ...record,
      data: {
        ...record.data,
        ownerSubject: 'private-account',
        teams: record.data.teams.map((team) => ({ ...team, swid: 'secret' })),
      },
    })),
  };
  const first = await reportSnapshots.create('owner', dirty);
  expect(new Date(first.expiresAt).getTime() - new Date(first.savedAt).getTime()).toBe(
    10 * 24 * 60 * 60 * 1000,
  );
  original.records[0].data.scores[0].actual = 200;
  const second = await reportSnapshots.create('owner', original);
  expect(first.publicId).not.toBe(second.publicId);
  const saved = await reportSnapshots.read({ publicId: first.publicId });
  expect(saved.records).toHaveLength(2);
  expect(saved.records[0].data.scores[0].actual).toBe(100);
  expect(saved.records[0].data.scores[0].bestLineup?.points).toBe(120);
  expect(saved.records[1].data.teams[0].managerKey).toBe(saved.activeManagerKeys[0]);
  expect(JSON.stringify(saved)).not.toMatch(/secret|espn-owner|ownerSubject|swid|espnS2/);
  expect(owned).toHaveBeenLastCalledWith('123', 'owner');
  expect(loadInsights).not.toHaveBeenCalled();
  expect(getEspnCredentials).not.toHaveBeenCalled();
  owned.mockResolvedValue({ ...league, publicReports: false });
  await expect(reportSnapshots.read({ publicId: first.publicId })).rejects.toMatchObject({
    status: 404,
  });
});

it('rejects non-owners, disabled sharing and malformed requests before writing', async () => {
  const owned = vi
    .spyOn(LeaguesService.prototype, 'getLeagueById')
    .mockRejectedValue(new HttpException(404, 'Not found'));
  const write = vi.spyOn(reportSnapshotModel, 'create');
  await expect(reportSnapshots.create('other', input())).rejects.toMatchObject({ status: 404 });
  expect(owned).toHaveBeenCalledWith('123', 'other');
  owned.mockResolvedValue({ ...league, publicReports: false });
  await expect(reportSnapshots.create('owner', input())).rejects.toMatchObject({ status: 409 });
  owned.mockResolvedValue(league);
  await expect(reportSnapshots.create('owner', { ...input(), records: [] })).rejects.toThrow();
  expect(write).not.toHaveBeenCalled();
});

it('rejects malformed and missing snapshot IDs', async () => {
  const read = vi.spyOn(reportSnapshotModel, 'findOne').mockResolvedValue(null);
  await expect(reportSnapshots.read({ publicId: { $ne: '' } })).rejects.toThrow();
  expect(read).not.toHaveBeenCalled();
  await expect(
    reportSnapshots.read({ publicId: '0a460a85-0fa7-4daa-8617-56de7c568bba' }),
  ).rejects.toMatchObject({ status: 404 });
});

it('denies an expired snapshot before TTL deletion and cleans overdue records after downtime', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-25T12:00:00Z'));
  const owned = vi.spyOn(LeaguesService.prototype, 'getLeagueById');
  vi.spyOn(reportSnapshotModel, 'findOne').mockResolvedValue({
    publicId: '0a460a85-0fa7-4daa-8617-56de7c568bba',
    expiresAt: new Date('2026-09-25T12:00:00Z'),
  });
  await expect(
    reportSnapshots.read({ publicId: '0a460a85-0fa7-4daa-8617-56de7c568bba' }),
  ).rejects.toMatchObject({ status: 404 });
  expect(owned).not.toHaveBeenCalled();
  const remove = vi
    .spyOn(reportSnapshotModel, 'deleteMany')
    .mockResolvedValue({ acknowledged: true, deletedCount: 2 });
  vi.setSystemTime(new Date('2026-10-10T12:00:00Z'));
  await cleanupExpiredSnapshots();
  expect(remove).toHaveBeenCalledWith({ expiresAt: { $lte: new Date('2026-10-10T12:00:00Z') } });
  expect(reportSnapshotModel.schema.indexes()).toContainEqual([
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  ]);
});
