import { evaluateTrade, type TradeProposal } from './trade-analysis';
import type { LiveTeam } from './live-matchups';
const player = (id: string, projectedPoints: number | undefined, starter = false) => ({
  id,
  name: id,
  position: 'RB',
  projectedPoints,
  starter,
  lineupSlot: starter ? 'RB' : undefined,
  points: null,
  owned: true,
  locked: false,
  availability: null,
  bye: false,
});
const teams = (): [LiveTeam, LiveTeam] => [
  { teamId: '1', name: 'One', score: null, players: [player('a', 10, true), player('ab', 5)] },
  { teamId: '2', name: 'Two', score: null, players: [player('b', 20, true), player('bb', 4)] },
];
const proposal = (): TradeProposal => ({
  send: [['a'], ['b']],
  drops: [[], []],
  openSlots: [0, 0],
  acknowledgeImbalance: false,
});
it('compares both legal lineups and preserves source snapshots for a balanced exchange', () => {
  const source = teams(),
    before = JSON.stringify(source);
  const result = evaluateTrade(source, ['RB'], proposal());
  expect(result.error).toBeUndefined();
  expect(result.sides.map((side) => [side.before, side.after, side.difference])).toEqual([
    [10, 20, 10],
    [20, 10, -10],
  ]);
  expect(result.sides[0].coverage).toEqual([{ position: 'RB', count: 2 }]);
  expect(JSON.stringify(source)).toBe(before);
});
it('requires explicit open-slot or drop assumptions for a two-for-one exchange', () => {
  const data = proposal();
  data.send[0] = ['a', 'ab'];
  expect(evaluateTrade(teams(), ['RB'], data).error).toMatch(/Confirm explicit/);
  data.acknowledgeImbalance = true;
  expect(evaluateTrade(teams(), ['RB'], data).error).toMatch(/open roster slots/);
  data.openSlots[1] = 1;
  expect(evaluateTrade(teams(), ['RB'], data).sides[1].rosterSize).toBe(3);
  data.openSlots[1] = 0;
  data.drops[1] = ['bb'];
  expect(evaluateTrade(teams(), ['RB'], data).sides[1].rosterSize).toBe(2);
});
it('rejects duplicate, non-owned, reserve and locked assets', () => {
  const data = proposal();
  data.drops[0] = ['a'];
  expect(evaluateTrade(teams(), ['RB'], data).error).toMatch(/unique/);
  data.drops[0] = [];
  data.send[0] = ['draft-pick'];
  expect(evaluateTrade(teams(), ['RB'], data).error).toMatch(/draft picks/);
  for (const modification of [{ owned: false }, { reserve: true }, { locked: true }]) {
    const source = teams();
    Object.assign(source[0].players[0], modification);
    expect(evaluateTrade(source, ['RB'], proposal()).error).toBeDefined();
  }
});
it('reports projection gaps rather than inventing gains or fair value', () => {
  const source = teams();
  source[0].players[1].projectedPoints = undefined;
  const result = evaluateTrade(source, ['RB'], proposal());
  expect(result.sides[0].difference).toBeNull();
  expect(result.sides[0].notices.join(' ')).toContain('Missing projections');
});
