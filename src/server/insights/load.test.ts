// @vitest-environment node
import axios from 'axios';
import { loadInsights } from './load.server';
import EspnProvider from '../providers/espn.provider';
import SleeperProvider from '../providers/sleeper.provider';
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
