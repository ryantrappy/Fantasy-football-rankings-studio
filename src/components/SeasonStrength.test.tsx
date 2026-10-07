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

it('switches rankings and bars to actual completed-week starter points and back', () => {
  render(wrap());
  const completed = screen.getByRole('button', { name: 'Completed weeks only' });
  expect(completed).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(completed);
  expect(completed).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: 'Completed-week scoring' })).toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAccessibleName(/Completed-week actual starter points/);
  expect(screen.getByText(/completed weeks 1, 2, 3, 4/)).toBeInTheDocument();
  const ranks = screen.getByRole('table', { name: 'Position group rankings' });
  expect(
    within(ranks).getByRole('columnheader', { name: /Total actual points/ }),
  ).toBeInTheDocument();
  expect(within(ranks).getByText('344')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Remaining schedule difficulty' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  expect(screen.getByRole('img')).toHaveAccessibleName(/Roster projections by position/);
  expect(screen.getByRole('heading', { name: 'Roster projections' })).toBeInTheDocument();
});

it.each(['Sleeper', 'ESPN'] as const)(
  'shows saved %s next-week rankings when later projection weeks are empty',
  (provider) => {
    const data = structuredClone(strengthData);
    data.playoffProjection!.provider = provider;
    data.playoffProjection!.weekly!.slice(1).forEach((week) => {
      week.teamPoints = {};
      week.positionPoints = {};
    });
    render(wrap(data));
    expect(screen.getByRole('img')).toHaveAccessibleName(/Roster projections by position/);
    expect(screen.getByRole('table', { name: 'Position group rankings' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Totals do not cover the full remaining season',
    );
    expect(
      screen.queryByText(/Position projections are unavailable for this report/),
    ).not.toBeInTheDocument();
  },
);

it('offers completed mode without forecasts and explains missing positions or no completed weeks', () => {
  const data = structuredClone(strengthData);
  delete data.playoffProjection;
  const view = render(wrap(data));
  fireEvent.click(screen.getByRole('button', { name: 'Completed weeks only' }));
  expect(screen.getByRole('img')).toHaveAccessibleName(/Completed-week actual starter points/);
  data.scores.forEach((score) => score.starters.forEach((player) => delete player.position));
  view.rerender(wrap({ ...data }));
  expect(screen.getByText(/Completed-week position data is unavailable/)).toBeInTheDocument();
  data.completedWeek = 0;
  view.rerender(wrap({ ...data }));
  expect(screen.getByText(/No completed weeks yet/)).toBeInTheDocument();
});

it('counts a missing opening week even when every team is missing it', () => {
  const data = structuredClone(strengthData);
  data.scores = data.scores.filter((score) => score.week !== 1);
  render(wrap(data));
  fireEvent.click(screen.getByRole('button', { name: 'Completed weeks only' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  const coverage = screen.getByRole('table', { name: 'Completed-week position coverage' });
  expect(within(coverage).getAllByText('3 / 4')).toHaveLength(data.teams.length);
});

it('explains unknown legacy horizons and keeps completed rankings unavailable', () => {
  const data = structuredClone(strengthData);
  delete data.reportingStartWeek;
  render(wrap(data));
  fireEvent.click(screen.getByRole('button', { name: 'Completed weeks only' }));
  expect(screen.getByRole('status')).toHaveTextContent('configured season start is unavailable');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
