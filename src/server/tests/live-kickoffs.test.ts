// @vitest-environment node
const mocks = vi.hoisted(() => ({ schedule: vi.fn(), sleeper: vi.fn(), espn: vi.fn() }));
vi.mock('axios', () => ({
  default: { get: async () => ({ data: { season: '2026', leg: 6, season_type: 'regular' } }) },
}));
vi.mock('../live-projections.server', () => ({
  nflSchedule: mocks.schedule,
  nflRemaining: async () =>
    new Map<string, number>([
      ['BUF', 1],
      ['2', 1],
    ]),
  sleeperLiveProjections: async () => [],
}));
vi.mock('../insights/load.server', () => ({
  sleeperNames: async () => ({
    names: { p: 'Player', b: 'Bye player', u: 'Unknown team' },
    positions: {},
    availability: {},
    teams: { p: 'BUF', b: 'CIN', u: 'UNKNOWN' },
  }),
}));
vi.mock('../combined-projections.server', () => ({
  enrichLiveProjections: async (value: unknown) => value,
}));
vi.mock('../providers/sleeper.provider', () => ({
  default: class {
    resolveSeason = async () => ({ league_id: 'league', roster_positions: ['QB'] });
    getTeams = async () => [];
    get = mocks.sleeper;
  },
}));
vi.mock('../providers/espn.provider', () => ({
  default: class {
    get = mocks.espn;
  },
}));
import type { NflSchedule } from '../../live-matchups';
import { loadLiveLeague } from '../live-matchups.server';
const schedule: NflSchedule = {
  status: 'scheduled',
  kickoffAt: '2026-10-18T17:00:00.000Z',
  source: 'ESPN NFL scoreboard',
  capturedAt: '2026-10-15T20:00:00.000Z',
};
beforeEach(() => {
  mocks.schedule.mockReset().mockResolvedValue(
    new Map<string, NflSchedule>([
      ['BUF', schedule],
      ['2', schedule],
      ['CIN', { ...schedule, kickoffAt: undefined, status: 'bye' }],
      ['4', { ...schedule, kickoffAt: undefined, status: 'bye' }],
    ]),
  );
  mocks.sleeper.mockImplementation(async (path: string) =>
    path.endsWith('/rosters')
      ? [{ roster_id: 1, players: ['p', 'b', 'u'] }]
      : [{ matchup_id: 1, roster_id: 1, starters: ['p'], players: ['p', 'b', 'u'] }],
  );
  mocks.espn.mockResolvedValue({
    status: { latestScoringPeriod: 6 },
    schedule: [
      {
        id: 1,
        matchupPeriodId: 6,
        home: {
          teamId: 1,
          rosterForCurrentScoringPeriod: {
            entries: [2, 4, 99].map((proTeamId) => ({
              playerId: proTeamId,
              lineupSlotId: 0,
              playerPoolEntry: { player: { proTeamId } },
            })),
          },
        },
      },
    ],
  });
});
it.each([0, 1])(
  'enriches provider %i players using their own NFL team IDs and explicit byes',
  async (leagueType) => {
    const live = await loadLiveLeague({
      leagueId: 'league',
      leagueName: 'League',
      leagueType,
      seasonId: 2026,
    });
    const [player, bye, unknown] = live.matchups[0].home.players;
    expect(player.nflSchedule).toEqual(schedule);
    expect(player.bye).toBe(false);
    expect(bye.nflSchedule?.status).toBe('bye');
    expect(bye.bye).toBe(true);
    expect(unknown.nflSchedule?.status).toBe('unavailable');
    expect(unknown.bye).toBeUndefined();
    expect(mocks.schedule).toHaveBeenCalledWith(2026, 6);
  },
);
it.each([0, 1])(
  'keeps provider %i rosters usable during a schedule outage without inventing byes',
  async (leagueType) => {
    mocks.schedule.mockRejectedValue(new Error('Schedule unavailable'));
    const live = await loadLiveLeague({
      leagueId: 'league',
      leagueName: 'League',
      leagueType,
      seasonId: 2026,
    });
    expect(live.matchups[0].home.players).toHaveLength(3);
    expect(
      live.matchups[0].home.players.every(
        (player) => !player.bye && player.nflSchedule?.status === 'unavailable',
      ),
    ).toBe(true);
  },
);
