import { espnProjectionSnapshot, sleeperProjectionSnapshot } from './projections';

it('uses the best legal Sleeper lineup from starters and bench players', () => {
  const result = sleeperProjectionSnapshot(
    3,
    ['1', '2'],
    [
      { teamId: '1', starters: ['a', 'b'], bench: ['d'] },
      { teamId: '2', starters: ['c'], bench: [] },
    ],
    [
      { player_id: 'a', stats: { pass_yd: 250, pass_td: 2, pass_int: 1 } },
      { player_id: 'b', stats: { rush_yd: 60 } },
      { player_id: 'c', stats: { rush_yd: 80, rush_td: 1 } },
      { player_id: 'd', stats: { rush_yd: 110, rush_td: 1 } },
    ],
    { pass_yd: 0.04, pass_td: 4, pass_int: -2, rush_yd: 0.1, rush_td: 6 },
    ['QB', 'RB'],
    { a: 'QB', b: 'RB', c: 'RB', d: 'RB' },
  );
  expect(result.teamPoints).toEqual({ '1': 33 });
  expect(result.coveredStarters).toBe(2);
  expect(result.totalStarters).toBe(4);
  expect(result.benchSelections).toBe(1);
});

const stat = (appliedTotal: number) => ({
  scoringPeriodId: 4,
  seasonId: 2026,
  statSourceId: 1,
  statSplitTypeId: 1,
  appliedTotal,
});

const entry = (slot: number, id: number, position: number, points?: number) => ({
  lineupSlotId: slot,
  playerId: id,
  playerPoolEntry: {
    player: { id, defaultPositionId: position, stats: points === undefined ? [] : [stat(points)] },
  },
});

it('requires a full legal ESPN lineup before publishing a projection', () => {
  const result = espnProjectionSnapshot(
    2026,
    4,
    ['1', '2'],
    [
      {
        teamId: 1,
        rosterForCurrentScoringPeriod: { entries: [entry(0, 1, 1, 20), entry(20, 2, 2)] },
      },
      {
        teamId: 2,
        rosterForCurrentScoringPeriod: {
          entries: [entry(2, 3, 2, 10), entry(4, 4, 3)],
        },
      },
    ],
  );
  expect(result.teamPoints).toEqual({ '1': 20 });
  expect(result.coveredStarters).toBe(1);
  expect(result.totalStarters).toBe(3);
});

it('replaces a bye-week ESPN starter with an eligible projected bench player', () => {
  const result = espnProjectionSnapshot(
    2026,
    4,
    ['1'],
    [
      {
        teamId: 1,
        rosterForCurrentScoringPeriod: {
          entries: [entry(0, 1, 1, 20), entry(2, 2, 2), entry(20, 3, 2, 15)],
        },
      },
    ],
  );
  expect(result.teamPoints).toEqual({ '1': 35 });
  expect(result.benchSelections).toBe(1);
  expect(result.coveredStarters).toBe(result.totalStarters);
});
