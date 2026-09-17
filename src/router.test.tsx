import * as publicFunctions from './functions/public-insights.functions';
import { readReportSnapshot } from './functions/report-snapshots.functions';
import { calculateInsights } from './server/insights/calculate';
import * as privateFunctions from './functions/rankings.functions';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { getRouter } from './router';
import { Provider } from './components/ui/provider';
import { Authentication } from './auth/Authentication';
import { readLeagueSetupDraft } from './league-setup-draft';

vi.mock('./index.css?url', () => ({ default: '/assets/index.test.css' }));
vi.mock('./functions/report-snapshots.functions', () => ({
  readReportSnapshot: vi.fn(),
  createReportSnapshot: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const auth = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  error: undefined,
  loginWithRedirect: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  getAccessTokenSilently: vi.fn().mockResolvedValue('test-token'),
  user: undefined as { sub: string } | undefined,
}));
const originalConsoleError = console.error;
let consoleErrors: unknown[][] = [];
let restoreConsoleError = () => {};

function isClientErrorLog(args: unknown[]) {
  if (args.length !== 1 || typeof args[0] !== 'string') return false;
  try {
    return (JSON.parse(args[0]) as { event?: unknown }).event === 'client_error';
  } catch {
    return false;
  }
}
vi.mock('./functions/rankings.functions', () => ({
  getEspnCredentialStatus: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { configured: false, onboardingComplete: true } }),
  skipEspnSetup: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { configured: false, onboardingComplete: true } }),
  listLeagues: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  createLeague: vi.fn().mockImplementation(async ({ data }) => ({ ok: true, data })),
  getLeagueInfo: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      leagueId: '123',
      leagueName: 'League',
      leagueType: 0,
      seasonId: 2026,
      maxWeek: 17,
      validWeeks: Array.from({ length: 17 }, (_, index) => index + 1),
      scheduleNote: 'Sleeper schedule weeks 1–17.',
    },
  }),
  getRankings: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  getTeams: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  saveRanking: vi.fn().mockImplementation(async ({ data }) => ({ ok: true, data })),
  getLeagueSeasons: vi.fn().mockResolvedValue({
    ok: true,
    data: { years: [2025], activeSeason: 2025, activeManagerKeys: [] },
  }),
  getInsights: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      playoffSettings: undefined,
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
      playoffSettings: undefined,
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
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (isClientErrorLog(args)) originalConsoleError(...args);
  });
  consoleErrors = consoleError.mock.calls;
  restoreConsoleError = () => consoleError.mockRestore();
  vi.stubGlobal('scrollTo', vi.fn());
  auth.isAuthenticated = false;
  auth.user = undefined;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({ ok: true, data: [] });
  vi.mocked(privateFunctions.createLeague).mockImplementation(async ({ data }) => ({
    ok: true,
    data,
  }));
  vi.mocked(privateFunctions.getLeagueInfo).mockResolvedValue({
    ok: true,
    data: {
      leagueId: '123',
      leagueName: 'League',
      leagueType: 0,
      seasonId: 2026,
      teamCount: undefined,
      maxWeek: 17,
      validWeeks: Array.from({ length: 17 }, (_, index) => index + 1),
      scheduleNote: 'Sleeper schedule weeks 1–17.',
    },
  });
  vi.mocked(privateFunctions.getRankings).mockResolvedValue({ ok: true, data: [] });
  vi.mocked(privateFunctions.getTeams).mockResolvedValue({ ok: true, data: [] });
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValue({
    ok: true,
    data: { leagueId: '123', leagueName: 'Shared league', leagueType: 0, seasonId: 2026 },
  });
  vi.mocked(publicFunctions.getPublicLeagueSeasons).mockResolvedValue({
    ok: true,
    data: { years: [2026, 2025, 2024], activeSeason: 2026, activeManagerKeys: [] },
  });
  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValue({
    ok: true,
    data: {
      playoffSettings: undefined,
      completedWeek: 0,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  });
  vi.stubEnv('VITE_AUTH0_DOMAIN', 'example.auth0.com');
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', 'test-client');
  vi.stubEnv('VITE_AUTH0_AUDIENCE', 'https://test-api');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: [] }))),
  );
});
afterEach(() => {
  const emptyHrefs = [...document.querySelectorAll<HTMLElement>('[href]')].filter(
    (element) => element.getAttribute('href') === '',
  );
  cleanup();
  const unexpectedConsoleErrors = consoleErrors.filter((args) => !isClientErrorLog(args));
  restoreConsoleError();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  expect(emptyHrefs).toEqual([]);
  expect(unexpectedConsoleErrors).toEqual([]);
});
async function openPage(path = '/') {
  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [path] }),
    context: router.options.context,
  });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />, { container: document });
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
  expect(document.querySelector('link[rel="stylesheet"]')).toHaveAttribute(
    'href',
    '/assets/index.test.css',
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
  expect(auth.loginWithRedirect).toHaveBeenCalledTimes(1);
  expect(fetch).not.toHaveBeenCalled();
});
test('authenticated visitors can navigate to league creation and return', async () => {
  auth.isAuthenticated = true;
  const router = await openPage();
  await screen.findByRole('heading', { name: 'Create your first league' });
  expect(screen.getByText('/leagues/')).toBeInTheDocument();
  expect(screen.getByText('leagueId')).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('link', { name: 'Create league' })[0]);
  expect(await screen.findByRole('heading', { name: 'Create a league.' })).toBeInTheDocument();
  expect(screen.getByText(/immediately after \/leagues\//)).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText('ESPN', { exact: true }));
  expect(screen.getByRole('note')).toHaveTextContent(
    'Save both your espn_s2 and SWID cookies in ESPN settings before connecting it',
  );
  expect(screen.getByText(/numeric value after leagueId=/)).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/leagues/new');
  await userEvent.click(screen.getByRole('button', { name: /Back to rankings/ }));
  expect(await screen.findByRole('heading', { name: 'Power rankings studio' })).toBeInTheDocument();
});

test('ESPN settings restores an in-progress league and completion clears it', async () => {
  const user = userEvent.setup();
  auth.isAuthenticated = true;
  auth.user = { sub: 'owner-a' };
  const router = await openPage('/leagues/new');
  await screen.findByRole('heading', { name: 'Create a league.' });
  await user.click(screen.getByLabelText('ESPN', { exact: true }));
  await user.type(screen.getByLabelText(/League ID/), '00123');
  await user.type(screen.getByLabelText(/Display name/), 'Private league');
  const season = screen.getByLabelText('Season');
  await user.clear(season);
  await user.type(season, '2025');

  await user.click(screen.getByRole('note').getElementsByTagName('a')[0]);
  await screen.findByRole('heading', { name: 'ESPN settings' });
  expect(router.state.location.search.returnTo).toBe('/leagues/new');
  await user.click(screen.getByRole('button', { name: 'Continue without credentials' }));

  await screen.findByRole('heading', { name: 'Create a league.' });
  expect(screen.getByRole('status')).toHaveTextContent('league details were restored');
  expect(screen.getByRole('radio', { name: 'ESPN' })).toBeChecked();
  expect(screen.getByLabelText(/League ID/)).toHaveValue('00123');
  expect(screen.getByLabelText(/Display name/)).toHaveValue('Private league');
  expect(screen.getByLabelText('Season')).toHaveValue(2025);
  await user.click(screen.getByRole('button', { name: 'Create league' }));
  await screen.findByRole('heading', { name: 'Power rankings studio' });
  expect(readLeagueSetupDraft('owner-a')).toBeNull();
});

test('cancelling league creation clears its temporary draft', async () => {
  const user = userEvent.setup();
  auth.isAuthenticated = true;
  auth.user = { sub: 'owner-a' };
  await openPage('/leagues/new');
  await user.type(await screen.findByLabelText(/League ID/), '123');
  expect(readLeagueSetupDraft('owner-a')).not.toBeNull();
  await user.click(screen.getByRole('button', { name: /Back to rankings/ }));
  expect(readLeagueSetupDraft('owner-a')).toBeNull();
});

test('authenticated sessions detach live queries before disposing their collections', async () => {
  const firstConsoleError = consoleErrors.length;
  auth.isAuthenticated = true;

  for (const subject of ['owner-a', 'owner-b', 'owner-c']) {
    auth.user = { sub: subject };
    await openPage();
    await screen.findByRole('heading', { name: 'Create your first league' });
    cleanup();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }

  auth.user = { sub: 'owner-a' };
  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: router.options.context,
  });
  await router.load();
  let rerender!: (ui: React.ReactNode) => void;
  await act(async () => {
    rerender = render(<RouterProvider router={router} />, { container: document }).rerender;
  });
  await screen.findByRole('heading', { name: 'Create your first league' });

  auth.isAuthenticated = false;
  await act(async () => rerender(<RouterProvider key="signed-out" router={router} />));
  await screen.findByRole('button', { name: 'Sign in' });
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));

  auth.isAuthenticated = true;
  auth.user = { sub: 'owner-b' };
  await act(async () => rerender(<RouterProvider key="owner-b" router={router} />));
  await screen.findByRole('heading', { name: 'Create your first league' });
  auth.user = { sub: 'owner-c' };
  await act(async () => rerender(<RouterProvider key="owner-c" router={router} />));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  cleanup();
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));

  const output = consoleErrors
    .slice(firstConsoleError)
    .map((args) => args.join(' '))
    .join('\n');
  expect(output).not.toMatch(/Live Query Error|manually cleaned up/);
});

