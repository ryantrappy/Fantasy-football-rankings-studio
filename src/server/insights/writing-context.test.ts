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
  playerNames: { a: 'Current starter', b: 'Former player', c: 'Current bench' },
  playerPositions: { a: 'RB', b: 'RB', c: 'RB' },
  rosterSnapshot: {
    capturedAt: '2026-09-14T12:00:00.000Z',
    teams: [{ teamId: '1', starters: ['a'], bench: ['c'] }],
  },
  rosterSnapshotNote: 'Latest current-season roster ownership was retrieved.',
  notes: [],
  draftPickTrades: 0,
};
it('excludes future scores and uses only players in the latest roster snapshot', () => {
  const context = buildWritingContext(source, '1', 2025, 2);
  expect(context.throughWeek).toBe(2);
  expect(context.facts.join(' ')).toContain('100.0 average points');
  expect(JSON.stringify(context)).not.toContain('999');
  expect(context.depthSnapshotAt).toBe('2026-09-14T12:00:00.000Z');
  expect(context.depth).toEqual(['RB: starters — Current starter; bench — Current bench.']);
  expect(JSON.stringify(context.depth)).not.toContain('Former player');
});
it('does not substitute a current roster into unsupported historical selections', () => {
  const { rosterSnapshot: _currentRoster, ...historical } = source;
  const context = buildWritingContext(
    {
      ...historical,
      completedWeek: 0,
      rosterSnapshotNote:
        'Historical 2025 roster ownership snapshots are unavailable; current ownership was not substituted.',
    },
    '1',
    2025,
    1,
  );
  expect(context.facts).toEqual(['No completed scoring weeks are available yet.']);
  expect(context.depth).toEqual([]);
  expect(context.depthSnapshotAt).toBeUndefined();
  expect(context.depthNote).toMatch(/current ownership was not substituted/i);
});
