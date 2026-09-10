import { render, screen, fireEvent } from '@testing-library/react';
import { PlayoffForecast } from './PlayoffForecast';
import { Provider } from './ui/provider';
import type { SeasonInsights } from '../insights';
it('shows cutoff-controlled probabilities and the scenario limitations', () => {
  const data = {
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
  render(
    <Provider>
      <PlayoffForecast data={data} />
    </Provider>,
  );
  expect(screen.getByRole('table', { name: 'Playoff probabilities' })).toBeInTheDocument();
  expect(screen.getByText(/random remaining opponents/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Forecast through week'), { target: { value: '2' } });
  expect(screen.getByText(/At least three/)).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
it('explains missing provider settings', () => {
  render(
    <Provider>
      <PlayoffForecast data={{ completedWeek: 0 } as SeasonInsights} />
    </Provider>,
  );
  expect(screen.getByText(/settings are unavailable/)).toBeInTheDocument();
});
