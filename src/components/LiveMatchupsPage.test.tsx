import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import type { createApi } from '../api/client';
import type { LiveLeague } from '../live-matchups';
import type { ManagedTeamSelection } from '../types';
import { LiveMatchupsPage } from './LiveMatchupsPage';

function managedLeagues(count: number): LiveLeague[] {
  const team = (teamId: string, name: string) => ({ teamId, name, score: 100, players: [] });
  return Array.from({ length: count }, (_, index) => ({
    leagueId: `league-${index}`,
    leagueName: `League ${index + 1}`,
    provider: index % 2 ? 'ESPN' : 'Sleeper',
    season: 2025 + (index % 2),
    week: 4,
    matchups: [
      {
        id: 'other',
        home: team(`other-${index}`, `Other ${index + 1}`),
        away: team(`rival-${index}`, `Rival ${index + 1}`),
      },
      {
        id: 'mine',
        home:
          index % 2
            ? team(`opponent-${index}`, `Opponent ${index + 1}`)
            : team(`viewer-${index}`, `Viewer ${index + 1}`),
        away:
          index === 2
            ? null
            : index % 2
              ? team(`viewer-${index}`, `Viewer ${index + 1}`)
              : team(`opponent-${index}`, `Opponent ${index + 1}`),
      },
    ],
  }));
}
function viewerApi(leagues: LiveLeague[]) {
  return {
    getLiveMatchups: vi.fn().mockResolvedValue(leagues),
    managedTeam: {
      get: vi.fn(async (leagueId: string, _year: number): Promise<ManagedTeamSelection> => ({
        teamId: `viewer-${leagueId.split('-')[1]}`,
        needsReselection: false,
        teams: [],
      })),
    },
  };
}
function livePage(api: unknown) {
  return (
    <Provider>
      <ApiContext value={api as ReturnType<typeof createApi>}>
        <LiveMatchupsPage />
      </ApiContext>
    </Provider>
  );
}

it('defaults to the viewer’s home, away and bye matchups in the first four leagues', async () => {
  const leagues = managedLeagues(6);
  const api = viewerApi(leagues);
  render(livePage(api));
  await screen.findByText('4 of 4 selected');
  const board = screen.getByRole('region', { name: 'Highlighted matchups' });
  expect(
    within(board)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual([
    'Viewer 1 vs Opponent 1',
    'Opponent 2 vs Viewer 2',
    'Viewer 3 vs Bye',
    'Opponent 4 vs Viewer 4',
  ]);
  expect(api.managedTeam.get.mock.calls).toEqual(
    leagues.slice(0, 4).map((league) => [league.leagueId, league.season]),
  );
  expect(
    screen.getByRole('button', { name: 'Highlight Viewer 5 versus Opponent 5' }),
  ).toBeDisabled();
});

it('selects all available managed matchups when there are fewer than four leagues', async () => {
  render(livePage(viewerApi(managedLeagues(2))));
  await screen.findByText('2 of 4 selected');
  expect(screen.getByRole('button', { name: 'Remove Viewer 1 versus Opponent 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: 'Remove Opponent 2 versus Viewer 2' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('skips missing, stale, failed and unmatched team choices without filling from later leagues', async () => {
  const api = viewerApi(managedLeagues(5));
  api.managedTeam.get
    .mockResolvedValueOnce({
      teamId: null,
      needsReselection: false,
      teams: [],
    })
    .mockResolvedValueOnce({ teamId: 'viewer-1', needsReselection: true, teams: [] })
    .mockRejectedValueOnce(new Error('Team selection unavailable'))
    .mockResolvedValueOnce({ teamId: 'no-current-matchup', needsReselection: false, teams: [] });
  render(livePage(api));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh scores' })).toBeEnabled());
  expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
  expect(api.managedTeam.get).toHaveBeenCalledTimes(4);
  expect(
    screen.getByRole('button', { name: 'Highlight Viewer 5 versus Opponent 5' }),
  ).toBeEnabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('preserves manual selections and an intentionally cleared board across refreshes', async () => {
  const api = viewerApi(managedLeagues(1));
  render(livePage(api));
  await screen.findByRole('button', { name: 'Remove Viewer 1 versus Opponent 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Remove Viewer 1 versus Opponent 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Highlight Other 1 versus Rival 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh scores' }));
  await waitFor(() => expect(api.getLiveMatchups).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh scores' })).toBeEnabled());
  expect(screen.getByRole('button', { name: 'Remove Other 1 versus Rival 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(api.managedTeam.get).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Other 1 versus Rival 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh scores' }));
  await waitFor(() => expect(api.getLiveMatchups).toHaveBeenCalledTimes(3));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh scores' })).toBeEnabled());
  expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
});

it('keeps a manual choice made while managed-team defaults are still loading', async () => {
  let resolve!: (value: { teamId: string; needsReselection: boolean; teams: [] }) => void;
  const pending = new Promise<{ teamId: string; needsReselection: boolean; teams: [] }>((done) => {
    resolve = done;
  });
  const api = viewerApi(managedLeagues(1));
  api.managedTeam.get.mockReturnValue(pending);
  render(livePage(api));
  fireEvent.click(await screen.findByRole('button', { name: 'Highlight Other 1 versus Rival 1' }));
  await act(async () => resolve({ teamId: 'viewer-0', needsReselection: false, teams: [] }));
  expect(screen.getByRole('button', { name: 'Remove Other 1 versus Rival 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    screen.getByRole('button', { name: 'Highlight Viewer 1 versus Opponent 1' }),
  ).toHaveAttribute('aria-pressed', 'false');
});

it('uses the new viewer’s team choice when the account API changes', async () => {
  const leagues = managedLeagues(1);
  const first = viewerApi(leagues);
  const second = viewerApi(leagues);
  second.managedTeam.get.mockResolvedValue({
    teamId: 'other-0',
    needsReselection: false,
    teams: [],
  });
  const { rerender } = render(livePage(first));
  await screen.findByRole('button', { name: 'Remove Viewer 1 versus Opponent 1' });
  rerender(livePage(second));
  await screen.findByRole('button', { name: 'Remove Other 1 versus Rival 1' });
  expect(
    screen.getByRole('button', { name: 'Highlight Viewer 1 versus Opponent 1' }),
  ).toHaveAttribute('aria-pressed', 'false');
});

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
