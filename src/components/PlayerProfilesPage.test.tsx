import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { PlayerProfilesPage } from './PlayerProfilesPage';
import type { WaiverPool } from '../waivers';

function makeApi() {
  return {
    listLeagues: vi.fn().mockResolvedValue([
      { leagueId: '10', leagueName: 'League', seasonId: 2026, leagueType: 0 },
      { leagueId: '20', leagueName: 'Other league', seasonId: 2025, leagueType: 1 },
    ]),
    getInsights: vi.fn().mockResolvedValue({
      generatedAt: '2026-10-01',
      scores: [
        {
          week: 1,
          teamId: '1',
          players: [
            { playerId: 'a', points: 10 },
            { playerId: 'b', points: 20 },
          ],
        },
      ],
    }),
    getLiveMatchups: vi.fn().mockResolvedValue(
      ['10', '20'].map((leagueId) => ({
        leagueId,
        provider: leagueId === '10' ? 'Sleeper' : 'ESPN',
        season: leagueId === '10' ? 2026 : 2025,
        week: 5,
        capturedAt: '2026-10-02',
        matchups: [
          {
            home: {
              teamId: '1',
              name: 'Roster',
              players: [
                {
                  id: 'a',
                  name: 'Alpha',
                  position: 'RB',
                  starter: true,
                  points: null,
                  owned: true,
                  projectedPoints: 12,
                  projectionSpread: 4,
                  projectionNote: 'Equal-weight ESPN/Sleeper mean.',
                  projectionSources: [
                    { provider: 'Sleeper', playerId: 'a', points: 10, capturedAt: '2026-10-02' },
                    { provider: 'ESPN', playerId: '90', points: 14, capturedAt: '2026-10-02' },
                  ],
                },
                {
                  id: 'b',
                  name: 'Beta',
                  position: 'WR',
                  starter: false,
                  points: null,
                  owned: true,
                },
              ],
            },
            away: null,
          },
        ],
      })),
    ),
    waivers: {
      get: vi
        .fn()
        .mockResolvedValue({ candidates: [], notices: [], capturedAt: '2026-10-02', week: 5 }),
    },
  };
}
function setup(
  api = makeApi(),
  search: { leagueId?: string; year?: number; playerId?: string } = { leagueId: '10', year: 2026 },
) {
  render(
    <Provider>
      <ApiContext value={api as never}>
        <PlayerProfilesPage search={search} />
      </ApiContext>
    </Provider>,
  );
  return api;
}

