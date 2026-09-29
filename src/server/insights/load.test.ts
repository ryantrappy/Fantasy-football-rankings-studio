// @vitest-environment node
import axios from 'axios';
import { loadInsights, loadInsightsSource } from './load.server';
import EspnProvider from '../providers/espn.provider';
import SleeperProvider from '../providers/sleeper.provider';
import { forecastPlayoffs } from '../../playoff-forecast';
import { defaultSeason } from '../../util/rankings';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => vi.restoreAllMocks());
const teams = [{ teamId: '1', teamName: 'One', managerName: 'A', wins: 0, loss: 0, ties: 0 }];
it('loads historical ESPN playoff labels without requiring current managers', async () => {
  const historicalTeams = Array.from({ length: 8 }, (_, i) => ({
    ...teams[0],
    teamId: String(i + 1),
    managerName: i === 0 ? 'Former manager' : 'Historical manager',
  }));
  vi.spyOn(EspnProvider.prototype, 'getTeams').mockResolvedValue(historicalTeams);
  const read = vi
    .spyOn(EspnProvider.prototype, 'get')
    .mockImplementation(async (_id, _year, views): Promise<any> => {
      if (!views.includes('mSettings')) return { id: 1140768, schedule: [] };
      // ESPN mMatchup returns the participants but only mMatchupScore labels the bracket.
      return {
        id: 1140768,
        status: { latestScoringPeriod: 19, finalScoringPeriod: 17 },
        settings: {
          scheduleSettings: {
            matchupPeriodCount: 13,
            matchupPeriodLength: 1,
            playoffTeamCount: 4,
            playoffSeedingRule: 'H2H_RECORD',
            playoffReseed: false,
            matchupPeriods: { '14': [14, 15], '15': [16, 17] },
          },
        },
        schedule: [
          { home: { teamId: 5 }, away: { teamId: 8 } },
          { home: { teamId: 1 }, away: { teamId: 7 } },
        ].map((match) => ({
          ...match,
          matchupPeriodId: 14,
          ...(views.includes('mMatchupScore') ? { playoffTierType: 'WINNERS_BRACKET' } : {}),
        })),
      };
    });
  const result = await loadInsights(
    {
      leagueId: 'internal-id',
      providerLeagueId: '1140768',
      leagueName: 'League',
      leagueType: 1,
      seasonId: 2026,
    },
    2023,
  );
  expect(read.mock.calls[0]).toEqual([
    '1140768',
    2023,
    expect.arrayContaining(['mSettings', 'mTeam', 'mMatchupScore']),
  ]);
  expect(result.teams).toHaveLength(8);
  expect(result.teams[0].managerName).toBe('Former manager');
  expect(result.results?.map(({ teamId, playoff }) => ({ teamId, playoff }))).toEqual(
    historicalTeams.map(({ teamId }) => ({
      teamId,
      playoff: ['1', '5', '7', '8'].includes(teamId),
    })),
  );
});
it('uses ESPN weekly scores and starter projections, excluding bench, wrong season and pending moves', async () => {
  vi.spyOn(EspnProvider.prototype, 'getTeams').mockResolvedValue(teams);
  const entry = (id: number, slot: number, points: number) => ({
    playerId: id,
    lineupSlotId: slot,
    playerPoolEntry: {
      player: {
        id,
        fullName: `Player ${id}`,
        stats: [
          {
            scoringPeriodId: 2,
            seasonId: 2024,
            statSourceId: 1,
            statSplitTypeId: 1,
            appliedTotal: 999,
          },
          {
            scoringPeriodId: 2,
            seasonId: 2025,
            statSourceId: 0,
            statSplitTypeId: 1,
            appliedTotal: points,
          },
          {
            scoringPeriodId: 2,
            seasonId: 2025,
            statSourceId: 1,
            statSplitTypeId: 1,
            appliedTotal: points + 5,
          },
        ],
      },
    },
  });
  vi.spyOn(EspnProvider.prototype, 'get').mockImplementation(
    async (_id, _year, views, week): Promise<any> => {
      if (views.includes('mSettings'))
        return {
          id: 123,
          status: { latestScoringPeriod: 3, finalScoringPeriod: 2 },
          schedule: [
            {
              matchupPeriodId: 3,
              playoffTierType: 'NONE',
              home: { teamId: 1 },
              away: { teamId: 2 },
            },
          ],
          settings: {
            scheduleSettings: {
              matchupPeriodCount: 10,
              matchupPeriodLength: 1,
              playoffTeamCount: 4,
              playoffSeedingRule: 'TOTAL_POINTS_SCORED',
              playoffReseed: false,
              playoffMatchupPeriodLength: 1,
            },
          },
        };
      if (views.includes('mTransactions2'))
        return {
          id: 123,
          transactions:
            week === 1
              ? [
                  {
                    id: 'ok',
                    status: 'EXECUTED',
                    type: 'FREEAGENT',
                    scoringPeriodId: 1,
                    proposedDate: 1,
                    items: [{ type: 'ADD', playerId: 7, toTeamId: 1, fromTeamId: 0 }],
                  },
                  {
                    id: 'pending',
                    status: 'PENDING',
                    scoringPeriodId: 1,
                    items: [{ type: 'ADD', playerId: 8, toTeamId: 1, fromTeamId: 0 }],
                  },
                ]
              : [],
        };
      return {
        id: 123,
        schedule: [
          {
            home: {
              teamId: 1,
              totalPoints: 999,
              pointsByScoringPeriod: { [week!]: 10 },
              rosterForCurrentScoringPeriod: { entries: [entry(7, 2, 10), entry(8, 20, 100)] },
            },
          },
        ],
      };
    },
  );
  const result = await loadInsights(
    { leagueId: '123', leagueName: 'League', leagueType: 1, seasonId: 2025 },
    2025,
  );
  expect(result.completedWeek).toBe(2);
  expect(result.forecastSchedule).toEqual([{ week: 3, homeTeamId: '1', awayTeamId: '2' }]);
  expect(result.scores[1]).toMatchObject({
    actual: 10,
    projected: 15,
    starters: [{ playerId: '7', points: 10 }],
  });
  expect(result.scores[0].projected).toBeNull();
  expect(result.pickups).toHaveLength(1);
  expect(result.pickups[0]).toMatchObject({ points: 10, starts: 1 });
  expect(result.playoffSettings).toMatchObject({ regularSeasonEnd: 10, playoffTeams: 4 });
  expect(forecastPlayoffs(result, result.playoffSettings!, result.completedWeek).rounds).toEqual([
    'Reach final',
    'Win title',
  ]);
});
it('caps Sleeper at the league last-scored week even when the NFL played more weeks', async () => {
  vi.mocked(axios.get).mockResolvedValue({
    data: { season: '2026', leg: 1, season_type: 'regular' },
  });
  vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    name: 'League',
    season: '2025',
    total_rosters: 1,
    settings: { last_scored_leg: 2, start_week: 1 },
  });
  vi.spyOn(SleeperProvider.prototype, 'getTeams').mockResolvedValue(teams);
  const read = vi
    .spyOn(SleeperProvider.prototype, 'get')
    .mockImplementation(async (path): Promise<any> =>
      path.includes('/transactions/')
        ? []
        : [{ roster_id: 1, points: 0, custom_points: -2, starters: [], players_points: {} }],
    );
  const result = await loadInsights(
    { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2025 },
    2025,
  );
  expect(result.scores).toHaveLength(2);
  expect(result.completedWeek).toBe(2);
  expect(result.scores[0]).toMatchObject({ actual: -2, projected: null });
  expect(read.mock.calls.map(([path]) => path)).not.toContain('123/matchups/3');
});
it('keeps insights available when current Sleeper projections fail', async () => {
  const year = defaultSeason();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.mocked(axios.get).mockImplementation(async (url): Promise<any> => {
    if (String(url).includes('/state/nfl'))
      return { data: { season: String(year), leg: 4, season_type: 'regular' } };
    throw new Error('projection endpoint unavailable');
  });
  vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    name: 'League',
    season: String(year),
    total_rosters: 2,
    settings: { last_scored_leg: 3, start_week: 1, playoff_week_start: 10, playoff_teams: 2 },
    scoring_settings: { rec: 1 },
  });
  vi.spyOn(SleeperProvider.prototype, 'getTeams').mockResolvedValue([
    ...teams,
    { teamId: '2', teamName: 'Two', managerName: 'B', wins: 0, loss: 0, ties: 0 },
  ]);
  vi.spyOn(SleeperProvider.prototype, 'get').mockImplementation(async (path): Promise<any> => {
    if (path.includes('/transactions/')) return [];
    if (path.endsWith('/matchups/4'))
      return [
        { roster_id: 1, starters: ['a'] },
        { roster_id: 2, starters: ['b'] },
      ];
    return [
      { roster_id: 1, matchup_id: 1, points: 100, starters: [], players_points: {} },
      { roster_id: 2, matchup_id: 1, points: 90, starters: [], players_points: {} },
    ];
  });
  const result = await loadInsights(
    { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: year },
    year,
  );
  expect(result.scores).toHaveLength(6);
  expect(result.playoffProjection).toMatchObject({
    provider: 'Sleeper',
    week: 4,
    teamPoints: {},
  });
  expect(result.playoffProjection?.note).toMatch(/historical scoring only/);
  expect(result.partialFailures).toContainEqual({
    section: 'Playoff simulation',
    message: 'Current-week Sleeper projections are unavailable; historical scoring is used.',
  });
});
it('loads current Sleeper ownership as a dated starter and bench snapshot', async () => {
  const year = defaultSeason();
  vi.mocked(axios.get).mockImplementation(async (url): Promise<any> =>
    String(url).includes('/state/nfl')
      ? { data: { season: String(year), leg: 1, season_type: 'pre' } }
      : {
          data: {
            a: { full_name: 'Starter', position: 'RB' },
            b: { full_name: 'Bench', position: 'RB' },
          },
        },
  );
  vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    name: 'League',
    season: String(year),
    total_rosters: 1,
  });
  vi.spyOn(SleeperProvider.prototype, 'getTeams').mockResolvedValue(teams);
  vi.spyOn(SleeperProvider.prototype, 'get').mockImplementation(async (path): Promise<any> =>
    path.endsWith('/rosters')
      ? [{ roster_id: 1, players: ['a', 'b'], starters: ['a', 'no-longer-owned'] }]
      : [],
  );
  const source = await loadInsightsSource(
    { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: year },
    year,
  );
  expect(source.rosterSnapshot?.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(source.rosterSnapshot?.teams).toEqual([{ teamId: '1', starters: ['a'], bench: ['b'] }]);
  expect(source.playerNames).toMatchObject({ a: 'Starter', b: 'Bench' });
});
it('loads current ESPN ownership without using it for historical seasons', async () => {
  const year = defaultSeason();
  vi.spyOn(EspnProvider.prototype, 'getTeams').mockResolvedValue(teams);
  const read = vi
    .spyOn(EspnProvider.prototype, 'get')
    .mockImplementation(async (_id, _year, views): Promise<any> => {
      if (views.includes('mSettings'))
        return {
          id: 123,
          status: { latestScoringPeriod: 1, finalScoringPeriod: 18 },
        };
      if (views.includes('mRoster'))
        return {
          id: 123,
          teams: [
            {
              id: 1,
              roster: {
                entries: [
                  {
                    playerId: 7,
                    lineupSlotId: 2,
                    playerPoolEntry: {
                      player: { id: 7, fullName: 'Starter', defaultPositionId: 2 },
                    },
                  },
                  {
                    playerId: 8,
                    lineupSlotId: 20,
                    playerPoolEntry: {
                      player: { id: 8, fullName: 'Bench', defaultPositionId: 2 },
                    },
                  },
                ],
              },
            },
          ],
        };
      return { id: 123, transactions: [] };
    });
  const current = await loadInsightsSource(
    { leagueId: '123', leagueName: 'League', leagueType: 1, seasonId: year },
    year,
  );
  expect(current.rosterSnapshot?.teams[0]).toEqual({
    teamId: '1',
    starters: ['7'],
    bench: ['8'],
  });
  expect(current.playerNames).toMatchObject({ '7': 'Starter', '8': 'Bench' });
  const historical = await loadInsightsSource(
    { leagueId: '123', leagueName: 'League', leagueType: 1, seasonId: year - 1 },
    year - 1,
  );
  expect(historical.rosterSnapshot).toBeUndefined();
  expect(historical.rosterSnapshotNote).toMatch(/current ownership was not substituted/i);
  expect(read.mock.calls.filter(([, , views]) => views.includes('mRoster'))).toHaveLength(1);
});