test('successful first-league creation opens its guided editor', async () => {
  auth.isAuthenticated = true;
  const league = {
    leagueId: '456',
    providerLeagueId: '123',
    leagueName: 'First league',
    leagueType: 0 as const,
    seasonId: 2026,
  };
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({ ok: true, data: [league] });
  vi.mocked(privateFunctions.createLeague).mockResolvedValue({ ok: true, data: league });
  const router = await openPage('/leagues/new');
  await userEvent.type(await screen.findByLabelText(/League ID/), '123');
  await userEvent.click(screen.getByRole('button', { name: 'Create league' }));
  const welcome = await screen.findByRole('heading', { name: 'Your league is ready' });
  expect(welcome.closest('output')).toHaveTextContent(
    'Set the team order and write each take. Changes save as you work',
  );
  expect(router.state.location.pathname).toBe('/');
  expect(router.state.location.search).toMatchObject({
    leagueId: '456',
    year: 2026,
    week: 1,
    welcome: true,
  });
  await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
  await waitFor(() => expect(router.state.location.search.welcome).toBeUndefined());
});
test('the rankings studio uses provider weeks and retains saved out-of-schedule editions', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2026 }],
  });
  vi.mocked(privateFunctions.getLeagueInfo).mockResolvedValue({
    ok: true,
    data: {
      leagueId: '123',
      leagueName: 'League',
      leagueType: 0,
      seasonId: 2026,
      teamCount: undefined,
      maxWeek: 3,
      validWeeks: [2, 3],
      scheduleNote: 'Preseason schedule: weeks 2–3 are available for planning.',
    },
  });
  vi.mocked(privateFunctions.getRankings).mockResolvedValue({
    ok: true,
    data: [
      {
        leagueId: '123',
        year: 2026,
        week: 1,
        rankingsTitle: 'Saved week',
        introduction: '',
        teams: [],
      },
    ],
  });
  await openPage();
  expect(await screen.findByRole('option', { name: '1 (saved edition)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '2' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '3' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: '4' })).not.toBeInTheDocument();
  expect(
    screen.getByText(/Saved editions outside that schedule remain available/),
  ).toBeInTheDocument();
});

test('an invalid week moves safely to the first provider week with an explanation', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2026 }],
  });
  vi.mocked(privateFunctions.getLeagueInfo).mockResolvedValue({
    ok: true,
    data: {
      leagueId: '123',
      leagueName: 'League',
      leagueType: 0,
      seasonId: 2026,
      teamCount: undefined,
      maxWeek: 3,
      validWeeks: [2, 3],
      scheduleNote: 'Sleeper schedule weeks 2–3.',
    },
  });
  await openPage();
  expect(await screen.findByRole('status')).toHaveTextContent(/Week 1 is not available/);
  expect(screen.getByLabelText('Week')).toHaveValue('2');
});

