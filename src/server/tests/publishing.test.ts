// @vitest-environment node
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
import { publishing, publicationModel } from '../publishing.server';
import RankingsService from '../services/rankings.service';
const base = {
  _id: 'a'.repeat(24),
  revision: 1,
  leagueId: '1',
  year: 2026,
  week: 1,
  rankingsTitle: 'Published',
  introduction: 'Public intro',
  teams: [
    {
      teamId: '1',
      teamName: 'Team',
      managerName: 'Manager',
      description: 'Public commentary',
      position: 1,
      wins: 0,
      loss: 0,
      ties: 0,
    },
  ],
};
afterEach(() => vi.restoreAllMocks());
it('publishes only a saved snapshot, excludes metadata, and revokes its link', async () => {
  let document: Record<string, unknown> | null = null;
  const read = vi.spyOn(RankingsService.prototype, 'getRankingById').mockResolvedValue(base);
  vi.spyOn(publicationModel, 'findOneAndUpdate').mockImplementation((_filter, update) => {
    const u = update as { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> };
    document = JSON.parse(JSON.stringify({ ...u.$set, ...u.$setOnInsert }));
    return Promise.resolve(document) as never;
  });
  vi.spyOn(publicationModel, 'findOne').mockImplementation(
    () => Promise.resolve(document) as never,
  );
  vi.spyOn(publicationModel, 'deleteOne').mockImplementation(() => {
    document = null;
    return Promise.resolve({ deletedCount: 1 }) as never;
  });
  const status = await publishing.publish('owner', { id: base._id, revision: 1 });
  expect(read).toHaveBeenCalledWith(base._id, 'owner');
  read.mockResolvedValue({ ...base, revision: 2, introduction: 'Private next draft' });
  const publicRead = await publishing.read({ publicId: status.publicId });
  expect(publicRead.ranking.introduction).toBe('Public intro');
  expect(publicRead.ranking._id).toBeUndefined();
  expect(publicRead.ranking.revision).toBeUndefined();
  await publishing.unpublish('owner', { id: base._id });
  await expect(publishing.read({ publicId: status.publicId })).rejects.toMatchObject({
    status: 404,
  });
});
it('rejects non-owners and stale publication requests before writing', async () => {
  const read = vi
    .spyOn(RankingsService.prototype, 'getRankingById')
    .mockRejectedValueOnce(new Error('Not yours'))
    .mockResolvedValue({ ...base, revision: 2 });
  const write = vi.spyOn(publicationModel, 'findOneAndUpdate');
  await expect(publishing.publish('other', { id: base._id, revision: 1 })).rejects.toThrow(
    'Not yours',
  );
  await expect(publishing.publish('owner', { id: base._id, revision: 1 })).rejects.toMatchObject({
    status: 409,
  });
  expect(read).toHaveBeenCalledTimes(2);
  expect(write).not.toHaveBeenCalled();
});
