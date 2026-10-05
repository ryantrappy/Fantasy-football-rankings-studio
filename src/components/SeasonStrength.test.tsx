import { render, screen, fireEvent, within } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SeasonStrength } from './SeasonStrength';
import { strengthData } from '../../tests/ui/SeasonStrengthPreview';

vi.mock('@tanstack/charts/react', () => ({
  Chart: ({ ariaLabel }: { ariaLabel: string }) => <img alt={ariaLabel} />,
}));
const wrap = (data = strengthData) => (
  <ChakraProvider value={defaultSystem}>
    <SeasonStrength data={data} managedTeamId="1" />
  </ChakraProvider>
);

it('shows exact position values, highlights the managed team, sorts and explains schedule sources', () => {
  render(wrap());
  const ranks = screen.getByRole('table', { name: 'Position group rankings' });
  expect(within(ranks).getByText('The Underdogs with a very long team name')).toBeInTheDocument();
  expect(within(ranks).getByText('Your team')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Sort roster charts by'), { target: { value: 'WR' } });
  expect(
    within(screen.getByRole('table', { name: 'Position group rankings' })).getAllByRole('row')[1],
  ).toHaveTextContent('Fourth & Long');
  fireEvent.click(screen.getByText('Fourth & Long · Your team · week-by-week opponents'));
  const opponents = screen.getByRole('table', { name: 'Fourth & Long remaining opponents' });
  expect(within(opponents).getAllByText('Sleeper weekly lineup')).toHaveLength(6);
  expect(within(opponents).getAllByRole('row')).toHaveLength(7);
});

it('replaces projections with unavailable states for completed seasons and exposes fallback coverage', () => {
  const view = render(wrap());
  const old = structuredClone(strengthData);
  delete old.playoffProjection;
  view.rerender(wrap(old));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText(/Position projections are unavailable/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Fourth & Long · Your team · week-by-week opponents'));
  expect(
    within(screen.getByRole('table', { name: 'Fourth & Long remaining opponents' })).getAllByText(
      'Completed-score average',
    ),
  ).toHaveLength(6);
  old.completedWeek = 11;
  view.rerender(wrap({ ...old }));
  expect(screen.getByText(/The regular season is complete/)).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: 'Remaining schedule difficulty' }),
  ).not.toBeInTheDocument();
});