test('an unavailable schedule leaves season selection available with recovery guidance', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2026 }],
  });
  vi.mocked(privateFunctions.getLeagueInfo).mockResolvedValue({
    ok: false,
    error: { status: 404, message: 'Season not found.' },
  });
  await openPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(/Choose another season/);
  expect(screen.getByLabelText('Season')).toBeEnabled();
  expect(screen.getByLabelText('Week')).toBeDisabled();
});

test('saved editions remain selectable when historical provider metadata is unavailable', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.listLeagues).mockResolvedValue({
    ok: true,
    data: [{ leagueId: '123', leagueName: 'League', leagueType: 0, seasonId: 2026 }],
  });
  vi.mocked(privateFunctions.getLeagueInfo).mockResolvedValue({
    ok: false,
    error: { status: 404, message: 'Season not found.' },
  });
  vi.mocked(privateFunctions.getRankings).mockResolvedValue({
    ok: true,
    data: [
      {
        leagueId: '123',
        year: 2026,
        week: 4,
        rankingsTitle: 'Archived edition',
        introduction: '',
        teams: [],
      },
    ],
  });
  await openPage();
  expect(await screen.findByRole('option', { name: '4 (saved edition)' })).toBeInTheDocument();
  expect(screen.getByText(/Only previously saved editions are shown/)).toBeInTheDocument();
  expect(screen.getByLabelText('Week')).toBeEnabled();
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

