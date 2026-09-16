// @vitest-environment node
const update = vi.hoisted(() => vi.fn());
const findOne = vi.hoisted(() => vi.fn());
const publicationDeleteMany = vi.hoisted(() => vi.fn());
vi.mock('../models/league.model', () => ({
  default: { findOneAndUpdate: update, findOne },
}));
vi.mock('../publishing.server', () => ({
  publicationModel: { deleteMany: publicationDeleteMany },
}));
import LeaguesService from '../services/leagues.service';

beforeEach(() => {
  update.mockReset();
  findOne.mockReset();
  findOne.mockReturnValue({
    lean: () =>
      Promise.resolve({ leagueId: '1', providerLeagueId: '99', leagueType: 0, seasonId: 2026 }),
  });
});

it('renames only the owner workspace and returns the updated league', async () => {
  update.mockResolvedValue({
    leagueId: '1',
    providerLeagueId: '99',
    leagueName: 'Writers league',
    leagueType: 0,
    seasonId: 2026,
  });
  const result = await new LeaguesService().rename('1', '  Writers league  ', 'owner');
  expect(update).toHaveBeenCalledWith(
    { ownerSubject: 'owner', $or: [{ leagueId: '1' }, { providerLeagueId: '1' }] },
    { $set: { leagueName: 'Writers league' } },
    { returnDocument: 'after' },
  );
  expect(result.leagueName).toBe('Writers league');
  expect(result.providerLeagueId).toBe('99');
});

it('rejects blank and unreasonable names before writing', async () => {
  const service = new LeaguesService();
  await expect(service.rename('1', '   ', 'owner')).rejects.toMatchObject({ status: 400 });
  await expect(service.rename('1', 'x'.repeat(121), 'owner')).rejects.toMatchObject({
    status: 400,
  });
  expect(update).not.toHaveBeenCalled();
});

it('does not reveal or rename another owner workspace', async () => {
  update.mockResolvedValue(null);
  await expect(new LeaguesService().rename('1', 'New name', 'other')).rejects.toMatchObject({
    status: 404,
  });
});

it('renames by provider league ID while retaining owner isolation', async () => {
  update.mockResolvedValue({
    leagueId: 'workspace-1',
    providerLeagueId: '99',
    leagueName: 'Renamed',
    leagueType: 0,
    seasonId: 2026,
  });
  await new LeaguesService().rename('99', 'Renamed', 'owner');
  expect(update).toHaveBeenCalledWith(
    { ownerSubject: 'owner', $or: [{ leagueId: '99' }, { providerLeagueId: '99' }] },
    { $set: { leagueName: 'Renamed' } },
    { returnDocument: 'after' },
  );
});

it('archives by provider league ID', async () => {
  update.mockResolvedValue({ leagueId: 'workspace-1', providerLeagueId: '99' });
  await new LeaguesService().setArchived('99', true, 'owner');
  expect(update).toHaveBeenCalledWith(
    { ownerSubject: 'owner', $or: [{ leagueId: '99' }, { providerLeagueId: '99' }] },
    { $set: { archived: true } },
    { returnDocument: 'after' },
  );
});

it('validates the replacement provider league before updating it', async () => {
  const service = new LeaguesService();
  const getLeague = vi.fn().mockResolvedValue({ leagueName: 'Provider league' });
  vi.spyOn(service, 'providerFor').mockResolvedValue({ getLeague } as never);
  update.mockResolvedValue({
    leagueId: '1',
    providerLeagueId: '123',
    leagueName: 'Local',
    leagueType: 0,
    seasonId: 2026,
  });
  const result = await service.updateProviderLeagueId('1', '000123', 'owner');
  expect(getLeague).toHaveBeenCalledWith(
    expect.objectContaining({ providerLeagueId: '123' }),
    2026,
  );
  expect(update).toHaveBeenCalledWith(
    { leagueId: '1', ownerSubject: 'owner' },
    { $set: { providerLeagueId: '123' } },
    { returnDocument: 'after', runValidators: true },
  );
  expect(result.providerLeagueId).toBe('123');
});

it('deletes only the owned workspace and its local records', async () => {
  const service = new LeaguesService();
  const rankingDeleteMany = vi.fn().mockResolvedValue({});
  const snapshotDeleteMany = vi.fn().mockResolvedValue({});
  service.weeklyRankings = {
    find: vi.fn(() => ({
      select: () => ({ lean: () => Promise.resolve([{ _id: 'ranking-1' }]) }),
    })),
    deleteMany: rankingDeleteMany,
  } as never;
  service.reportSnapshots = { deleteMany: snapshotDeleteMany } as never;
  service.leagues.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
  await service.deleteLeague('99', 'owner');
  expect(publicationDeleteMany).toHaveBeenCalledWith({ rankingId: { $in: ['ranking-1'] } });
  expect(rankingDeleteMany).toHaveBeenCalledWith({ leagueId: '1' });
  expect(snapshotDeleteMany).toHaveBeenCalledWith({ leagueId: '1', ownerSubject: 'owner' });
  expect(service.leagues.deleteOne).toHaveBeenCalledWith({ leagueId: '1', ownerSubject: 'owner' });
});
