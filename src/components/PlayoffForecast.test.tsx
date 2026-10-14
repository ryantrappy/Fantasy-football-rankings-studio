import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

it('shows cutoff-controlled probabilities and the scenario limitations', async () => {
  const data = forecastData();
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Calculating playoff forecast');
  expect(await screen.findByRole('table', { name: 'Playoff probabilities' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Projected record' })).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Playoff probabilities' })).toHaveTextContent(
    /\d+\.\d-\d+\.\d/,
  );
  expect(screen.getByText(/random remaining opponents/)).toBeInTheDocument();
  expect(screen.getByText(/Projection mode:.*historical scoring only/)).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: 'Historical forecast reliability' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(
    screen.getByRole('table', { name: 'Historical forecast reliability' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/2 held-out games/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Forecast table' }));
  expect(screen.getByText(/±0.69 percentage points/)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '2' } });
  await screen.findByRole('table', { name: 'Playoff probabilities' });
  expect(screen.getByRole('note')).toHaveTextContent(/only 2 completed scoring weeks/);
  expect(screen.getByRole('note')).toHaveTextContent(/especially uncertain/);
  expect(screen.getByRole('note')).toBeVisible();
  expect(screen.getByRole('table', { name: 'Playoff probabilities' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByText(/No eligible held-out games yet/)).toBeVisible();
});
it('shows cached week-by-week playoff and title chances with exact values', async () => {
  render(
    <Provider>
      <PlayoffForecast data={forecastData()} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Week-by-week chart' }));
  await screen.findByRole('img', { name: /Make playoffs probability by completed week/ });
  expect(screen.queryByRole('table', { name: 'Playoff probabilities' })).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: /Make playoffs probability by completed week/ }),
  ).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
    timeout: 5000,
  });
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
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
    timeout: 5000,
  });
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
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
    timeout: 5000,
  });
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

it('discloses weekly coverage and removes current lineup assumptions at an older cutoff', async () => {
  const data = forecastData();
  const next = { week: 5, teamPoints: { '1': 110, '2': 95 }, coveredStarters: 2, totalStarters: 2 };
  data.playoffProjection = {
    provider: 'Sleeper',
    ...next,
    availabilityChecked: true,
    weekly: [next, { ...next, week: 6, teamPoints: { '1': 105 }, coveredStarters: 1 }],
  };
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  expect(await screen.findByText(/best legal weekly lineups/)).toHaveTextContent(
    '3 of 14 team-weeks',
  );
  expect(screen.getByText(/later weeks use their own provider estimates/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Weekly lineup projection coverage'));
  const table = screen.getByRole('table', { name: 'Weekly lineup projection coverage' });
  expect(table.querySelectorAll('tbody tr')).toHaveLength(7);
  expect(table.querySelectorAll('tbody tr')[1]).toHaveTextContent('1 of 2');
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '3' } });
  await screen.findByRole('table', { name: 'Playoff probabilities' });
  expect(
    screen.queryByRole('table', { name: 'Weekly lineup projection coverage' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/excluded from this retrospective cutoff/)).toBeInTheDocument();
});

it('opens Advanced on demand and preserves its state while deactivating background evaluation', async () => {
  const advanced = vi.fn((active: boolean) => (
    <div>
      <output>{active ? 'Evaluation active' : 'Evaluation inactive'}</output>
      <input aria-label="Retained advanced setting" defaultValue="one" />
    </div>
  ));
  render(
    <Provider>
      <PlayoffForecast data={forecastData()} advanced={advanced} />
    </Provider>,
  );
  await screen.findByRole('table', { name: 'Playoff probabilities' });
  expect(advanced).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByText('Evaluation active')).toBeVisible();
  fireEvent.change(screen.getByLabelText('Retained advanced setting'), {
    target: { value: 'two' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Forecast table' }));
  expect(advanced).toHaveBeenLastCalledWith(false);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByLabelText('Retained advanced setting')).toHaveValue('two');
});

it('exposes seeded first-round bye odds alongside all configured rounds and title odds', async () => {
  const data = forecastData();
  data.teams = Array.from({ length: 8 }, (_, index) => ({
    ...data.teams[0],
    teamId: String(index),
    teamName: `Team ${index}`,
  }));
  data.scores = [1, 2, 3, 4].flatMap((week) =>
    data.teams.map((team, index) => ({
      teamId: team.teamId,
      opponentTeamId: String(index ^ 1),
      week,
      actual: 90 + index * 3,
      projected: null,
      starters: [],
    })),
  );
  data.playoffSettings = { regularSeasonEnd: 10, playoffTeams: 6 };
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  const table = await screen.findByRole('table', { name: 'Playoff probabilities' });
  for (const name of [
    'Projected record',
    'Make playoffs',
    'Earn bye',
    'Reach semifinal',
    'Reach final',
    'Win title',
  ])
    expect(within(table).getByRole('columnheader', { name })).toBeInTheDocument();
  expect(table.querySelectorAll('tbody tr')).toHaveLength(8);
});
