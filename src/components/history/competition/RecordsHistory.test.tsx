import { fireEvent, render, screen, within } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { RecordsHistory } from './RecordsHistory';

it('uses actual playoff weeks for combined highs and series totals for matchup margins', () => {
  const record = season(2024, [
    [100, 90, 250, 220],
    [180, 80, 120, 60],
  ]);
  record.data.playoffGames = [
    {
      id: 'final',
      homeTeamId: 'a',
      awayTeamId: 'b',
      weeks: [1, 2],
      homePoints: 280,
      awayPoints: 170,
      elimination: true,
    },
  ];
  render(<RecordsHistory records={[record]} years={[2024]} leagueId="league" />);
  fireEvent.click(
    screen.getByText('All-time matchup and scoring records', { selector: 'summary' }),
  );
  const category = screen.getByLabelText('Record category');
  fireEvent.change(category, { target: { value: 'combined' } });
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  expect(rows).toHaveLength(4);
  expect(rows[0]).toHaveTextContent('c 250 vs d 220');
  expect(rows[1]).toHaveTextContent('2024 week 2 — a 180 vs b 80');
  expect(within(rows[1]).getAllByRole('cell')[2]).toHaveTextContent('260');
  expect(rows[2]).toHaveTextContent('2024 week 1 — a 100 vs b 90');
  expect(screen.queryByText(/playoff series weeks/)).not.toBeInTheDocument();

  fireEvent.change(category, { target: { value: 'individual' } });
  const individual = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  expect(individual).toHaveLength(8);
  expect(within(individual[0]).getAllByRole('cell')[1]).toHaveTextContent('250');

  fireEvent.change(category, { target: { value: 'blowouts' } });
  const blowouts = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  expect(blowouts).toHaveLength(3);
  expect(blowouts[0]).toHaveTextContent('playoff series weeks 1, 2');
  expect(blowouts[0]).toHaveTextContent('a 280 vs b 170');
});