test('anonymous snapshot navigation uses only saved records and exposes its expiration', async () => {
  const user = userEvent.setup();
  const data = calculateInsights({
    completedWeek: 1,
    teams: [{ teamId: '1', managerKey: 'manager-1', teamName: 'Saved team', managerName: 'Alex' }],
    scores: [{ teamId: '1', week: 1, actual: 100, projected: null, starters: [] }],
    notes: [],
    moves: [],
    draftPickTrades: 0,
    playerNames: {},
  });
  vi.mocked(readReportSnapshot).mockResolvedValue({
    ok: true,
    data: {
      publicId: '0a460a85-0fa7-4daa-8617-56de7c568bba',
      savedAt: '2026-09-15T12:00:00Z',
      expiresAt: '2026-09-25T12:00:00Z',
      league: { leagueId: '123', leagueType: 1, leagueName: 'Private ESPN', seasonId: 2026 },
      view: 'insights',
      records: [{ year: 2025, data }],
      activeSeason: 2026,
      activeManagerKeys: ['manager-1'],
    },
  });
  await openPage('/shared/snapshots/0a460a85-0fa7-4daa-8617-56de7c568bba');
  await screen.findByRole('table', { name: 'Team scoring' });
  expect(screen.getByRole('note')).toHaveTextContent('Expires');
  expect(screen.getByRole('button', { name: 'Refresh insights' })).toBeDisabled();
  expect(screen.getByLabelText('Season').querySelectorAll('option')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'League history' }));
  const table = await screen.findByRole('table', { name: 'Manager season history' });
  expect(table).toHaveTextContent('Saved team');
  expect(screen.getByRole('button', { name: 'Refresh selected seasons' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '2025' }));
  await screen.findByRole('table', { name: 'Team scoring' });
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicLeague).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicLeagueSeasons).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicInsights).not.toHaveBeenCalled();
  expect(privateFunctions.getInsights).not.toHaveBeenCalled();
});

