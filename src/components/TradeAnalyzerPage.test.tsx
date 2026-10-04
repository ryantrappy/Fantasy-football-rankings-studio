import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { TradeAnalyzerPage } from './TradeAnalyzerPage';
it('shows both trade impacts from a read-only roster snapshot', async () => {
  const player = (id: string, projectedPoints: number) => ({
    id,
    name: id,
    position: 'RB',
    lineupSlot: 'RB',
    projectedPoints,
    starter: true,
    points: null,
    owned: true,
    locked: false,
    availability: null,
    bye: false,
  });
  const api = {
    getLiveMatchups: vi.fn().mockResolvedValue([
      {
        leagueId: '1',
        leagueName: 'League',
        season: 2026,
        week: 5,
        provider: 'Sleeper',
        capturedAt: '2026-10-01',
        lineupSlots: ['RB'],
        matchups: [
          {
            id: '1',
            home: { teamId: '1', name: 'One', score: null, players: [player('A', 10)] },
            away: { teamId: '2', name: 'Two', score: null, players: [player('B', 20)] },
          },
        ],
      },
    ]),
  };
  render(
    <Provider>
      <ApiContext value={api as never}>
        <TradeAnalyzerPage />
      </ApiContext>
    </Provider>,
  );
  fireEvent.click(await screen.findByLabelText('Send A'));
  fireEvent.click(screen.getByLabelText('Send B'));
  expect(screen.getByText(/before: 10.00 · after: 20.00 · change: \+10.00/)).toBeInTheDocument();
  expect(screen.getByText(/before: 20.00 · after: 10.00 · change: -10.00/)).toBeInTheDocument();
  expect(api.getLiveMatchups).toHaveBeenCalledTimes(1);
});

vi.mock('./PlayerProfileLink', () => ({
  PlayerProfileLink: ({
    leagueId,
    year,
    playerId,
    children,
  }: {
    leagueId: string;
    year: number;
    playerId: string;
    children: React.ReactNode;
  }) => <a href={`/players?leagueId=${leagueId}&year=${year}&playerId=${playerId}`}>{children}</a>,
}));
