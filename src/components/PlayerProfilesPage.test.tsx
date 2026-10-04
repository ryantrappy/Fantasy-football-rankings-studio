import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { PlayerProfilesPage } from './PlayerProfilesPage';
it('searches provider identities and compares selected players over a common week range', async () => {
  const api = {
    listLeagues: vi
      .fn()
      .mockResolvedValue([{ leagueId: '10', leagueName: 'League', seasonId: 2026, leagueType: 0 }]),
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
    getLiveMatchups: vi.fn().mockResolvedValue([
      {
        leagueId: '10',
        provider: 'Sleeper',
        season: 2026,
        week: 5,
        capturedAt: '2026-10-02',
        matchups: [
          {
            home: {
              teamId: '1',
              name: 'Roster',
              players: [
                { id: 'a', name: 'Alpha', starter: true, points: null, owned: true },
                { id: 'b', name: 'Beta', starter: false, points: null, owned: true },
              ],
            },
            away: null,
          },
        ],
      },
    ]),
  };
  render(
    <Provider>
      <ApiContext value={api as never}>
        <PlayerProfilesPage search={{ leagueId: '10', year: 2026 }} />
      </ApiContext>
    </Provider>,
  );
  fireEvent.click(await screen.findByLabelText(/Alpha ·/));
  fireEvent.click(screen.getByLabelText(/Beta ·/));
  fireEvent.change(screen.getByLabelText('Last comparison week'), { target: { value: '2' } });
  expect(screen.getByText(/Observed total: 10.00/)).toHaveTextContent('coverage: 1/2 weeks');
  expect(screen.getByText(/Observed total: 20.00/)).toBeInTheDocument();
  expect(screen.getAllByText('Week 2: Unavailable')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Search player name, position or provider ID'), {
    target: { value: 'Beta' },
  });
  expect(screen.queryByLabelText(/Alpha ·/)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Beta ·/)).toBeInTheDocument();
});
it('retains observations when current provider responses fail and labels projections unavailable', async () => {
  const api = {
    listLeagues: vi
      .fn()
      .mockResolvedValue([{ leagueId: '10', leagueName: 'League', seasonId: 2026, leagueType: 1 }]),
    getInsights: vi.fn().mockResolvedValue({
      generatedAt: '2026-10-01',
      scores: [{ week: 1, players: [{ playerId: '1', points: 0 }] }],
    }),
    getLiveMatchups: vi.fn().mockRejectedValue(new Error('offline')),
  };
  render(
    <Provider>
      <ApiContext value={api as never}>
        <PlayerProfilesPage search={{ leagueId: '10', year: 2026, playerId: '1' }} />
      </ApiContext>
    </Provider>,
  );
  await screen.findByText('Current rosters and projections unavailable.');
  expect(screen.getByText(/Week unavailable projection: Unavailable/)).toBeInTheDocument();
  expect(screen.getByText(/Observed total: 0.00/)).toBeInTheDocument();
});
