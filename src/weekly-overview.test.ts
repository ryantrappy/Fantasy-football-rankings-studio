import { loadWeeklyOverview, type OverviewApi } from './weekly-overview';
const league = (leagueId: string, leagueType: 0 | 1 = 0, seasonId = 2026) => ({
  leagueId,
  leagueName: `League ${leagueId}`,
  leagueType,
  seasonId,
});
function setup(): OverviewApi {
  return {
    listLeagues: vi.fn(async () => [league('1'), league('2', 1, 2025)]),
    getLiveMatchups: vi.fn(async () => [
      {
        leagueId: '1',
        leagueName: 'League 1',
        provider: 'Sleeper' as const,
        season: 2026,
        week: 5,
        matchups: [
          { id: 'm', home: { teamId: '10', name: 'Me', score: null, players: [] }, away: null },
        ],
      },
      {
        leagueId: '2',
        leagueName: 'League 2',
        provider: 'ESPN' as const,
        season: 2025,
        week: 17,
        matchups: [],
        error: 'offline',
      },
    ]),
    managedTeam: {
      get: vi.fn(async () => ({
        teamId: '10',
        teams: [{ teamId: '10', teamName: 'Me', managerName: 'Owner' }],
        needsReselection: false,
      })),
      set: vi.fn(),
    },
    getTeams: vi.fn(async () => [
      { teamId: '10', teamName: 'Me', managerName: 'Owner', wins: 3, loss: 1, ties: 0 },
    ]),
    getInsights: vi.fn(
      async () =>
        ({
          generatedAt: '2026-10-01T12:00:00Z',
          completedWeek: 4,
          partialFailures: [],
          teams: [],
        }) as never,
    ),
  };
}
it('preserves mixed provider calendars and seasons and isolates a failed league', async () => {
  const api = setup();
  const rows = await loadWeeklyOverview(api);
  expect(rows[0]).toMatchObject({
    week: 5,
    team: { wins: 3 },
    refreshedAt: '2026-10-01T12:00:00Z',
    playoff: null,
  });
  expect(rows[1]).toMatchObject({ week: null, playoff: null });
  expect(rows[1].notices).toContain('Current week and matchup unavailable.');
  expect(api.managedTeam.get).toHaveBeenCalledWith('2', 2025);
  expect(api.getTeams).toHaveBeenCalledTimes(1);
  expect(api.getInsights).toHaveBeenCalledWith('2', 2025);
});
it('uses only active account leagues, avoids analytics for unselected teams, and handles no leagues', async () => {
  const api = setup();
  vi.mocked(api.listLeagues).mockResolvedValue([league('20')]);
  vi.mocked(api.managedTeam.get).mockResolvedValue({
    teams: [],
    teamId: null,
    needsReselection: true,
  });
  const rows = await loadWeeklyOverview(api);
  expect(rows.map((row) => row.league.leagueId)).toEqual(['20']);
  expect(rows[0].notices).toContain('Choose your team again: its roster or manager changed.');
  expect(api.getInsights).not.toHaveBeenCalled();
  vi.mocked(api.listLeagues).mockResolvedValue([]);
  vi.mocked(api.getLiveMatchups).mockClear();
  expect(await loadWeeklyOverview(api)).toEqual([]);
  expect(api.getLiveMatchups).not.toHaveBeenCalled();
});
it('does not fabricate metrics when live and report requests fail', async () => {
  const api = setup();
  vi.mocked(api.getLiveMatchups).mockRejectedValue(new Error('offline'));
  vi.mocked(api.getInsights).mockRejectedValue(new Error('offline'));
  const rows = await loadWeeklyOverview(api);
  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row.week === null && row.playoff === null && !row.team)).toBe(true);
});
it('bounds managed league context reads to three concurrently', async () => {
  const api = setup();
  vi.mocked(api.listLeagues).mockResolvedValue(
    Array.from({ length: 8 }, (_, index) => league(String(index))),
  );
  let active = 0,
    maximum = 0;
  vi.mocked(api.managedTeam.get).mockImplementation(async () => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return { teams: [], teamId: null, needsReselection: false };
  });
  expect(await loadWeeklyOverview(api)).toHaveLength(8);
  expect(maximum).toBe(3);
});
