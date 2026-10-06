// @vitest-environment node
const mocks = vi.hoisted(() => ({
  season: vi.fn(),
  teams: vi.fn(),
  read: vi.fn(),
  projections: vi.fn(),
  catalog: vi.fn(),
  espn: vi.fn(),
}));
vi.mock('axios', () => ({
  default: {
    get: (url: string) =>
      url.includes('/state/nfl')
        ? Promise.resolve({ data: { season: '2026', leg: 5, season_type: 'regular' } })
        : mocks.espn(url),
  },
}));
vi.mock('../providers/sleeper.provider', () => ({
  default: class {
    resolveSeason = mocks.season;
    getTeams = mocks.teams;
    get = mocks.read;
  },
}));
vi.mock('../insights/load.server', () => ({ sleeperNames: mocks.catalog }));
vi.mock('../live-projections.server', () => ({
  sleeperLiveProjections: mocks.projections,
  nflRemaining: async () => new Map([['BUF', 1]]),
}));
import { adviseLineup } from '../../lineup-advisor';
import { playerProfiles } from '../../player-profiles';
import { evaluateTrade } from '../../trade-analysis';
import { winProbability } from '../../live-matchups';
let load: (typeof import('../live-matchups.server'))['loadLiveLeague'];
const league = { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2026 };
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  load = (await import('../live-matchups.server')).loadLiveLeague;
  mocks.season.mockResolvedValue({
    league_id: '123',
    season: '2026',
    roster_positions: ['RB'],
    scoring_settings: { rush_yd: 0.1 },
  });
  mocks.teams.mockResolvedValue([
    { teamId: '1', teamName: 'One' },
    { teamId: '2', teamName: 'Two' },
  ]);
  mocks.read.mockImplementation(async (path: string) =>
    path.endsWith('/rosters')
      ? [
          { roster_id: 1, players: ['s1'] },
          { roster_id: 2, players: ['s2'] },
        ]
      : [
          { matchup_id: 1, roster_id: 1, starters: ['s1'], players: ['s1'], points: 0 },
          { matchup_id: 1, roster_id: 2, starters: ['s2'], players: ['s2'], points: 0 },
        ],
  );
  mocks.catalog.mockResolvedValue({
    names: { s1: 'One RB', s2: 'Two RB' },
    positions: { s1: 'RB', s2: 'RB' },
    availability: { s1: null, s2: null },
    teams: { s1: 'BUF', s2: 'BUF' },
    espnIds: {},
  });
  mocks.espn.mockRejectedValue(new Error('Optional source unavailable'));
});

it.each([
  [{ unrelated_stat: 1 }, undefined],
  [{ rush_yd: 0 }, 0],
  [{ rush_yd: -20 }, -2],
  [{ rush_yd: 100 }, 10],
  [{ rush_yd: NaN }, undefined],
  [{ rush_yd: Infinity }, undefined],
  [{}, undefined],
  [undefined, undefined],
])('normalizes native stat coverage without manufacturing zero (%j)', async (stats, expected) => {
  mocks.projections.mockResolvedValue([
    { player_id: 's1', stats },
    { player_id: 's2', stats: { rush_yd: 80 } },
  ]);
  const live = await load(league);
  const player = live.matchups[0].home.players[0];
  expect(player.projectedPoints).toBe(expected);
  if (expected === undefined) {
    expect(
      adviseLineup(live.matchups[0].home.players, live.lineupSlots).notices.join(' '),
    ).toContain('Missing projections');
    expect(winProbability(live.matchups[0])).toBeNull();
    expect(
      playerProfiles('Sleeper', 2026, undefined, live).find((profile) => profile.id === 's1')
        ?.projection,
    ).toBeUndefined();
    const result = evaluateTrade(
      [live.matchups[0].home, live.matchups[0].away!],
      live.lineupSlots,
      { send: [['s1'], ['s2']], drops: [[], []], openSlots: [0, 0], acknowledgeImbalance: false },
    );
    expect(result.error).toBeUndefined();
    expect(result.sides).toHaveLength(2);
    expect(result.sides.map((side) => side.difference)).toEqual([null, null]);
  }
});

it.each([{}, { rush_yd: NaN }, { rush_yd: Infinity }])(
  'leaves missing or nonfinite league scoring unavailable (%j)',
  async (scoring) => {
    mocks.season.mockResolvedValue({
      league_id: '123',
      roster_positions: ['RB'],
      scoring_settings: scoring,
    });
    mocks.projections.mockResolvedValue([{ player_id: 's1', stats: { rush_yd: 50 } }]);
    expect((await load(league)).matchups[0].home.players[0].projectedPoints).toBeUndefined();
  },
);

it('uses a valid optional source with its actual provenance when the native dictionary is unusable', async () => {
  mocks.catalog.mockResolvedValue({
    names: { s1: 'One RB' },
    positions: { s1: 'RB' },
    availability: { s1: null },
    teams: { s1: 'BUF' },
    espnIds: { s1: '901' },
  });
  mocks.projections.mockResolvedValue([{ player_id: 's1', stats: { unrelated_stat: 1 } }]);
  mocks.espn.mockResolvedValue({
    data: {
      id: 901,
      defaultPositionId: 2,
      stats: [
        {
          seasonId: 2026,
          scoringPeriodId: 5,
          statSourceId: 1,
          statSplitTypeId: 1,
          stats: { '24': 70 },
        },
      ],
    },
  });
  const player = (await load(league)).matchups[0].home.players[0];
  expect(player.projectedPoints).toBe(7);
  expect(player.projectionMethod).toBe('single-source');
  expect(player.projectionSources).toEqual([
    { provider: 'ESPN', playerId: '901', points: 7, capturedAt: expect.any(String) },
  ]);
});
