import { buildWritingContext } from './writing-context';
import type { InsightsSource } from '../../insights';
const source: InsightsSource = {
  completedWeek: 3,
  teams: [{ teamId: '1', teamName: 'Team', managerName: 'Manager' }],
  scores: [1, 2, 3].map((week) => ({
    teamId: '1',
    week,
    actual: week === 3 ? 999 : 100,
    projected: null,
    starters: [{ playerId: 'a', points: 10 }],
    players: [
      { playerId: 'a', points: 10 },
      { playerId: 'b', points: 5 },
    ],
  })),
  moves: [],
  playerNames: {},
  playerPositions: { a: 'RB', b: 'RB' },
  notes: [],
  draftPickTrades: 0,
};
it('excludes future scores and uses only observed positional depth', () => {
  const context = buildWritingContext(source, '1', 2025, 2);
  expect(context.throughWeek).toBe(2);
  expect(context.facts.join(' ')).toContain('100.0 average points');
  expect(JSON.stringify(context)).not.toContain('999');
  expect(context.depth).toEqual(['W2 RB: 2 players with observed scores, 1 starters.']);
});
it('handles a new season without inventing results or depth', () => {
  const context = buildWritingContext({ ...source, completedWeek: 0 }, '1', 2026, 1);
  expect(context.facts).toEqual(['No completed scoring weeks are available yet.']);
  expect(context.depth).toEqual([]);
});
