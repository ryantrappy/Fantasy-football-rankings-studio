import * as publicFunctions from './functions/public-insights.functions';
import * as privateFunctions from './functions/rankings.functions';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { getRouter } from './router';
import { Provider } from './components/ui/provider';
import { Authentication } from './auth/Authentication';

const auth = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  error: undefined,
  loginWithRedirect: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  getAccessTokenSilently: vi.fn().mockResolvedValue('test-token'),
}));
vi.mock('./functions/rankings.functions', () => ({
  listLeagues: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  getLeagueSeasons: vi.fn().mockResolvedValue({
    ok: true,
    data: { years: [2025], activeSeason: 2025, activeManagerKeys: [] },
  }),
  getInsights: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      completedWeek: 0,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  }),
}));
vi.mock('./functions/public-insights.functions', () => ({
  getPublicLeague: vi.fn().mockResolvedValue({
    ok: true,
    data: { leagueId: '123', leagueName: 'Shared league', leagueType: 0, seasonId: 2026 },
  }),
  getPublicLeagueSeasons: vi.fn().mockResolvedValue({
    ok: true,
    data: { years: [2026, 2025, 2024], activeSeason: 2026, activeManagerKeys: [] },
  }),
  getPublicInsights: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      completedWeek: 0,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  }),
}));
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
  useAuth0: () => auth,
}));
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  auth.isAuthenticated = false;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({ ok: true, data: [] });
  vi.stubEnv('VITE_AUTH0_DOMAIN', 'example.auth0.com');
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', 'test-client');
  vi.stubEnv('VITE_AUTH0_AUDIENCE', 'https://test-api');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: [] }))),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
async function openPage(path = '/') {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: [path] }) });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}
test('server rendering keeps browser authentication and private content behind hydration', () => {
  const html = renderToString(
    <Provider>
      <Authentication>
        <div>Private rankings</div>
      </Authentication>
    </Provider>,
  );
  expect(html).toContain('Your league. Your rankings.');
  expect(html).not.toContain('Private rankings');
});
test('anonymous visitors can sign in without making league API requests', async () => {
  await openPage();
  await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
  expect(auth.loginWithRedirect).toHaveBeenCalledTimes(1);
  expect(fetch).not.toHaveBeenCalled();
});
test('authenticated visitors can navigate to league creation and return', async () => {
  auth.isAuthenticated = true;
  const router = await openPage();
  await screen.findByRole('heading', { name: 'Create your first league' });
  await userEvent.click(screen.getAllByRole('link', { name: 'Create league' })[0]);
  expect(await screen.findByRole('heading', { name: 'Create a league.' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/leagues/new');
  await userEvent.click(screen.getByRole('button', { name: /Back to rankings/ }));
  expect(await screen.findByRole('heading', { name: 'Power rankings studio' })).toBeInTheDocument();
});
test('the create league URL supports direct navigation', async () => {
  auth.isAuthenticated = true;
  await openPage('/leagues/new');
  expect(await screen.findByLabelText(/League ID/)).toBeInTheDocument();
});

test('anonymous visitors do not see the rankings studio tab in navigation', async () => {
  await openPage('/shared/insights?leagueId=123&year=2025');
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Rankings studio' })).not.toBeInTheDocument();
});

test('shared season insights load anonymously without requesting an access token', async () => {
  await openPage('/shared/insights?leagueId=123&year=2025');
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalledWith(
    expect.objectContaining({ data: { leagueId: '123', year: 2025 } }),
  );
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
  expect(privateFunctions.listLeagues).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
});
test('shared history loads the selected seasons and preserves them in a copied link', async () => {
  const user = userEvent.setup();
  await openPage('/shared/history?leagueId=123&years=%5B2024%5D');
  expect(
    await screen.findByRole('heading', { name: 'Track the manager, not the team name' }),
  ).toBeInTheDocument();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalledWith(
    expect.objectContaining({ data: { leagueId: '123', year: 2024 } }),
  );
  expect(publicFunctions.getPublicInsights).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Copy share link' }));
  expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument();
  const copied = await navigator.clipboard.readText();
  expect(new URL(copied).pathname).toBe('/shared/history');
  expect(JSON.parse(new URL(copied).searchParams.get('years')!)).toEqual([2024]);
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
});
test('public reports work without Auth0 configuration', async () => {
  vi.stubEnv('VITE_AUTH0_DOMAIN', '');
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', '');
  vi.stubEnv('VITE_AUTH0_AUDIENCE', '');
  await openPage('/shared/insights?leagueId=123&year=2025');
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Sign-in is not configured.')).not.toBeInTheDocument();
});
test('unknown shared links show a useful error without a login prompt', async () => {
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValueOnce({
    ok: false,
    error: { status: 404, message: 'League not found.' },
  });
  await openPage('/shared/history?leagueId=999');
  expect(await screen.findByRole('alert')).toHaveTextContent('League not found.');
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
});
test('authenticated users retain their league picker on internal reports', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [
      { leagueId: '123', leagueName: 'First league', leagueType: 0, seasonId: 2026 },
      { leagueId: '456', leagueName: 'Second league', leagueType: 0, seasonId: 2026 },
    ],
  });
  await openPage('/insights?leagueId=123&year=2025');
  expect(await screen.findByRole('option', { name: 'Second league' })).toBeInTheDocument();
});