it('compares selected players over a common week range and keeps source details available', async () => {
  setup();
  expect(screen.queryByLabelText('Last week')).not.toBeInTheDocument();
  fireEvent.click(await screen.findByLabelText('Compare Alpha'));
  fireEvent.click(screen.getByLabelText('Compare Beta'));
  const alpha = screen.getByRole('region', { name: 'Alpha profile' });
  const beta = screen.getByRole('region', { name: 'Beta profile' });
  expect(alpha).toHaveTextContent('Week 5 projection12.00');
  expect(within(alpha).getByText('Source disagreement: 4.00 points')).toBeInTheDocument();
  fireEvent.click(within(alpha).getByText('Identity & data sources'));
  expect(within(alpha).getByText(/ESPN: 14.00 · player ID 90/)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Last week'), { target: { value: '2' } });
  expect(alpha).toHaveTextContent('Observed total10.00');
  expect(alpha).toHaveTextContent('Observed average10.00');
  expect(alpha).toHaveTextContent('Coverage: 1/2 weeks');
  expect(beta).toHaveTextContent('Observed total20.00');
  for (const profile of [alpha, beta]) {
    fireEvent.click(within(profile).getByText('Weekly scores'));
    expect(within(profile).getByRole('row', { name: '2 Unavailable' })).toBeVisible();
  }
});

it('retains deep-linked zero observations when current rosters fail', async () => {
  const api = makeApi();
  api.getInsights.mockResolvedValue({
    generatedAt: '2026-10-01',
    scores: [{ week: 1, players: [{ playerId: '1', points: 0 }] }],
  });
  api.getLiveMatchups.mockRejectedValue(new Error('offline'));
  setup(api, { leagueId: '10', year: 2026, playerId: '1' });
  await screen.findByText('Current rosters and projections unavailable.');
  const profile = screen.getByRole('region', { name: 'Player 1 profile' });
  expect(profile).toHaveTextContent('Current projectionUnavailable');
  expect(profile).toHaveTextContent('Observed total0.00');
  expect(profile).toHaveTextContent('Observed average0.00');
});

it('keeps selected players visible through name and position filters', async () => {
  setup();
  fireEvent.click(await screen.findByLabelText('Compare Alpha'));
  const search = screen.getByLabelText('Search player name, position or provider ID');
  fireEvent.change(search, { target: { value: '  Beta  ' } });
  expect(screen.queryByLabelText('Compare Alpha')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Compare Beta')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remove Alpha from comparison' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Alpha profile' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Position filter'), { target: { value: 'RB' } });
  expect(screen.getByText('No players match your filters.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByLabelText('Compare Alpha')).toBeChecked();
  expect(screen.getByLabelText('Compare Beta')).toBeInTheDocument();
});

it('removes individual players and clears all comparisons', async () => {
  setup();
  fireEvent.click(await screen.findByLabelText('Compare Alpha'));
  fireEvent.click(screen.getByLabelText('Compare Beta'));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha from comparison' }));
  expect(screen.getByLabelText('Compare Alpha')).not.toBeChecked();
  expect(screen.queryByRole('region', { name: 'Alpha profile' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Beta profile' }));
  expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Compare Alpha'));
  fireEvent.click(screen.getByLabelText('Compare Beta'));
  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  expect(screen.getByRole('heading', { name: 'Start with a player' })).toBeInTheDocument();
  expect(screen.queryByLabelText('First week')).not.toBeInTheDocument();
});

it('preserves the chosen league and season on refresh and clears selections on context changes', async () => {
  const api = setup(makeApi(), {});
  await screen.findByLabelText('Compare Alpha');
  fireEvent.change(screen.getByLabelText('Player league'), { target: { value: '20' } });
  fireEvent.click(await screen.findByLabelText('Compare Alpha'));
  expect(screen.getByLabelText('Player season')).toHaveValue(2025);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh player data' }));
  await waitFor(() => expect(api.listLeagues).toHaveBeenCalledTimes(2));
  expect(await screen.findByLabelText('Compare Alpha')).toBeChecked();
  expect(screen.getByLabelText('Player league')).toHaveValue('20');
  expect(screen.getByLabelText('Player season')).toHaveValue(2025);
  expect(api.getInsights).toHaveBeenLastCalledWith('20', 2025, true);
  fireEvent.change(screen.getByLabelText('Player season'), { target: { value: '2024' } });
  await screen.findByLabelText('Compare Player a');
  expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
});

it('discards a delayed unowned-pool response after switching leagues', async () => {
  const api = makeApi();
  let resolvePool!: (pool: WaiverPool) => void;
  api.waivers.get.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolvePool = resolve;
      }),
  );
  setup(api);
  await screen.findByLabelText('Compare Alpha');
  fireEvent.click(screen.getByRole('button', { name: 'Include verified unowned pool' }));
  await waitFor(() => expect(api.waivers.get).toHaveBeenCalledWith('10', 2026));
  fireEvent.change(screen.getByLabelText('Player league'), { target: { value: '20' } });
  await screen.findByLabelText('Compare Alpha');
  await act(async () =>
    resolvePool({
      capturedAt: '2026-10-02',
      week: 5,
      notices: [],
      candidates: [{ id: 'ghost', name: 'Ghost', starter: false, points: null }],
    }),
  );
  expect(screen.queryByLabelText('Compare Ghost')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Include verified unowned pool' })).toBeEnabled();
});

it('shows range validation without presenting misleading empty comparisons', async () => {
  setup();
  fireEvent.click(await screen.findByLabelText('Compare Alpha'));
  fireEvent.change(screen.getByLabelText('First week'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Last week'), { target: { value: '2' } });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Choose a first week no later than the last week.',
  );
  expect(screen.queryByRole('region', { name: 'Alpha profile' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('First week'), { target: { value: '1' } });
  expect(screen.getByRole('region', { name: 'Alpha profile' })).toHaveTextContent(
    'Coverage: 1/2 weeks',
  );
});

it('finishes loading and explains an empty connected-league list', async () => {
  const api = makeApi();
  api.listLeagues.mockResolvedValue([]);
  setup(api, {});
  await screen.findByText(
    'No covered players are available. Connect a league or refresh provider data.',
  );
  expect(screen.queryByText('Loading player data…')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh player data' })).toBeEnabled();
});
