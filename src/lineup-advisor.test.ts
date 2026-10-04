import { adviseLineup } from './lineup-advisor';
import type { LivePlayer } from './live-matchups';
const player = (
  id: string,
  position: string,
  projectedPoints: number | undefined,
  starter = false,
  lineupSlot?: string,
): LivePlayer => ({
  id,
  name: id,
  position,
  projectedPoints,
  starter,
  lineupSlot,
  points: null,
  locked: false,
  availability: null,
  bye: false,
});
it('assigns overlapping FLEX and Superflex slots without duplicating players', () => {
  const players = [
    player('rb', 'RB', 10, true, 'RB'),
    player('flex', 'WR', 5, true, 'FLEX'),
    player('sf', 'TE', 4, true, 'SUPER FLEX'),
    player('qb', 'QB', 30),
    player('wr', 'WR', 20),
  ];
  const before = JSON.stringify(players);
  const advice = adviseLineup(players, ['RB', 'FLEX', 'SUPER FLEX']);
  expect(advice.proposed).toBe(60);
  expect(advice.submitted).toBe(19);
  expect(advice.difference).toBe(41);
  expect(advice.starts.map((entry) => entry.id)).toEqual(['qb', 'wr']);
  expect(new Set(advice.assignment.map((entry) => entry.player.id)).size).toBe(3);
  expect(JSON.stringify(players)).toBe(before);
});
it('keeps locked starters in their slots and never starts a locked bench player', () => {
  const players = [
    { ...player('locked', 'RB', 5, true, 'RB'), locked: true },
    player('flex', 'WR', 10, true, 'FLEX'),
    { ...player('bench', 'RB', 100), locked: true },
    player('open', 'RB', 20),
  ];
  const advice = adviseLineup(players, ['RB', 'FLEX']);
  expect(advice.proposed).toBe(25);
  expect(advice.assignment[0].player.id).toBe('locked');
  expect(advice.starts.map((entry) => entry.id)).toEqual(['open']);
});
it('excludes byes, confirmed unavailability and reserve players and permits alternative scenarios', () => {
  const players = [
    player('starter', 'RB', 10, true, 'RB'),
    { ...player('bye', 'RB', 90), bye: true },
    { ...player('out', 'RB', 80), availability: 'OUT' },
    { ...player('reserve', 'RB', 70), reserve: true },
    { ...player('uncertain', 'RB', 20), availability: 'QUESTIONABLE' },
  ];
  expect(adviseLineup(players, ['RB']).starts[0].id).toBe('uncertain');
  const scenario = adviseLineup(players, ['RB'], ['uncertain']);
  expect(scenario.proposed).toBe(10);
  expect(scenario.notices.join(' ')).toContain('Uncertain availability');
});
it('discloses unknown locks and suppresses point improvement claims with projection gaps', () => {
  const players = [
    player('starter', 'RB', 10, true, 'RB'),
    { ...player('unknown', 'RB', undefined), locked: undefined },
  ];
  const advice = adviseLineup(players, ['RB']);
  expect(advice.difference).toBeNull();
  expect(advice.notices.join(' ')).toMatch(/locks are unknown/);
  expect(advice.notices.join(' ')).toMatch(/Missing projections/);
  expect(adviseLineup(players, ['QB']).reason).toContain('complete legal');
});
it('respects provider multiple slot eligibility rather than default position alone', () => {
  const players = [
    { ...player('hybrid', 'QB', 20), eligibleSlots: ['TE'] },
    player('current', 'TE', 5, true, 'TE'),
  ];
  expect(adviseLineup(players, ['TE']).proposed).toBe(20);
  expect(adviseLineup(players, ['QB']).proposed).toBeNull();
});
