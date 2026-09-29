import {
  sleeperLineupSlots,
  espnLineupSlot,
  alignedPlayers,
  winProbability,
  type LivePlayer,
  type LiveMatchup,
} from './live-matchups';
const player = (id: string, position: string, starter = true): LivePlayer => ({
  id,
  name: id,
  position,
  points: 0,
  starter,
  projectedPoints: 20,
  remainingFraction: 1,
});
it('aligns each position independently, padding unequal groups and separating the bench', () => {
  const home = [
    player('WR', 'WR'),
    player('RB2', 'RB'),
    player('QB', 'QB'),
    player('RB1', 'RB'),
    player('bench', 'QB', false),
  ];
  const away = [player('opWR', 'WR'), player('opQB', 'QB'), player('opRB', 'RB')];
  const rows = alignedPlayers(home, away, true);
  expect(rows.map((row) => [row.home?.id, row.away?.id])).toEqual([
    ['QB', 'opQB'],
    ['RB1', 'opRB'],
    ['RB2', undefined],
    ['WR', 'opWR'],
  ]);
  expect(alignedPlayers(home, away, false)[0].home?.id).toBe('bench');
  expect(home[0].id).toBe('WR');
});
const matchup = (): LiveMatchup => ({
  id: '1',
  home: { teamId: '1', name: 'Home', score: 20, players: [player('h', 'QB')] },
  away: { teamId: '2', name: 'Away', score: 20, players: [player('a', 'QB')] },
});
it('computes complementary probabilities and responds to scores and remaining starters', () => {
  const match = matchup();
  expect(winProbability(match)).toBe(50);
  match.home.score = 40;
  expect(winProbability(match)).toBeGreaterThan(50);
  match.home.players[0].remainingFraction = 0;
  match.away!.players[0].remainingFraction = 0;
  expect(winProbability(match)).toBe(100);
  match.home.score = 20;
  expect(winProbability(match)).toBe(50);
});
it('does not invent odds when projections, game progress, scores or opponents are missing', () => {
  const match = matchup();
  match.home.players[0].projectedPoints = undefined;
  expect(winProbability(match)).toBeNull();
  match.home.players[0].remainingFraction = 0;
  expect(winProbability(match)).not.toBeNull();
  match.away = null;
  expect(winProbability(match)).toBeNull();
});

it('pairs FLEX and SUPER FLEX by assigned slot even when natural positions differ', () => {
  const h = [
    { ...player('homeFlex', 'WR'), lineupSlot: 'FLEX' },
    { ...player('homeSuper', 'QB'), lineupSlot: 'SUPER FLEX' },
    player('homeRB', 'RB'),
  ];
  const a = [
    { ...player('awayFlex', 'RB'), lineupSlot: 'FLEX' },
    { ...player('awaySuper', 'TE'), lineupSlot: 'SUPER FLEX' },
    player('awayRB', 'RB'),
  ];
  expect(
    alignedPlayers(h, a, true).map((row) => [row.position, row.home?.id, row.away?.id]),
  ).toEqual([
    ['SUPER FLEX', 'homeSuper', 'awaySuper'],
    ['RB', 'homeRB', 'awayRB'],
    ['FLEX', 'homeFlex', 'awayFlex'],
  ]);
  const bench = { ...player('benchWR', 'WR', false), lineupSlot: 'FLEX' };
  expect(alignedPlayers([bench], [], false)[0].position).toBe('WR');
});

it('preserves empty Sleeper slot indices and maps provider flex variants', () => {
  expect([
    ...sleeperLineupSlots(
      ['qb', '0', 'wr', 'flex', 'super'],
      ['QB', 'RB', 'WR', 'FLEX', 'SUPER_FLEX', 'BN', 'BN'],
    ),
  ]).toEqual([
    ['qb', 'QB'],
    ['wr', 'WR'],
    ['flex', 'FLEX'],
    ['super', 'SUPER FLEX'],
  ]);
  expect(espnLineupSlot(23)).toBe('FLEX');
  expect(espnLineupSlot(7)).toBe('SUPER FLEX');
  expect(espnLineupSlot(20)).toBeUndefined();
});
