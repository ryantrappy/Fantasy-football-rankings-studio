// @vitest-environment node
import RankingsService from '../services/rankings.service';
import type { WeeklyRanking } from '../interfaces/weeklyRanking.interface';
it('uses an atomic revision predicate so two writers cannot both save revision zero', async () => {
  const service = new RankingsService();
  const base = {
    _id: 'a'.repeat(24),
    leagueId: '1',
    year: 2026,
    week: 1,
    rankingsTitle: 'Original',
    introduction: '',
    revision: 0,
    teams: [
      {
        teamId: '1',
        teamName: 'Team',
        managerName: 'A',
        description: '',
        position: 1,
        wins: 0,
        loss: 0,
        ties: 0,
      },
    ],
  } as WeeklyRanking;
  let stored = { ...base };
  vi.spyOn(service, 'getRankingById').mockImplementation(async () => ({ ...stored }));
  const atomic = vi
    .spyOn(service.weeklyRankings, 'findOneAndUpdate')
    .mockImplementation((filter, update) => {
      const f = filter as { revision?: number; $or?: unknown[] };
      const u = update as { $set: WeeklyRanking; $inc: { revision: number } };
      if ((f.revision ?? 0) !== stored.revision) return Promise.resolve(null) as never;
      expect(f.$or || f.revision).toBeDefined();
      expect(u.$inc.revision).toBe(1);
      stored = { ...stored, ...u.$set, revision: stored.revision! + 1 };
      return Promise.resolve({ ...stored }) as never;
    });
  const results = await Promise.allSettled([
    service.updateRanking(base._id!, { ...base, rankingsTitle: 'Writer A' }, 'owner'),
    service.updateRanking(base._id!, { ...base, rankingsTitle: 'Writer B' }, 'owner'),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  expect(stored.revision).toBe(1);
  expect(stored.rankingsTitle).toBe('Writer A');
  atomic.mockRestore();
});
