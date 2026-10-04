import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import type { createApi } from '../api/client';
import type { LiveLeague } from '../live-matchups';
import { LiveMatchupsPage } from './LiveMatchupsPage';

it('shows compact scores and limits highlighted rosters to four matchups', async () => {
  const league: LiveLeague = {
    leagueId: '12',
    leagueName: 'Sunday league',
    provider: 'Sleeper',
    season: 2026,
    week: 4,
    matchups: Array.from({ length: 5 }, (_, index) => ({
      id: String(index + 1),
      home: {
        teamId: `h${index}`,
        name: `Home ${index + 1}`,
        score: 99 + index,
        players: [
          {
            id: `p${index}`,
            name: `Player ${index + 1}`,
            position: 'QB',
            points: 12,
            starter: true,
          },
        ],
      },
      away: { teamId: `a${index}`, name: `Away ${index + 1}`, score: 90, players: [] },
    })),
  };
  const api = { getLiveMatchups: vi.fn().mockResolvedValue([league]) } as unknown as ReturnType<
    typeof createApi
  >;
  render(
    <Provider>
      <ApiContext.Provider value={api}>
        <LiveMatchupsPage />
      </ApiContext.Provider>
    </Provider>,
  );
  await screen.findByRole('button', { name: 'Highlight Home 1 versus Away 1' });
  const sidebar = screen.getByRole('complementary', { name: 'All league matchups' });
  const details = screen.getByRole('region', { name: 'Highlighted matchups' });
  expect(within(sidebar).getAllByRole('button')).toHaveLength(5);
  for (let index = 1; index <= 4; index++)
    fireEvent.click(
      screen.getByRole('button', { name: `Highlight Home ${index} versus Away ${index}` }),
    );
  expect(screen.getByText('4 of 4 selected')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Highlight Home 5 versus Away 5' })).toBeDisabled();
  expect(within(details).getByText('Player 1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Home 1 versus Away 1' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Highlight Home 5 versus Away 5' })).toBeEnabled(),
  );
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
