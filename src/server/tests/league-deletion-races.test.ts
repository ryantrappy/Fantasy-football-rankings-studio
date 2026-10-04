// @vitest-environment node
import LeaguesService from '../services/leagues.service';
import RankingsService from '../services/rankings.service';
import { publicationModel, publishing } from '../publishing.server';
import leagueModel from '../models/league.model';
import rankingModel from '../models/weeklyRanking.model';
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
const base = {
  leagueId: '1',
  year: 2026,
  week: 1,
  rankingsTitle: 'Edition',
  introduction: '',
  revision: 0,
  teams: [
    {
      teamId: '1',
      teamName: 'Team',
      managerName: 'Owner',
      description: '',
      position: 1,
      wins: 0,
      loss: 0,
      ties: 0,
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
  const workspace = {
    leagueId: '1',
    providerLeagueId: '99',
    ownerSubject: 'owner',
    leagueName: 'League',
    leagueType: 0,
    seasonId: 2026,
    deleted: false,
    deletionRankingIds: [] as string[],
  };
  let removed = false;
  const rows = new Map<string, typeof base>();
  const publications = new Map<string, object>();
  const league = new LeaguesService();
  league.leagues = {
    findOne: vi.fn((filter) => ({
      lean: async () =>
        filter.ownerSubject === 'owner' && !removed && !(filter.deleted && workspace.deleted)
          ? structuredClone(workspace)
          : null,
    })),
    findOneAndUpdate: vi.fn(async (_filter, mutation) => {
      Object.assign(workspace, mutation.$set);
      return workspace;
    }),
    updateOne: vi.fn(async (_filter, mutation) => {
      workspace.deletionRankingIds = [
        ...new Set([
          ...workspace.deletionRankingIds,
          ...mutation.$addToSet.deletionRankingIds.$each,
        ]),
      ];
    }),
    deleteOne: vi.fn(async () => {
      removed = true;
      return { deletedCount: 1 };
    }),
  } as never;
  const rankingDb = {
    find: vi.fn(() => ({
      select: () => ({ lean: async () => [...rows.keys()].map((_id) => ({ _id })) }),
    })),
    deleteMany: vi.fn(async () => {
      rows.clear();
    }),
    deleteOne: vi.fn(async (filter) => {
      rows.delete(String(filter._id));
    }),
    exists: vi.fn(async () => null),
    create: vi.fn(async (input) => {
      rows.set('a'.repeat(24), input);
      return { ...input, _id: 'a'.repeat(24) };
    }),
  };
  league.weeklyRankings = rankingDb as never;
  league.revisionHistory = { deleteMany: vi.fn(async () => ({})) } as never;
  league.reportSnapshots = { deleteMany: vi.fn(async () => ({})) } as never;
  vi.spyOn(publicationModel, 'deleteMany').mockImplementation((filter) => {
    for (const id of (filter as unknown as { rankingId: { $in: string[] } }).rankingId.$in)
      publications.delete(id);
    return Promise.resolve({}) as never;
  });
  vi.spyOn(publicationModel, 'deleteOne').mockImplementation((filter) => {
    publications.delete((filter as unknown as { rankingId: string }).rankingId);
    return Promise.resolve({ deletedCount: 1 }) as never;
  });
  return { league, rows, publications, workspace, rankingDb };
}
it('compensates a create that completes after permanent deletion', async () => {
  const { league, rows, rankingDb } = setup();
  const entered = gate(),
    resume = gate();
  rankingDb.create.mockImplementationOnce(async (input) => {
    entered.release();
    await resume.promise;
    rows.set('a'.repeat(24), input);
    return { ...input, _id: 'a'.repeat(24) };
  });
  const rankings = new RankingsService();
  rankings.leagueService = league;
  rankings.weeklyRankings = rankingDb as never;
  const creating = rankings.createNewRanking(base, 'owner');
  await entered.promise;
  await league.deleteLeague('1', 'owner');
  resume.release();
  await expect(creating).rejects.toMatchObject({ status: 404 });
  expect(rows.size).toBe(0);
  await expect(league.getLeagueById('1', 'owner')).rejects.toMatchObject({ status: 404 });
});
it('compensates a publish that passed authorization before deletion', async () => {
  const { league, rows, publications } = setup();
  const id = 'a'.repeat(24);
  rows.set(id, base);
  vi.spyOn(RankingsService.prototype, 'getRankingById').mockResolvedValue({ ...base, _id: id });
  const readWorkspace = league.getLeagueById.bind(league);
  vi.spyOn(LeaguesService.prototype, 'getLeagueById').mockImplementation(readWorkspace);
  const entered = gate(),
    resume = gate();
  vi.spyOn(publicationModel, 'findOneAndUpdate').mockImplementation(
    () =>
      (async () => {
        entered.release();
        await resume.promise;
        const result = {
          rankingId: id,
          publicId: '11111111-1111-4111-8111-111111111111',
          revision: 0,
          publishedAt: 'now',
          ranking: base,
        };
        publications.set(id, result);
        return result;
      })() as never,
  );
  const publishingRequest = publishing.publish('owner', { id, revision: 0 });
  await entered.promise;
  await league.deleteLeague('1', 'owner');
  resume.release();
  await expect(publishingRequest).rejects.toMatchObject({ status: 404 });
  expect(publications.size).toBe(0);
});
it('retains cleanup IDs after a failure so retry removes orphan publications and revisions', async () => {
  const { league, rows, publications, workspace } = setup();
  const id = 'a'.repeat(24);
  rows.set(id, base);
  publications.set(id, {});
  vi.mocked(publicationModel.deleteMany).mockRejectedValueOnce(new Error('cleanup interrupted'));
  await expect(league.deleteLeague('1', 'owner')).rejects.toThrow('cleanup interrupted');
  expect(workspace.deleted).toBe(true);
  expect(workspace.deletionRankingIds).toEqual([id]);
  expect(rows.size).toBe(0);
  await expect(league.getLeagueById('1', 'owner')).rejects.toMatchObject({ status: 404 });
  await expect(league.deleteLeague('1', 'other')).rejects.toMatchObject({ status: 404 });
  expect(publications.size).toBe(1);
  await league.deleteLeague('1', 'owner');
  expect(publications.size).toBe(0);
  expect(league.revisionHistory.deleteMany).toHaveBeenLastCalledWith({ rankingId: { $in: [id] } });
});
it('rejects public orphan editions when the source ranking or workspace is gone', async () => {
  const publicId = '11111111-1111-4111-8111-111111111111';
  vi.spyOn(publicationModel, 'findOne').mockResolvedValue({
    rankingId: 'a'.repeat(24),
    publicId,
    revision: 0,
    publishedAt: 'now',
    ranking: base,
  } as never);
  const source = vi
    .spyOn(rankingModel, 'findById')
    .mockReturnValue({ select: () => ({ lean: async () => null }) } as never);
  await expect(publishing.read({ publicId })).rejects.toMatchObject({ status: 404 });
  source.mockReturnValue({ select: () => ({ lean: async () => ({ leagueId: '1' }) }) } as never);
  vi.spyOn(leagueModel, 'exists').mockResolvedValue(null);
  await expect(publishing.read({ publicId })).rejects.toMatchObject({ status: 404 });
});
