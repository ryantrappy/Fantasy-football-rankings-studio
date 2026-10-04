// @vitest-environment node
import LeaguesService from '../services/leagues.service';
const rows = [
  {
    leagueId: '10',
    providerLeagueId: '99',
    leagueName: 'Sleeper',
    leagueType: 0,
    seasonId: 2026,
    ownerSubject: 'owner',
  },
  {
    leagueId: '20',
    providerLeagueId: '99',
    leagueName: 'ESPN',
    leagueType: 1,
    seasonId: 2026,
    ownerSubject: 'owner',
  },
];
function setup() {
  const service = new LeaguesService();
  const update = vi.fn(async (filter, mutation) => ({
    ...rows.find((row) => row.leagueId === filter.leagueId),
    ...mutation.$set,
  }));
  service.leagues = {
    findOne: vi.fn((filter) => ({
      lean: async () =>
        rows.find(
          (row) => row.leagueId === filter.leagueId && row.ownerSubject === filter.ownerSubject,
        ) ?? null,
    })),
    find: vi.fn((filter) => ({
      limit: () => ({
        lean: async () =>
          rows.filter(
            (row) =>
              row.ownerSubject === filter.ownerSubject &&
              row.providerLeagueId === filter.providerLeagueId,
          ),
      }),
    })),
    findOneAndUpdate: update,
  } as never;
  vi.spyOn(service, 'providerFor').mockResolvedValue({
    getLeague: vi.fn(async () => ({})),
  } as never);
  return { service, update };
}
it('rejects ambiguous aliases for rename, archive, provider update and deletion without writes', async () => {
  const { service, update } = setup();
  for (const action of [
    () => service.rename('99', 'New', 'owner'),
    () => service.setArchived('99', true, 'owner'),
    () => service.updateProviderLeagueId('99', '100', 'owner'),
    () => service.deleteLeague('99', 'owner'),
  ])
    await expect(action()).rejects.toMatchObject({ status: 409 });
  expect(update).not.toHaveBeenCalled();
  expect(service.providerFor).not.toHaveBeenCalled();
});
it('resolves exact workspaces independently and retains ownership checks', async () => {
  const { service, update } = setup();
  await service.rename('20', 'ESPN renamed', 'owner');
  await service.setArchived('10', true, 'owner');
  await service.updateProviderLeagueId('20', '100', 'owner');
  expect(update.mock.calls.map(([filter]) => filter.leagueId)).toEqual(['20', '10', '20']);
  await expect(service.rename('20', 'Other', 'other')).rejects.toMatchObject({ status: 404 });
  await expect(service.deleteLeague('99', 'other')).rejects.toMatchObject({ status: 404 });
});
it('prefers exact workspace identity even when another workspace has that external ID', async () => {
  const { service, update } = setup();
  const alias = vi.mocked(service.leagues.find);
  await service.rename('10', 'Exact', 'owner');
  expect(alias).not.toHaveBeenCalled();
  expect(update.mock.calls[0][0].leagueId).toBe('10');
});
it('continues accepting an unambiguous legacy external ID', async () => {
  const { service, update } = setup();
  vi.mocked(service.leagues.find).mockReturnValue({
    limit: () => ({ lean: async () => [rows[0]] }),
  } as never);
  await service.rename('99', 'Legacy alias', 'owner');
  expect(update.mock.calls[0][0].leagueId).toBe('10');
});
