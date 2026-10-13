import { render, screen } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { tradeNetwork, tradeTrees } from './trades';
import { TradeNetwork } from '../../components/history/moments/TradeNetwork';
const data = calculateInsights({
  completedWeek: 6,
  teams: [
    { teamId: 'a', teamName: 'A', managerName: 'Alice', managerKey: 'stable-a' },
    { teamId: 'b', teamName: 'B', managerName: 'Bob', managerKey: 'stable-b' },
  ],
  scores: [],
  moves: [
    { id: 'one', week: 2, timestamp: 1000, type: 'trade', playerId: 'p', from: 'a', to: 'b' },
    { id: 'one', week: 2, timestamp: 1000, type: 'trade', playerId: 'q', from: 'b', to: 'a' },
    { id: 'two', week: 5, timestamp: 2000, type: 'trade', playerId: 'p', from: 'b', to: 'a' },
  ],
  draftPickTradeIds: ['one'],
  playerNames: {},
  notes: [],
  draftPickTrades: 1,
  moveCoverage: {
    weeks: [1, 2, 3, 4, 5, 6],
    types: ['trade', 'drop', 'pickup'],
    complete: true,
    note: 'Fixture complete history',
  },
});
it('counts transactions not individual asset moves and joins only stable manager identities', () => {
  expect(
    tradeNetwork([
      { year: 2024, data },
      { year: 2025, data },
    ])[0].transactions,
  ).toHaveLength(4);
  const without = { ...data, teams: data.teams.map((t) => ({ ...t, managerKey: undefined })) };
  expect(
    tradeNetwork([
      { year: 2024, data: without },
      { year: 2025, data: without },
    ]),
  ).toHaveLength(2);
});
it('follows verified next ownership and breaks continuity at intervening drop or missing coverage', () => {
  expect(tradeTrees({ year: 2025, data })[0]).toMatchObject({
    continuous: true,
    next: { id: 'two' },
  });
  expect(tradeTrees({ year: 2025, data: { ...data, moveCoverage: undefined } })[0].continuous).toBe(
    false,
  );
  const dropped = {
    ...data,
    moves: [
      ...data.moves!,
      {
        id: 'drop',
        week: 3,
        timestamp: 1500,
        type: 'drop' as const,
        playerId: 'p',
        from: 'b',
        to: null,
      },
    ],
  };
  expect(tradeTrees({ year: 2025, data: dropped })[0].next?.type).toBe('drop');
});
it('links network counts to underlying transactions and explicitly labels pick lineage', () => {
  render(
    <TradeNetwork record={{ year: 2025, data }} records={[{ year: 2025, data }]} manager="a" />,
  );
  expect(screen.getByText('Alice ↔ Bob')).toBeInTheDocument();
  expect(screen.getByText('2025: one')).toHaveAttribute('href', '#trade-2025-one');
  expect(document.getElementById('trade-2025-one')).toHaveTextContent(
    'unresolved value and pick lineage',
  );
  expect(screen.getByText(/Cross-season asset continuity/)).toBeInTheDocument();
});
