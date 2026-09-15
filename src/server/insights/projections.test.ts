import {
  espnBestLineup,
  espnProjectionSnapshot,
  sleeperBestLineup,
  sleeperProjectionSnapshot,
} from './projections';

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
const actualEntry = (slot: number, id: number, position: number, points: number) => ({
  ...entry(slot, id, position),
  playerPoolEntry: {
    player: {
      id,
      defaultPositionId: position,
      stats: [{ ...stat(points), statSourceId: 0 }],
    },
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

it('records historical best legal lineups and correct starts without guessing missing data', () => {
  expect(
    sleeperBestLineup(
      ['a', 'b'],
      [
        { playerId: 'a', points: 20 },
        { playerId: 'b', points: 5 },
        { playerId: 'c', points: 16 },
      ],
      ['QB', 'RB'],
      { a: 'QB', b: 'RB', c: 'RB' },
    ),
  ).toEqual({ points: 36, correctStarts: 1, slots: 2 });
  expect(
    sleeperBestLineup(['a'], [{ playerId: 'a', points: 20 }], ['QB', 'RB'], { a: 'QB' }),
  ).toBeUndefined();
});

it('uses historical ESPN player totals from bench players for the best lineup', () => {
  expect(
    espnBestLineup(2026, 4, [
      actualEntry(0, 1, 1, 20),
      actualEntry(2, 2, 2, 5),
      actualEntry(20, 3, 2, 15),
    ]),
  ).toEqual({ points: 35, correctStarts: 1, slots: 2 });
});

it('excludes confirmed absences without arbitrarily discounting questionable players', () => {
  const result = sleeperProjectionSnapshot(
    3,
    ['1'],
    [{ teamId: '1', starters: ['out'], bench: ['healthy', 'questionable'] }],
    [
      { player_id: 'out', stats: { rush_yd: 300 } },
      { player_id: 'healthy', stats: { rush_yd: 80 } },
      { player_id: 'questionable', stats: { rush_yd: 100 } },
    ],
    { rush_yd: 0.1 },
    ['RB'],
    { out: 'RB', healthy: 'RB', questionable: 'RB' },
    { out: 'Out', healthy: null, questionable: 'Questionable' },
  );
  expect(result.teamPoints['1']).toBe(10);
  expect(result.unavailablePlayers).toBe(1);
  expect(result.uncertainPlayers).toBe(1);
});

it('uses configured ESPN slots even if the current starting lineup is empty', () => {
  const injured = entry(20, 2, 2, 80);
  Object.assign(injured.playerPoolEntry.player, { injuryStatus: 'OUT' });
  const result = espnProjectionSnapshot(
    2026,
    4,
    ['1'],
    [
      {
        teamId: 1,
        rosterForCurrentScoringPeriod: {
          entries: [entry(20, 1, 1, 20), injured, entry(20, 3, 2, 10)],
        },
      },
    ],
    { '0': 1, '2': 1, '20': 5 },
  );
  expect(result.teamPoints['1']).toBe(30);
  expect(result.totalStarters).toBe(2);
  expect(result.unavailablePlayers).toBe(1);
});
