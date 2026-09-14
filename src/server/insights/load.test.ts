// @vitest-environment node
import axios from 'axios';
import { loadInsights, loadInsightsSource } from './load.server';
import EspnProvider from '../providers/espn.provider';
import SleeperProvider from '../providers/sleeper.provider';
import { defaultSeason } from '../../util/rankings';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
afterEach(() => vi.restoreAllMocks());
const teams = [{ teamId: '1', teamName: 'One', managerName: 'A', wins: 0, loss: 0, ties: 0 }];
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
        return { id: 123, status: { latestScoringPeriod: 3, finalScoringPeriod: 2 } };
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
  expect(result.scores[1]).toMatchObject({
    actual: 10,
    projected: 15,
    starters: [{ playerId: '7', points: 10 }],
  });
  expect(result.scores[0].projected).toBeNull();
  expect(result.pickups).toHaveLength(1);
  expect(result.pickups[0]).toMatchObject({ points: 10, starts: 1 });
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
