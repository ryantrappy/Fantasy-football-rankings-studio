import {
  espnBestLineup,
  espnProjectionSnapshot,
  sleeperBestLineup,
  sleeperProjectionSnapshot,
  remainingProjectionWeeks,
  sleeperByeWeeks,
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
  expect(result.positionPoints).toEqual({ '1': { QB: 16, RB: 17 } });
  expect(result.coveredStarters).toBe(2);
  expect(result.totalStarters).toBe(4);
  expect(result.benchSelections).toBe(1);
});

it('reoptimizes overlapping slots each week and treats a known bye as zero, not missing data', () => {
  const roster = [{ teamId: '1', starters: ['rb', 'wr', 'flex', 'qb'], bench: ['replacement'] }];
  const positions = { rb: 'RB', wr: 'WR', flex: 'WR', qb: 'QB', replacement: 'RB' };
  const project = (week: number, byes: Record<string, number> = {}) =>
    sleeperProjectionSnapshot(
      week,
      ['1'],
      roster,
      Object.entries({ rb: 20, wr: 30, flex: 25, qb: 40, replacement: 10 }).map(
        ([player_id, p]) => ({ player_id, stats: { points: p } }),
      ),
      { points: 1 },
      ['RB', 'WR', 'FLEX', 'SUPER_FLEX'],
      positions,
      {},
      byes,
    );
  expect(project(4).teamPoints['1']).toBe(115);
  const bye = project(5, { rb: 5 });
  expect(bye.teamPoints['1']).toBe(105);
  expect(bye.positionPoints?.['1']).toEqual({ RB: 10, WR: 55, QB: 40 });
  expect(bye.lineups?.['1']).toContain('replacement');
  expect(bye.lineups?.['1']).not.toContain('rb');
  expect(new Set(bye.lineups?.['1']).size).toBe(4);
  expect(bye.byePlayers).toBe(1);
  const emptyByeSlot = sleeperProjectionSnapshot(
    5,
    ['1'],
    [{ teamId: '1', starters: ['rb'], bench: [] }],
    [],
    { points: 1 },
    ['RB'],
    positions,
    {},
    { rb: 5 },
  );
  expect(emptyByeSlot.teamPoints).toEqual({ '1': 0 });
  expect(emptyByeSlot.coveredStarters).toBe(1);
  expect(
    sleeperProjectionSnapshot(5, ['1'], roster, [], { points: 1 }, ['RB'], positions).teamPoints,
  ).toEqual({});
});

it('loads the season-specific playoff weeks and infers byes only from a full NFL schedule', () => {
  expect(
    remainingProjectionWeeks(
      {
        regularSeasonEnd: 14,
        playoffTeams: 4,
        rules: {
          provider: 'Sleeper',
          season: 2026,
          tiebreakers: ['points-for'],
          divisionByTeam: {},
          divisionWinnersFirst: false,
          reseed: true,
          roundWeeks: [[15], [16, 17]],
        },
      },
      13,
    ),
  ).toEqual([14, 15, 16, 17]);
  const games = Array.from({ length: 17 }, (_, w) =>
    Array.from({ length: 16 }, (_, i) => ({
      week: w + 1,
      home: String(i * 2),
      away: String(i * 2 + 1),
    })),
  ).flat();
  expect(sleeperByeWeeks(games, { a: '0', b: '1' })).toEqual({ a: 18, b: 18 });
  expect(sleeperByeWeeks(games.slice(0, 16), { a: '0' })).toEqual({});
});

it('uses only captured ESPN ownership, future-week stats and that week’s bye/recovery assumptions', () => {
  const injured = entry(2, 1, 2, 100);
  Object.assign(injured.playerPoolEntry.player, { injuryStatus: 'OUT', proTeamId: 7 });
  const bench = entry(20, 2, 2, 5);
  const ownership = [{ teamId: 1, rosterForCurrentScoringPeriod: { entries: [injured, bench] } }];
  expect(
    espnProjectionSnapshot(2026, 4, ['1'], ownership, { '2': 1 }, { ownership }).teamPoints['1'],
  ).toBe(5);
  const future = entry(20, 1, 2, 25);
  Object.assign(future.playerPoolEntry.player, { injuryStatus: 'OUT', proTeamId: 7 });
  future.playerPoolEntry.player.stats[0].scoringPeriodId = 5;
  const stranger = entry(2, 999, 2, 999);
  stranger.playerPoolEntry.player.stats[0].scoringPeriodId = 5;
  const sides = [{ teamId: 1, rosterForCurrentScoringPeriod: { entries: [future, stranger] } }];
  const result = espnProjectionSnapshot(
    2026,
    5,
    ['1'],
    sides,
    { '2': 1 },
    { ownership, useCurrentAvailability: false },
  );
  expect(result.teamPoints['1']).toBe(25);
  expect(result.lineups?.['1']).toEqual(['1']);
  expect(result.unavailablePlayers).toBe(0);
  expect(
    espnProjectionSnapshot(
      2026,
      5,
      ['1'],
      sides,
      { '2': 1 },
      {
        ownership,
        useCurrentAvailability: false,
        byeWeekByProTeam: { '7': 5 },
      },
    ).teamPoints['1'],
  ).toBe(0);
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
  expect(result.positionPoints?.['1']).toEqual({ QB: 20, RB: 10 });
  expect(result.totalStarters).toBe(2);
  expect(result.unavailablePlayers).toBe(1);
});

it('groups IDP and defense contributions without counting overlapping flex players twice', () => {
  const result = sleeperProjectionSnapshot(
    5,
    ['1'],
    [{ teamId: '1', starters: ['lb', 'def'], bench: ['dl', 'lb2'] }],
    Object.entries({ lb: 15, def: -2, dl: 20, lb2: 10 }).map(([player_id, points]) => ({
      player_id,
      stats: { points },
    })),
    { points: 1 },
    ['LB', 'IDP_FLEX', 'DEF'],
    { lb: 'LB', def: 'DST', dl: 'DL', lb2: 'LB' },
  );
  expect(result.teamPoints).toEqual({ '1': 33 });
  expect(result.positionPoints).toEqual({ '1': { LB: 15, DL: 20, DEF: -2 } });
  expect(new Set(result.lineups?.['1']).size).toBe(3);
});
