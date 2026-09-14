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
    { leagueId: '1', ownerSubject: 'owner' },
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