test('an expired snapshot link shows an actionable unavailable message', async () => {
  vi.mocked(readReportSnapshot).mockResolvedValue({
    ok: false,
    error: {
      status: 404,
      message: 'This report snapshot has expired. Ask the owner for a new link.',
    },
  });
  await openPage('/shared/snapshots/0a460a85-0fa7-4daa-8617-56de7c568bba');
  expect(await screen.findByRole('alert')).toHaveTextContent('Ask the owner for a new link.');
  expect(publicFunctions.getPublicInsights).not.toHaveBeenCalled();
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
  expect(privateFunctions.getEspnCredentialStatus).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Download Team scoring CSV' })).toBeInTheDocument();
});
test('season weekly scores expose best legal lineups without inventing unavailable data', async () => {
  const user = userEvent.setup();
  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValueOnce({
    ok: true,
    data: {
      playoffSettings: undefined,
      completedWeek: 2,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [
        {
          teamId: '1',
          teamName: 'Alpha',
          managerName: 'Alex',
          weeks: 2,
          total: 190,
          average: 95,
          best: 100,
          projectedWeeks: 0,
          projectionDelta: null,
          beatProjection: 0,
          aboveMedian: 1,
          bestLineupPoints: 120,
          lineupWeeks: 1,
          correctStarts: 1,
          lineupSlots: 2,
          tradeCount: 0,
          receivedPoints: 0,
          sentPoints: 0,
          netTradePoints: null,
          tradeStarts: 0,
        },
      ],
      scores: [
        {
          teamId: '1',
          week: 1,
          actual: 100,
          projected: null,
          starters: [],
          bestLineup: { points: 120, correctStarts: 1, slots: 2 },
        },
        { teamId: '1', week: 2, actual: 90, projected: null, starters: [] },
      ],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  });
  await openPage('/shared/insights?leagueId=123&year=2025');
  await screen.findByRole('heading', { name: 'Weekly scoring trends' });
  await user.click(screen.getByText('View exact weekly scores'));
  const table = screen.getByRole('table', { name: 'Weekly scores' });
  expect(table).toHaveTextContent('Best lineup');
  expect(table).toHaveTextContent('Missed points');
  expect(table).toHaveTextContent('Start accuracy');
  expect(table).toHaveTextContent('120');
  expect(table).toHaveTextContent('+20');
  expect(table).toHaveTextContent('50% (1 / 2)');
  expect(table).toHaveTextContent('—');
  expect(screen.getByRole('table', { name: 'Team scoring' })).toHaveTextContent('Best lineup / wk');
});
test('a failed insights refresh keeps the last successful report visible and reports recovery', async () => {
  const user = userEvent.setup();
  await openPage('/shared/insights?leagueId=123&year=2025');
  expect(await screen.findByText(/Last successfully refreshed Sep 7, 2026/i)).toBeInTheDocument();

  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValueOnce({
    ok: false,
    error: { status: 503, message: 'Sleeper is temporarily unavailable.' },
  });
  await user.click(screen.getByRole('button', { name: 'Refresh insights' }));

  const partial = await screen.findByRole('alert');
  expect(partial).toHaveTextContent('this report remains partially available');
  expect(partial).toHaveTextContent('Every section below uses data last successfully refreshed');
  expect(screen.getByText(/displayed sections may be stale/)).toBeInTheDocument();

  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValueOnce({
    ok: true,
    data: {
      playoffSettings: undefined,
      completedWeek: 0,
      generatedAt: '2026-09-09T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  });
  await user.click(screen.getByRole('button', { name: 'Try refresh again' }));
  expect(await screen.findByText(/Insights refreshed successfully/)).toBeInTheDocument();
  expect(screen.getAllByText(/Last successfully refreshed Sep 8, 2026/i)).toHaveLength(2);
});
test('a successfully loaded partial report names every affected section', async () => {
  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValueOnce({
    ok: true,
    data: {
      playoffSettings: undefined,
      completedWeek: 0,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      partialFailures: [
        {
          section: 'League summary and final finishes',
          message: 'Some bracket results are unavailable.',
        },
      ],
      notes: [],
    },
  });

  await openPage('/shared/insights?leagueId=123&year=2025');
  const status = await screen.findByRole('status', { name: '' });
  expect(status).toHaveTextContent('This report is partially available');
  expect(status).toHaveTextContent(
    'League summary and final finishes: Some bracket results are unavailable.',
  );
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
  expect(
    screen.getByRole('button', { name: 'Download Manager scorecard CSV' }),
  ).toBeInTheDocument();
  const history = screen.getByRole('table', { name: 'Manager season history' });
  expect(history).toHaveTextContent('Regular-season placement');
  expect(history).toHaveTextContent('Final placement');
});
test('shared history reports determinate progress while seasons load and refresh', async () => {
  const user = userEvent.setup();
  type InsightsResult = Awaited<ReturnType<typeof publicFunctions.getPublicInsights>>;
  const result = (): InsightsResult => ({
    ok: true,
    data: {
      playoffSettings: undefined,
      completedWeek: 0,
      generatedAt: '2026-09-08T00:00:00Z',
      teams: [],
      scores: [],
      pickups: [],
      trades: [],
      tradeComparisons: [],
      notes: [],
    },
  });
  const initial2025 = deferred<InsightsResult>();
  const initial2024 = deferred<InsightsResult>();
  vi.mocked(publicFunctions.getPublicInsights).mockImplementation(({ data }) =>
    data.year === 2025 ? initial2025.promise : initial2024.promise,
  );

  await openPage('/shared/history?leagueId=123&years=%5B2025%2C2024%5D');

  const initialProgress = await screen.findByRole('progressbar', {
    name: 'Loading 2 selected seasons',
  });
  expect(initialProgress).toHaveAttribute('value', '0');
  expect(initialProgress).toHaveAttribute('max', '2');

  initial2025.resolve(result());
  await waitFor(() => expect(initialProgress).toHaveAttribute('value', '1'));
  expect(screen.getByText(/Loaded 1 of 2 seasons/)).toBeInTheDocument();

  initial2024.resolve(result());
  await waitFor(() =>
    expect(
      screen.queryByRole('progressbar', { name: 'Loading 2 selected seasons' }),
    ).not.toBeInTheDocument(),
  );

  const refreshed2025 = deferred<InsightsResult>();
  const refreshed2024 = deferred<InsightsResult>();
  vi.mocked(publicFunctions.getPublicInsights).mockImplementation(({ data }) =>
    data.year === 2025 ? refreshed2025.promise : refreshed2024.promise,
  );
  await user.click(screen.getByRole('button', { name: 'Refresh selected seasons' }));

  const refreshProgress = await screen.findByRole('progressbar', {
    name: 'Refreshing 2 selected seasons',
  });
  expect(refreshProgress).toHaveAttribute('value', '0');
  expect(screen.getByText(/2 of 2 selected seasons loaded/)).toBeInTheDocument();

  refreshed2025.resolve(result());
  await waitFor(() => expect(refreshProgress).toHaveAttribute('value', '1'));
  refreshed2024.resolve(result());
  await waitFor(() => expect(refreshProgress).not.toBeInTheDocument());
});
test('history keeps a stale season available when its refresh fails', async () => {
  const user = userEvent.setup();
  await openPage('/shared/history?leagueId=123&years=%5B2024%5D');
  expect(await screen.findByText(/2024: last successfully refreshed/i)).toBeInTheDocument();

  vi.mocked(publicFunctions.getPublicInsights).mockResolvedValueOnce({
    ok: false,
    error: { status: 503, message: 'Provider timeout.' },
  });
  await user.click(screen.getByRole('button', { name: 'Refresh selected seasons' }));

  const partial = await screen.findByRole('alert');
  expect(partial).toHaveTextContent('2024: Provider timeout.');
  expect(partial).toHaveTextContent('This season remains visible using data last successfully');
  expect(screen.getByText(/1 of 1 selected seasons loaded/)).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Retry selected seasons' })).toBeEnabled(),
  );
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
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(1);
});
test('unknown shared links show a useful error without a login prompt', async () => {
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValue({
    ok: false,
    error: { status: 503, message: 'Private provider connection failed.' },
  });
  await openPage('/shared/history?leagueId=999');
  expect(await screen.findByRole('alert')).toHaveTextContent('League not found.');
  expect(document.title).toBe('Shared fantasy report | Fantasy Power Rankings');
  expect(document.head.textContent).not.toContain('Private provider connection failed.');
  expect(document.body.textContent).not.toContain('Private provider connection failed.');
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(1);
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
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValue({
    ok: true,
    data: { leagueId: id, leagueName: 'Sleeper league', leagueType: 0, seasonId: 2026 },
  });
  await openPage(`/shared/insights?leagueId=${id}&year=2025`);
  expect(
    await screen.findByRole('heading', { name: 'Who delivers every week?' }),
  ).toBeInTheDocument();
  expect(document.title).toBe('Sleeper league 2025 season insights | Fantasy Power Rankings');
  expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
    'content',
    'View 2025 season insights for Sleeper league.',
  );
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
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('link', { name: 'Rankings studio' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('link', { name: 'League history' }));
  await screen.findByRole('heading', { name: 'Track the manager, not the team name' });
  expect(router.state.location.pathname).toBe('/shared/history');
  expect(router.state.location.search.leagueId).toBe('123');
  expect(screen.queryByRole('link', { name: 'Rankings studio' })).not.toBeInTheDocument();
  expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
  expect(privateFunctions.listLeagues).not.toHaveBeenCalled();
  expect(privateFunctions.getEspnCredentialStatus).not.toHaveBeenCalled();
  expect(privateFunctions.getInsights).not.toHaveBeenCalled();
  expect(publicFunctions.getPublicInsights).toHaveBeenCalled();
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(1);
});

test('shared league cache checks revocation again after its freshness window', async () => {
  let now = Date.now();
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
  await openPage('/shared/insights?leagueId=123&year=2025');
  await screen.findByRole('heading', { name: 'Who delivers every week?' });
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(1);

  now += 300_001;
  vi.mocked(publicFunctions.getPublicLeague).mockResolvedValue({
    ok: false,
    error: { status: 404, message: 'Sharing disabled.' },
  });
  await userEvent.click(screen.getByRole('link', { name: 'League history' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('League not found.');
  expect(document.title).toBe('Shared fantasy report | Fantasy Power Rankings');
  expect(publicFunctions.getPublicLeague).toHaveBeenCalledTimes(2);
  clock.mockRestore();
});

test('first-login ESPN setup returns to the requested internal route after skipping', async () => {
  auth.isAuthenticated = true;
  vi.mocked(privateFunctions.getEspnCredentialStatus).mockResolvedValueOnce({
    ok: true,
    data: { configured: false, onboardingComplete: false },
  });
  const router = await openPage('/leagues/new');
  await screen.findByRole('heading', { name: 'Connect your ESPN account' });
  expect(screen.queryByRole('heading', { name: 'Create a league.' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
  await screen.findByRole('heading', { name: 'Create a league.' });
  expect(router.state.location.pathname).toBe('/leagues/new');
  expect(privateFunctions.skipEspnSetup).toHaveBeenCalledWith({
    headers: { Authorization: 'Bearer test-token' },
  });
});
