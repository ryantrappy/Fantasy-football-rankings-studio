import { fireEvent, render, screen, within } from '@testing-library/react';
import { bootstrapFixture } from '../season-bootstrap.fixture';
import { SeasonBootstrapPage } from './SeasonBootstrapPage';
import { Provider } from './ui/provider';

const api = vi.hoisted(() => ({
  listLeagues: vi.fn(),
  getLeagueSeasons: vi.fn(),
  getInsights: vi.fn(),
  getLiveLeague: vi.fn(),
}));
vi.mock('../auth/session', () => ({ useApi: () => api }));

it('runs a seeded season, compares a player, and shows team distributions', async () => {
  const { report, live } = bootstrapFixture();
  api.listLeagues.mockResolvedValue([
    { leagueId: live.leagueId, leagueName: live.leagueName, seasonId: live.season },
  ]);
  api.getLeagueSeasons.mockResolvedValue({ years: [2026, 2025] });
  api.getInsights.mockResolvedValue(report);
  api.getLiveLeague.mockResolvedValue(live);
  const select = vi.fn();
  render(
    <Provider>
      <SeasonBootstrapPage search={{ leagueId: '123', year: 2026 }} select={select} />
    </Provider>,
  );
  await screen.findByRole('button', { name: 'Run simulation' });
  expect(api.getInsights).toHaveBeenCalledWith('123', 2026, false);
  fireEvent.change(screen.getByLabelText('Scoring history season'), { target: { value: '2025' } });
  expect(select).toHaveBeenCalledWith({ leagueId: '123', year: 2025 });

  fireEvent.change(screen.getByLabelText('Random seed'), { target: { value: '-1' } });
  expect(screen.getByRole('button', { name: 'Run simulation' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Random seed'), { target: { value: '17' } });
  fireEvent.change(screen.getByLabelText('Matchup schedule'), { target: { value: 'league' } });
  fireEvent.change(screen.getByLabelText('Comparison team'), { target: { value: 'a' } });
  fireEvent.change(screen.getByLabelText('Player to remove'), { target: { value: 'one' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));

  const table = await screen.findByRole('table', { name: 'Simulated season standings' });
  expect(within(table).getByRole('row', { name: /Alpha/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Without one' })).toBeVisible();
  expect(screen.getByText(/Seed 17.*League schedule.*Best ball/)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Distribution metric'), { target: { value: 'finish' } });
  expect(screen.getByRole('list', { name: 'Final place frequencies' })).toBeVisible();
});
