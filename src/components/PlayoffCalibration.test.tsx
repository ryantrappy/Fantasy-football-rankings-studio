import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayoffCalibration } from './PlayoffCalibration';
import { Provider } from './ui/provider';
import type { SeasonInsights } from '../insights';

const fixture = () =>
  ({
    completedWeek: 3,
    playoffSettings: { regularSeasonEnd: 3, playoffTeams: 2 },
    teams: ['0', '1', '2', '3'].map((teamId) => ({ teamId, teamName: teamId })),
    scores: [1, 2, 3].flatMap((week) =>
      [0, 1, 2, 3].map((i) => ({
        teamId: String(i),
        opponentTeamId: String(i ^ 1),
        week,
        actual: 120 - i * 10,
      })),
    ),
    results: [0, 1, 2, 3].map((i) => ({ teamId: String(i), playoff: i % 2 === 0 })),
  }) as SeasonInsights;
function api() {
  return {
    getLeagueSeasons: vi.fn().mockResolvedValue({ years: [2026, 2025, 2024], activeSeason: 2026 }),
    getInsights: vi.fn().mockImplementation(async (_id: string, year: number) => {
      if (year === 2024) throw new Error('Season unavailable');
      return fixture();
    }),
  };
}
it('loads only previous seasons on demand and displays convergence, reliability and unavailable coverage', async () => {
  const access = api();
  render(
    <Provider>
      <PlayoffCalibration api={access} leagueId="league" year={2026} />
    </Provider>,
  );
  expect(access.getInsights).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Run historical calibration' }));
  await waitFor(() => expect(screen.getByText('Backtest complete.')).toBeInTheDocument(), {
    timeout: 5000,
  });
  expect(screen.getByRole('button', { name: 'Export calibration JSON' })).toBeEnabled();
  expect(access.getInsights.mock.calls.map((args) => args[1])).toEqual([2025, 2024]);
  expect(screen.getByText(/2024 unavailable: Season unavailable/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Brier score by completed week/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Weekly diagnostics' }));
  const table = screen.getByRole('table', { name: 'Weekly playoff forecast accuracy' });
  expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Season comparisons' }));
  expect(screen.getByRole('table', { name: 'Playoff accuracy by season' })).toHaveTextContent(
    'Standings Brier',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Final seeding' }));
  expect(
    screen.getByRole('heading', { name: 'Final-week seeding rules check' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reliability' }));
  expect(
    screen.getByLabelText('Calibration through week').querySelector('option[value="3"]'),
  ).toBeNull();
  expect(
    screen.getByRole('table', { name: 'Season-level playoff reliability' }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Calibration through week'), { target: { value: '2' } });
  expect(screen.getByText(/Week 2: predicted probability/)).toBeInTheDocument();
  expect(access.getInsights).toHaveBeenCalledTimes(2);
});
it('does not fetch live history for saved snapshots', () => {
  const access = api();
  render(
    <Provider>
      <PlayoffCalibration api={access} leagueId="league" year={2026} frozen />
    </Provider>,
  );
  expect(screen.getByText(/not included in this saved snapshot/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(access.getLeagueSeasons).not.toHaveBeenCalled();
});
it('explains when historical results cannot be evaluated', async () => {
  const access = api();
  access.getInsights.mockResolvedValue({ ...fixture(), results: undefined });
  render(
    <Provider>
      <PlayoffCalibration api={access} leagueId="league" year={2026} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Run historical calibration' }));
  await waitFor(() => expect(screen.getByText('Backtest complete.')).toBeInTheDocument(), {
    timeout: 5000,
  });
  expect(
    screen.getByText(/2025 excluded: Actual playoff qualification is unavailable/),
  ).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
});

it('cancels hidden calibration without accepting late data or restarting on return', async () => {
  const access = api();
  let finish!: (value: SeasonInsights) => void;
  access.getInsights.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const renderView = (active: boolean) => (
    <Provider>
      <PlayoffCalibration api={access} leagueId="league" year={2026} active={active} />
    </Provider>
  );
  const view = render(renderView(true));
  fireEvent.click(screen.getByRole('button', { name: 'Run historical calibration' }));
  await waitFor(() => expect(access.getInsights).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Cancel calibration' })).toBeVisible();
  view.rerender(renderView(false));
  expect(screen.getByText(/Calibration canceled/)).toBeInTheDocument();
  finish(fixture());
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  view.rerender(renderView(true));
  expect(access.getInsights).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Rerun historical calibration' }));
  await waitFor(() => expect(screen.getByText('Backtest complete.')).toBeInTheDocument(), {
    timeout: 5000,
  });
  expect(screen.getByRole('button', { name: 'Export calibration JSON' })).toBeEnabled();
});
