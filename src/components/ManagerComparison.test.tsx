import { fireEvent, render, screen, within } from '@testing-library/react';
import type { SeasonInsights } from '../insights';
import { Provider } from './ui/provider';
import { ManagerComparison } from './ManagerComparison';

const data = {
  completedWeek: 1,
  teams: [
    { teamId: '1', managerKey: 'a', managerName: 'Alex', teamName: 'Alpha' },
    { teamId: '2', managerKey: 'b', managerName: 'Blair', teamName: 'Beta' },
  ],
  scores: [
    { teamId: '1', week: 1, actual: 110, projected: null, starters: [] },
    { teamId: '2', week: 1, actual: 90, projected: null, starters: [] },
  ],
  results: [
    { teamId: '1', playoff: true, champion: true, lastPlace: false, finish: 1 },
    { teamId: '2', playoff: false, champion: false, lastPlace: true, finish: 2 },
  ],
} as unknown as SeasonInsights;

it('requires distinct managers and exposes paired metrics and selected-season gaps', () => {
  render(
    <Provider>
      <ManagerComparison records={[{ year: 2025, data }]} years={[2025, 2024]} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText('First manager'), { target: { value: 'a' } });
  expect(screen.getByLabelText('Second manager')).toHaveValue('');
  expect(
    within(screen.getByLabelText('Second manager')).getByRole('option', {
      name: /Alex · Alpha/,
    }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Second manager'), { target: { value: 'b' } });

  const alex = screen.getByRole('heading', { name: 'Alex' }).closest('article');
  expect(alex).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Blair' })).toBeInTheDocument();
  expect(alex).toHaveTextContent('110 average points');
  expect(alex).toHaveTextContent('10% average vs. league median');
  expect(screen.getByText('2025:').closest('li')).toHaveTextContent('1 shared completed week');
  expect(screen.getByText('2024:').closest('li')).toHaveTextContent(
    'Season data is unavailable and is excluded',
  );
  fireEvent.change(screen.getByLabelText('From season'), { target: { value: '2025' } });
  expect(screen.queryByText('2024:')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Through season')).toHaveValue('2025');
});