it.each([
  { completed: 14, historical: false, expected: true },
  { completed: 15, historical: false, expected: false },
  { completed: 14, historical: true, expected: false },
])(
  'limits Sleeper playoff projections to the current first round: %j',
  async ({ completed, historical, expected }) => {
    const currentYear = defaultSeason();
    const year = currentYear - Number(historical);
    vi.mocked(axios.get).mockImplementation(async (url): Promise<any> => {
      if (String(url).includes('/state/nfl'))
        return {
          data: { season: String(currentYear), leg: completed + 1, season_type: 'regular' },
        };
      if (String(url).includes('/projections/')) return { data: [] };
      return { data: {} };
    });
    vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
      league_id: '123',
      name: 'League',
      season: String(year),
      total_rosters: 1,
      settings: {
        last_scored_leg: completed,
        start_week: 1,
        playoff_week_start: 15,
        playoff_teams: 2,
      },
    });
    vi.spyOn(SleeperProvider.prototype, 'getTeams').mockResolvedValue(teams);
    vi.spyOn(SleeperProvider.prototype, 'get').mockResolvedValue([]);
    const result = await loadInsightsSource(
      { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: year },
      year,
    );
    expect(!!result.playoffProjection).toBe(expected);
    if (expected) expect(result.playoffProjection?.week).toBe(15);
  },
);

