import { render, screen, fireEvent, within } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { droppedBreakouts } from './drops';
import { DroppedBreakouts } from '../../components/history/moments/DroppedBreakouts';
const data = calculateInsights({
  completedWeek: 7,
  teams: [{ teamId: 'a', teamName: 'A', managerName: 'Alice' }],
  scores: [1, 2, 3, 4, 5, 6, 7].map((week) => ({
    teamId: 'a',
    week,
    actual: 0,
    projected: null,
    starters: [],
    players: [{ playerId: 'p', points: week < 4 ? 5 : week < 7 ? 20 : 999 }],
  })),
  moves: [
    { id: 'drop', playerId: 'p', from: 'a', to: null, week: 3, timestamp: 1000, type: 'drop' },
    { id: 'add', playerId: 'p', from: null, to: 'b', week: 4, timestamp: 2000, type: 'pickup' },
  ],
  playerNames: { p: 'Player' },
  notes: [],
  draftPickTrades: 0,
});
it('bounds scoring to next three weeks and compares prior baseline; unavailable weeks never zero', () => {
  const row = droppedBreakouts(data)[0];
  expect(row).toMatchObject({ total: 60, baseline: 5, lift: 45, complete: true });
  expect(row.output.map((p) => p.week)).toEqual([4, 5, 6]);
  expect(row.availability).toContain('Observed pickup by b');
  expect(
    droppedBreakouts({ ...data, scores: data.scores.filter((s) => s.week !== 5) })[0],
  ).toMatchObject({ total: null, lift: null, complete: false });
  expect(droppedBreakouts({ ...data, completedWeek: 4 })[0].lift).toBeNull();
});
it('browses manager evidence and configurable window', () => {
  render(<DroppedBreakouts data={data} manager="a" />);
  expect(screen.getByText('60.0 / 45.0 — breakout')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Post-drop window'), { target: { value: '1' } });
  expect(screen.getByText('20.0 / 15.0 — breakout')).toBeInTheDocument();
  const table = within(screen.getByRole('table', { name: 'Waiver graveyard — observed drops' }));
  expect(table.getByText(/Observed pickup by b/)).toHaveTextContent(
    'availability between recorded events is unknown',
  );
  const inspector = screen.getByRole('complementary', { name: 'Record evidence' });
  expect(inspector).toHaveTextContent('total 20.0; lift 15.0');
  expect(inspector).toHaveTextContent('availability between recorded events is unknown');
});
