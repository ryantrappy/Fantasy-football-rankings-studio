import { transactionActivity } from './activity';
import type { SeasonRecord } from '../../league-summary';
export const fixture = (extra: object = {}): SeasonRecord =>
  ({
    year: 2025,
    data: {
      completedWeek: 4,
      generatedAt: '',
      notes: [],
      teams: [
        { teamId: '1', managerKey: 'a', managerName: 'Alex', teamName: 'A' },
        { teamId: '2', managerKey: 'b', managerName: 'Blair', teamName: 'B' },
      ],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      ...extra,
    },
  }) as unknown as SeasonRecord;
it('deduplicates transaction IDs and counts covered zero distinctly from unsupported', () => {
  const move = { id: 'x', week: 1, type: 'trade', from: '1', to: '2', playerId: 'p', timestamp: 0 };
  const rows = transactionActivity([
    fixture({
      moves: [move, { ...move, playerId: 'q' }],
      moveCoverage: {
        weeks: [1, 2, 3, 4],
        types: ['trade', 'pickup'],
        complete: true,
        note: 'provider',
      },
    }),
  ]);
  expect(rows[0]).toMatchObject({ trades: 1, pickups: 0, drops: null, label: null });
  expect(transactionActivity([fixture()])[0].pickups).toBeNull();
});
it('counts only valid declared covered weeks and excludes outside-week moves', () => {
  const row = transactionActivity([
    fixture({
      moves: [
        { id: 'inside', type: 'pickup', week: 1, to: '1' },
        { id: 'outside', type: 'pickup', week: 2, to: '1' },
        { id: 'preseason', type: 'pickup', week: 0, to: '1' },
      ],
      moveCoverage: {
        weeks: [0, 1, 1, NaN, Infinity],
        types: ['pickup'],
        complete: false,
        note: 'one verified week',
      },
    }),
  ])[0];
  expect(row.pickups).toBe(1);
  expect(row.weeks).toBe(1);
});