it('loads Sleeper weekly means through a two-week final using fixed ownership, byes and week-specific availability', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 600001); // Expire the player catalog populated by earlier fixtures.
  const year = defaultSeason();
  const games = Array.from({ length: 18 }, (_, w) =>
    Array.from({ length: 16 }, (_, i) => ({
      week: w + 1,
      home: String(i * 2),
      away: String(i * 2 + 1),
    })),
  )
    .flat()
    .filter(
      (game) => !(game.week === 5 && game.home === '0') && !(game.week === 18 && game.home !== '0'),
    );
  const read = vi.mocked(axios.get).mockImplementation(async (url): Promise<any> => {
    if (String(url).includes('/state/nfl'))
      return { data: { season: String(year), leg: 4, season_type: 'regular' } };
    if (String(url).includes('/players/nfl'))
      return {
        data: {
          a: { position: 'RB', team: '0', injury_status: 'Out' },
          b: { position: 'RB', team: '2' },
          c: { position: 'RB', team: '4' },
        },
      };
    if (String(url).includes('/schedule/')) return { data: games };
    return {
      data: [
        { player_id: 'a', stats: { rush_yd: 200 } },
        { player_id: 'b', stats: { rush_yd: 100 } },
        { player_id: 'c', stats: { rush_yd: 150 } },
      ],
    };
  });
  read.mockClear();
  vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    name: 'League',
    season: String(year),
    total_rosters: 2,
    settings: {
      last_scored_leg: 3,
      start_week: 1,
      playoff_week_start: 6,
      playoff_teams: 2,
      playoff_round_type: 1,
      playoff_seed_type: 1,
    },
    scoring_settings: { rush_yd: 0.1 },
    roster_positions: ['RB', 'BN'],
  });
  vi.spyOn(SleeperProvider.prototype, 'getTeams').mockResolvedValue([
    ...teams,
    { ...teams[0], teamId: '2' },
  ]);
  vi.spyOn(SleeperProvider.prototype, 'get').mockImplementation(async (path): Promise<any> => {
    if (path.endsWith('/rosters'))
      return [
        { roster_id: 1, players: ['a', 'b'], starters: ['a'] },
        { roster_id: 2, players: ['c'], starters: ['c'] },
      ];
    if (path.includes('/transactions/')) return [];
    return [
      { roster_id: 1, matchup_id: 1, points: 100, starters: [] },
      { roster_id: 2, matchup_id: 1, points: 90, starters: [] },
    ];
  });
  try {
    const result = await loadInsightsSource(
      { leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: year },
      year,
    );
    expect(
      read.mock.calls
        .filter(([url]) => String(url).includes('/projections/'))
        .map(([url]) => Number(String(url).split('/').at(-1))),
    ).toEqual([4, 5, 6, 7]);
    expect(result.playoffProjection?.weekly?.map((row) => row.week)).toEqual([4, 5, 6, 7]);
    expect(result.playoffProjection?.weekly?.map((row) => row.teamPoints['1'])).toEqual([
      10, 10, 20, 20,
    ]);
    expect(result.playoffProjection?.weekly?.[1].lineups?.['1']).toEqual(['b']);
    expect(result.playoffProjection?.weekly?.[2].lineups?.['1']).toEqual(['a']);
  } finally {
    vi.useRealTimers();
  }
});

