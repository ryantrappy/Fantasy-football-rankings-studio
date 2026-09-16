// @vitest-environment node
const update = vi.hoisted(() => vi.fn());
vi.mock('../models/league.model', () => ({
  default: { findOneAndUpdate: update },
}));
import LeaguesService from '../services/leagues.service';

beforeEach(() => update.mockReset());

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
