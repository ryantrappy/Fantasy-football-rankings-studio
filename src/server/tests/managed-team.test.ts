// @vitest-environment node
const rows = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const update = vi.hoisted(() => vi.fn());
vi.mock('../models/league.model', () => ({
  default: {
    findOne: ({ leagueId, ownerSubject }: { leagueId: string; ownerSubject: string }) => ({
      lean: async () => rows.get(`${ownerSubject}:${leagueId}`) ?? null,
    }),
    findOneAndUpdate: update,
  },
}));
import LeaguesService from '../services/leagues.service';

beforeEach(() => {
  rows.clear();
  update.mockReset();
});
function setup() {
  const service = new LeaguesService();
  const getTeams = vi.fn(async (_league, year: number) => [
    {
      teamId: year === 2026 ? '1' : '9',
      teamName: 'My team',
      managerName: 'Manager',
      managerKey: 'sleeper:owner',
    },
  ]);
  vi.spyOn(service, 'providerFor').mockResolvedValue({ getTeams } as never);
  for (const owner of ['alice', 'bob'])
    for (const leagueId of ['10', '20'])
      rows.set(`${owner}:${leagueId}`, {
        leagueId,
        ownerSubject: owner,
        providerLeagueId: '100',
        leagueType: 0,
        seasonId: 2026,
        managedTeams: {},
      });
  update.mockImplementation(async (filter, mutation) => {
    const row = rows.get(`${filter.ownerSubject}:${filter.leagueId}`);
    if (!row || row.providerLeagueId !== filter.providerLeagueId) return null;
    const selections = row.managedTeams as Record<string, unknown>;
    for (const [path, value] of Object.entries(mutation.$set ?? {}))
      selections[path.split('.')[1]] = value;
    for (const path of Object.keys(mutation.$unset ?? {})) delete selections[path.split('.')[1]];
    return row;
  });
  return { service, getTeams };
}
it('persists, changes, and clears choices separately for owners, leagues, and seasons', async () => {
  const { service } = setup();
  await service.setManagedTeam('10', 2026, '1', 'alice');
  await service.setManagedTeam('10', 2025, '9', 'alice');
  expect(
    (await new LeaguesService().getLeagueById('10', 'alice')).managedTeams?.['2026'].teamId,
  ).toBe('1');
  expect((await service.managedTeamSelection('10', 2025, 'alice')).teamId).toBe('9');
  expect((await service.managedTeamSelection('10', 2026, 'bob')).teamId).toBeNull();
  expect((await service.managedTeamSelection('20', 2026, 'alice')).teamId).toBeNull();
  expect((await service.managedTeamSelection('10', 2027, 'alice')).teamId).toBeNull();
  await service.setManagedTeam('10', 2026, null, 'alice');
  expect((await service.managedTeamSelection('10', 2026, 'alice')).teamId).toBeNull();
});
it('rejects another account and teams from a different season', async () => {
  const { service, getTeams } = setup();
  await expect(service.managedTeamSelection('10', 2026, 'outsider')).rejects.toMatchObject({
    status: 404,
  });
  await expect(service.setManagedTeam('10', 2026, '1', 'outsider')).rejects.toMatchObject({
    status: 404,
  });
  expect(getTeams).not.toHaveBeenCalled();
  await expect(service.setManagedTeam('10', 2025, '1', 'alice')).rejects.toMatchObject({
    status: 400,
  });
  expect(update).not.toHaveBeenCalled();
});
it('confirms the persisted save without a second provider request and supports offline clearing', async () => {
  const { service, getTeams } = setup();
  getTeams.mockRejectedValueOnce(new Error('Offline'));
  await expect(service.setManagedTeam('10', 2026, '1', 'alice')).rejects.toThrow('Offline');
  expect(update).not.toHaveBeenCalled();
  const result = await service.setManagedTeam('10', 2026, '1', 'alice');
  expect(result.teamId).toBe('1');
  expect(getTeams).toHaveBeenCalledTimes(2);
  expect((await service.managedTeamSelection('10', 2026, 'alice')).teamId).toBe('1');
  getTeams.mockRejectedValueOnce(new Error('Offline'));
  expect((await service.setManagedTeam('10', 2026, null, 'alice')).teamId).toBeNull();
});
it('requires reselection for missing teams or changed managers', async () => {
  const { service, getTeams } = setup();
  await service.setManagedTeam('10', 2026, '1', 'alice');
  getTeams.mockResolvedValueOnce([
    { teamId: '1', teamName: 'New name', managerName: 'Other', managerKey: 'sleeper:other' },
  ]);
  expect(await service.managedTeamSelection('10', 2026, 'alice')).toMatchObject({
    teamId: null,
    needsReselection: true,
  });
  getTeams.mockResolvedValueOnce([]);
  expect(await service.managedTeamSelection('10', 2026, 'alice')).toMatchObject({
    teamId: null,
    needsReselection: true,
  });
});
it('does not report a successful save when the database update was ignored', async () => {
  const { service } = setup();
  update.mockResolvedValueOnce({ ...rows.get('alice:10'), managedTeams: {} });
  await expect(service.setManagedTeam('10', 2026, '1', 'alice')).rejects.toMatchObject({
    status: 503,
  });
});
it('rejects a provider change while a team selection is being validated', async () => {
  const { service, getTeams } = setup();
  getTeams.mockImplementationOnce(async () => {
    rows.get('alice:10')!.providerLeagueId = '200';
    return [{ teamId: '1', teamName: 'Team', managerName: 'Owner', managerKey: 'sleeper:owner' }];
  });
  // Read operations return snapshots just as MongoDB lean() does.
  vi.spyOn(service, 'getLeagueById').mockResolvedValueOnce({ ...rows.get('alice:10')! } as never);
  await expect(service.setManagedTeam('10', 2026, '1', 'alice')).rejects.toMatchObject({
    status: 409,
  });
});
