// @vitest-environment node
import { publishing, publicationModel } from '../publishing.server';
import RankingsService from '../services/rankings.service';
import LeaguesService from '../services/leagues.service';
const saved = {
  _id: 'a'.repeat(24),
  leagueId: '1',
  year: 2026,
  week: 1,
  revision: 0,
  rankingsTitle: 'Old',
  introduction: '',
  teams: [
    {
      teamId: '1',
      teamName: 'Team',
      managerName: 'Owner',
      wins: 0,
      loss: 0,
      ties: 0,
      description: 'Approved',
      position: 1,
    },
  ],
};
function gate() {
  let release!: () => void;
  return {
    promise: new Promise<void>((resolve) => {
      release = resolve;
    }),
    release: () => release(),
  };
}
afterEach(() => vi.restoreAllMocks());
function setup() {
  let document: Record<string, unknown> | null = null;
  vi.spyOn(publicationModel, 'findOne').mockImplementation(
    () => ({ lean: async () => (document ? structuredClone(document) : null) }) as never,
  );
  vi.spyOn(publicationModel, 'findOneAndUpdate').mockImplementation((filter, mutation) => {
    const expected = (filter as unknown as { decision?: number | { $exists: boolean } }).decision;
    if (
      expected !== undefined &&
      (typeof expected === 'object'
        ? document?.decision !== undefined
        : document?.decision !== expected)
    )
      return Promise.reject({ code: 11000 }) as never;
    const change = mutation as {
      $set?: Record<string, unknown>;
      $setOnInsert?: Record<string, unknown>;
    };
    document = {
      ...(document ?? change.$setOnInsert ?? {}),
      ...change.$set,
      decision: Number(document?.decision ?? 0) + 1,
    };
    return Promise.resolve(structuredClone(document)) as never;
  });
  vi.spyOn(LeaguesService.prototype, 'getLeagueById').mockResolvedValue({ leagueId: '1' } as never);
  return { current: () => document };
}
it('rejects an old delayed publish after a newer approved snapshot has committed', async () => {
  const { current } = setup();
  const entered = gate(),
    resume = gate();
  vi.spyOn(RankingsService.prototype, 'getRankingById')
    .mockImplementationOnce(async () => {
      entered.release();
      await resume.promise;
      return saved;
    })
    .mockResolvedValue({ ...saved, revision: 1, rankingsTitle: 'New' });
  const old = publishing.publish('owner', { id: saved._id, revision: 0 });
  await entered.promise;
  await publishing.publish('owner', { id: saved._id, revision: 1 });
  resume.release();
  await expect(old).rejects.toMatchObject({ status: 409 });
  expect(current()).toMatchObject({
    revision: 1,
    ranking: { rankingsTitle: 'New', teams: [{ description: 'Approved' }] },
    revoked: false,
  });
});
it('keeps a later unpublish revoked against a delayed publish, then permits intentional republishing', async () => {
  const { current } = setup();
  const entered = gate(),
    resume = gate();
  vi.spyOn(RankingsService.prototype, 'getRankingById')
    .mockImplementationOnce(async () => {
      entered.release();
      await resume.promise;
      return saved;
    })
    .mockResolvedValue(saved);
  const old = publishing.publish('owner', { id: saved._id, revision: 0 });
  await entered.promise;
  await publishing.unpublish('owner', { id: saved._id });
  resume.release();
  await expect(old).rejects.toMatchObject({ status: 409 });
  expect(current()).toMatchObject({ revoked: true, decision: 1 });
  expect(await publishing.status('owner', { id: saved._id })).toBeNull();
  const result = await publishing.publish('owner', { id: saved._id, revision: 0 });
  expect(result.revision).toBe(0);
  expect(current()).toMatchObject({
    revoked: false,
    decision: 2,
    ranking: { rankingsTitle: 'Old' },
  });
});
