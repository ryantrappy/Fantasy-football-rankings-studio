import { espnProjectionSnapshot, sleeperProjectionSnapshot } from './projections';

it('scores Sleeper player stats with the league scoring settings', () => {
  const result = sleeperProjectionSnapshot(
    3,
    ['1', '2'],
    [
      { roster_id: 1, starters: ['a', 'b', '0'] },
      { roster_id: 2, starters: ['c'] },
    ],
    [
      { player_id: 'a', stats: { pass_yd: 250, pass_td: 2, pass_int: 1 } },
      { player_id: 'b', stats: { rec: 5, rec_yd: 60 } },
      { player_id: 'c', stats: { rush_yd: 80, rush_td: 1 } },
    ],
    { pass_yd: 0.04, pass_td: 4, pass_int: -2, rec: 1, rec_yd: 0.1, rush_yd: 0.1, rush_td: 6 },
  );
  expect(result.teamPoints).toEqual({ '1': 27, '2': 14 });
  expect(result.coveredStarters).toBe(3);
  expect(result.totalStarters).toBe(3);
});

it('requires every starter before publishing an ESPN team projection', () => {
  const stat = (appliedTotal: number) => ({
    scoringPeriodId: 4,
    seasonId: 2026,
    statSourceId: 1,
    statSplitTypeId: 1,
    appliedTotal,
  });
  const result = espnProjectionSnapshot(
    2026,
    4,
    ['1', '2'],
    [
      {
        teamId: 1,
        rosterForCurrentScoringPeriod: {
          entries: [
            { lineupSlotId: 0, playerPoolEntry: { player: { stats: [stat(20)] } } },
            { lineupSlotId: 20, playerPoolEntry: { player: { stats: [] } } },
          ],
        },
      },
      {
        teamId: 2,
        rosterForCurrentScoringPeriod: {
          entries: [
            { lineupSlotId: 2, playerPoolEntry: { player: { stats: [stat(10)] } } },
            { lineupSlotId: 4, playerPoolEntry: { player: { stats: [] } } },
          ],
        },
      },
    ],
  );
  expect(result.teamPoints).toEqual({ '1': 20 });
  expect(result.coveredStarters).toBe(2);
  expect(result.totalStarters).toBe(3);
});