test('shared links preserve long numeric provider IDs exactly', async () => {
  const id = '1312529175982129152';
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValueOnce({
    ok: true,
    data: { leagueId: id, leagueName: 'Sleeper league', leagueType: 0, seasonId: 2026 },
  });
  await openPage(`/shared/insights?leagueId=${id}&year=2025`);
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalledWith(
    expect.objectContaining({ data: { leagueId: id, year: 2025 } }),
  );
});

test.each([
  ['/insights?leagueId=123&year=2025', 'Who delivers every week?'],
  ['/history?leagueId=123&years=%5B2025%5D', 'Track the manager, not the team name'],
])('signed-in ESPN owners use authenticated report requests on %s', async (path, heading) => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'Private ESPN league', leagueType: 1, seasonId: 2025 }],
  });
  await openPage(path);
  expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  expect(privateFunctions.getLeagueSeasons).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { leagueId: '123' },
      headers: { Authorization: 'Bearer test-token' },
    }),
  );
  expect(privateFunctions.getInsights).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { leagueId: '123', year: 2025 },
      headers: { Authorization: 'Bearer test-token' },
    }),
  );
  expect(publicFunctions.getPublicInsights).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicLeagueSeasons).not.toHaveBeenCalled();
});
test('signed-in visitors to another owner’s league still use public report requests', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '456', leagueName: 'My league', leagueType: 1, seasonId: 2025 }],
  });
  await openPage('/shared/insights?leagueId=123&year=2025');
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalled();
  expect(publicFunctions.getPublicLeagueSeasons).toHaveBeenCalled();
  expect(privateFunctions.getInsights).not.toHaveBeenCalled();
  expect(privateFunctions.getLeagueSeasons).not.toHaveBeenCalled();
});

test('a signed-in ESPN owner stays public while navigating shared reports', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'My ESPN league', leagueType: 1, seasonId: 2025 }],
  });
  const router = await openPage('/shared/insights?leagueId=123&year=2025');
  await screen.findByRole('heading', { name: 'Who delivers every week?' });
  expect(screen.queryByRole('link', { name: 'Rankings studio' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('link', { name: 'League history' }));
  await screen.findByRole('heading', { name: 'Track the manager, not the team name' });
  expect(router.state.location.pathname).toBe('/shared/history');
  expect(router.state.location.search.leagueId).toBe('123');
  expect(screen.queryByRole('link', { name: 'Rankings studio' })).not.toBeInTheDocument();
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
  expect(privateFunctions.listLeagues).not.toHaveBeenCalled();
  expect(privateFunctions.getInsights).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalled();
});