it('loads ESPN projections for later rounds and isolates a failed future week', async () => {
  const year = defaultSeason();
  const owned = (id: number, slot: number) => ({
    lineupSlotId: slot,
    playerId: id,
    playerPoolEntry: {
      player: { id, defaultPositionId: 1, proTeamId: id, injuryStatus: 'ACTIVE', stats: [] },
    },
  });
  vi.mocked(axios.get).mockResolvedValue({
    data: { settings: { proTeams: [{ id: 1, byeWeek: 7 }] } },
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(EspnProvider.prototype, 'getTeams').mockResolvedValue([
    ...teams,
    { ...teams[0], teamId: '2' },
  ]);
  const read = vi
    .spyOn(EspnProvider.prototype, 'get')
    .mockImplementation(async (_id, _year, views, week): Promise<any> => {
      if (views.includes('mSettings'))
        return {
          id: 123,
          status: { latestScoringPeriod: 4, finalScoringPeriod: 7 },
          settings: {
            rosterSettings: { lineupSlotCounts: { '0': 1, '20': 1 } },
            scheduleSettings: {
              matchupPeriodCount: 5,
              matchupPeriodLength: 1,
              playoffTeamCount: 2,
              playoffSeedingRule: 'TOTAL_POINTS_SCORED',
              playoffReseed: false,
              matchupPeriods: { '6': [6, 7] },
            },
          },
        };
      if (views.includes('mRoster'))
        return {
          id: 123,
          teams: [
            { id: 1, roster: { entries: [owned(1, 0), owned(2, 20)] } },
            { id: 2, roster: { entries: [owned(3, 0)] } },
          ],
        };
      if (views.includes('mTransactions2')) return { id: 123, transactions: [] };
      if (week === 5) throw new Error('week five unavailable');
      const projected = (id: number) => ({
        ...owned(id, id === 2 ? 20 : 0),
        playerPoolEntry: {
          player: {
            ...owned(id, 0).playerPoolEntry.player,
            stats: [
              {
                scoringPeriodId: week,
                seasonId: year,
                statSourceId: 1,
                statSplitTypeId: 1,
                appliedTotal: id === 1 ? 20 : id === 2 ? 10 : 15,
              },
            ],
          },
        },
      });
      return {
        id: 123,
        schedule: [
          {
            home: {
              teamId: 1,
              pointsByScoringPeriod: { [week!]: 100 },
              rosterForCurrentScoringPeriod: {
                entries: [projected(1), projected(2), projected(999)],
              },
            },
            away: {
              teamId: 2,
              pointsByScoringPeriod: { [week!]: 90 },
              rosterForCurrentScoringPeriod: { entries: [projected(3)] },
            },
          },
        ],
      };
    });
  const result = await loadInsightsSource(
    { leagueId: '123', leagueName: 'League', leagueType: 1, seasonId: year },
    year,
  );
  expect(
    read.mock.calls
      .filter(([, , views, week]) => views.includes('mBoxscore') && week! >= 4)
      .map(([, , , week]) => week),
  ).toEqual([4, 5, 6, 7]);
  expect(result.playoffProjection?.weekly?.map((row) => row.teamPoints['1'])).toEqual([
    20,
    undefined,
    20,
    10,
  ]);
  expect(result.playoffProjection?.weekly?.[3].lineups?.['1']).toEqual(['2']);
  expect(result.partialFailures?.some((failure) => /weeks 5/.test(failure.message))).toBe(true);
});

it.each([
  { completed: 14, historical: false, expected: true },
  { completed: 15, historical: false, expected: false },
  { completed: 14, historical: true, expected: false },
])(
  'limits ESPN playoff projections to the current first round: %j',
  async ({ completed, historical, expected }) => {
    const year = defaultSeason() - Number(historical);
    vi.spyOn(EspnProvider.prototype, 'getTeams').mockResolvedValue(teams);
    vi.spyOn(EspnProvider.prototype, 'get').mockImplementation(
      async (_id, _year, views): Promise<any> => {
        if (views.includes('mSettings'))
          return {
            id: 123,
            status: { latestScoringPeriod: completed + 1, finalScoringPeriod: 18 },
            settings: {
              scheduleSettings: {
                matchupPeriodCount: 14,
                matchupPeriodLength: 1,
                playoffTeamCount: 2,
              },
            },
          };
        return { id: 123, teams: [], schedule: [], transactions: [] };
      },
    );
    const result = await loadInsightsSource(
      { leagueId: '123', leagueName: 'League', leagueType: 1, seasonId: year },
      year,
    );
    expect(!!result.playoffProjection).toBe(expected);
    if (expected) expect(result.playoffProjection?.week).toBe(15);
  },
);
