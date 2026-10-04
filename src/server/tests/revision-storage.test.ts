// @vitest-environment node
import { BSON } from 'bson';
import RankingsService from '../services/rankings.service';
import type { WeeklyRanking } from '../interfaces/weeklyRanking.interface';
function setup() {
  const service = new RankingsService();
  vi.spyOn(service.leagueService, 'getLeagueById').mockResolvedValue({ leagueId: '1' } as never);
  let stored: WeeklyRanking = {
    _id: 'a'.repeat(24),
    leagueId: '1',
    year: 2026,
    week: 5,
    revision: 0,
    rankingsTitle: 'Original',
    introduction: '',
    teams: Array.from({ length: 14 }, (_, index) => ({
      teamId: String(index + 1),
      teamName: 'Team',
      managerName: 'Owner',
      description: 'x'.repeat(10000),
      position: index + 1,
      wins: 0,
      loss: 0,
      ties: 0,
    })),
  };
  const archive = new Map<number, { savedAt: string; ranking: WeeklyRanking }>();
  const archiveWrite = vi.fn(async (filter, mutation) => {
    if (!archive.has(filter.revision))
      archive.set(filter.revision, structuredClone(mutation.$setOnInsert));
  });
  const history = {
    updateOne: archiveWrite,
    find: vi.fn((filter) => ({
      sort: () => ({
        limit: (limit: number) => ({
          lean: async () =>
            [...archive.entries()]
              .filter(([revision]) => revision < filter.revision.$lt)
              .sort(([a], [b]) => b - a)
              .slice(0, limit)
              .map(([, entry]) => entry),
        }),
      }),
    })),
    findOne: vi.fn((filter) => ({ lean: async () => archive.get(filter.revision) ?? null })),
  };
  service.revisionHistory = history as never;
  vi.spyOn(service, 'getRankingById').mockImplementation(async () => structuredClone(stored));
  service.weeklyRankings = {
    findById: vi.fn(() => ({ select: () => ({ lean: async () => structuredClone(stored) }) })),
    updateOne: vi.fn(async () => {
      delete stored.revisions;
    }),
    findOneAndUpdate: vi.fn(async (filter, mutation) => {
      if ((filter.revision ?? 0) !== stored.revision) return null;
      expect(archive.has(stored.revision!)).toBe(true);
      stored = { ...stored, ...mutation.$set, revision: stored.revision! + 1 };
      return structuredClone(stored);
    }),
  } as never;
  return { service, archive, archiveWrite, current: () => stored };
}
it('keeps live documents small beyond 120 large saves and pages immutable snapshots', async () => {
  const { service, archive, current } = setup();
  for (let i = 0; i < 130; i++)
    await service.updateRanking(
      current()._id!,
      { ...current(), rankingsTitle: `Save ${i}` },
      'owner',
    );
  expect(current().revision).toBe(130);
  expect(BSON.calculateObjectSize(current())).toBeLessThan(200000);
  expect(archive.size).toBe(130);
  const first = await service.getRevisions(current()._id!, 'owner');
  expect(first.map((entry) => entry.ranking.revision)).toEqual([
    130, 129, 128, 127, 126, 125, 124, 123, 122, 121, 120,
  ]);
  const older = await service.getRevisions(current()._id!, 'owner', 120);
  expect(older[0].ranking.revision).toBe(119);
  expect(older).toHaveLength(10);
  await service.restoreRevision(current()._id!, 0, 130, 'owner');
  expect(current()).toMatchObject({ rankingsTitle: 'Original', revision: 131 });
  expect(archive.size).toBe(131);
  await expect(service.restoreRevision(current()._id!, 0, 130, 'owner')).rejects.toMatchObject({
    status: 409,
  });
});
it('migrates embedded history idempotently and retains it when archive persistence fails', async () => {
  const { service, archiveWrite, archive, current } = setup();
  const old = { ...current(), rankingsTitle: 'Legacy', revision: 0 };
  current().revision = 1;
  current().revisions = [{ savedAt: '2026-01-01', ranking: old }];
  archiveWrite.mockRejectedValueOnce(new Error('database unavailable'));
  await expect(
    service.updateRanking(current()._id!, { ...current(), rankingsTitle: 'Next' }, 'owner'),
  ).rejects.toThrow('database unavailable');
  expect(current().revisions).toHaveLength(1);
  expect(current().revision).toBe(1);
  await service.restoreRevision(current()._id!, 0, 1, 'owner');
  expect(current()).toMatchObject({ rankingsTitle: 'Legacy', revision: 2 });
  expect(current().revisions).toBeUndefined();
  expect(archive.get(0)?.ranking.rankingsTitle).toBe('Legacy');
});
it('does not change the current edition if its archive write fails', async () => {
  const { service, archiveWrite, current } = setup();
  archiveWrite.mockRejectedValueOnce(new Error('offline'));
  await expect(
    service.updateRanking(current()._id!, { ...current(), rankingsTitle: 'Changed' }, 'owner'),
  ).rejects.toThrow('offline');
  expect(current()).toMatchObject({ rankingsTitle: 'Original', revision: 0 });
});
