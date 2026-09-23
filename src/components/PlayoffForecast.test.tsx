import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayoffForecast } from './PlayoffForecast';
import { Provider } from './ui/provider';
import type { SeasonInsights } from '../insights';
function forecastData() {
  return {
    completedWeek: 4,
    playoffSettings: { regularSeasonEnd: 10, playoffTeams: 2 },
    teams: [
      { teamId: '1', teamName: 'Alpha' },
      { teamId: '2', teamName: 'Beta' },
    ],
    scores: [1, 2, 3, 4].flatMap((week) => [
      { teamId: '1', opponentTeamId: '2', week, actual: 100 },
      { teamId: '2', opponentTeamId: '1', week, actual: 90 },
    ]),
  } as SeasonInsights;
}

it('shows cutoff-controlled probabilities and the scenario limitations', () => {
  const data = forecastData();
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  expect(screen.getByRole('table', { name: 'Playoff probabilities' })).toBeInTheDocument();
  expect(screen.getByText(/random remaining opponents/)).toBeInTheDocument();
  expect(screen.getByText(/Projection mode:.*historical scoring only/)).toBeInTheDocument();
  expect(
    screen.getByRole('table', { name: 'Historical forecast reliability' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/2 held-out games/)).toBeInTheDocument();
  expect(screen.getByText(/±0.69 percentage points/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '2' } });
  expect(screen.getByRole('note')).toHaveTextContent(/only 2 completed scoring weeks/);
  expect(screen.getByRole('note')).toHaveTextContent(/especially uncertain/);
  expect(screen.getByRole('table', { name: 'Playoff probabilities' })).toBeInTheDocument();
  expect(screen.getByText(/No eligible held-out games yet/)).toBeInTheDocument();
});
it('shows cached week-by-week playoff and title chances with exact values', async () => {
  render(
    <Provider>
      <PlayoffForecast data={forecastData()} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Week-by-week chart' }));
  expect(screen.queryByRole('table', { name: 'Playoff probabilities' })).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: /Make playoffs probability by completed week/ }),
  ).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.click(screen.getByText('Exact weekly percentages'));
  const table = screen.getByRole('table', { name: 'Weekly make playoffs probabilities' });
  expect(table.querySelectorAll('tbody tr')).toHaveLength(4);
  expect(table).toHaveTextContent('100.0%');
  const firstPoint = document.querySelector('.playoff-timeline-chart circle');
  expect(firstPoint).toHaveStyle({ animationDelay: '0ms' });
  expect(firstPoint?.getAttribute('style')).toContain('--point-rise:');

  fireEvent.click(screen.getByRole('button', { name: 'Win championship' }));
  expect(
    screen.getByRole('img', { name: /Win championship probability by completed week/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('table', { name: 'Weekly win championship probabilities' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Forecast table' }));
  expect(screen.getByLabelText('Forecast through week')).toHaveValue('2');
  fireEvent.click(screen.getByRole('button', { name: 'Week-by-week chart' }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Win championship' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
it('keeps earlier trend points visible when the latest week is incomplete', async () => {
  const data = forecastData();
  data.scores = data.scores.filter((score) => !(score.teamId === '2' && score.week === 4));
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Week-by-week chart' }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(
    screen.getByRole('img', { name: /Make playoffs probability by completed week/ }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Weeks with incomplete results are omitted/)).toBeInTheDocument();
  expect(document.querySelectorAll('.playoff-timeline-chart circle').length).toBeGreaterThan(0);
});
it('explains missing provider settings', () => {
  render(
    <Provider>
      <PlayoffForecast data={{ completedWeek: 0 } as SeasonInsights} />
    </Provider>,
  );
  expect(screen.getByText(/settings are unavailable/)).toBeInTheDocument();
});
