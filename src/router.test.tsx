import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { getRouter } from './router';
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
}));
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
  useAuth0: () => auth,
}));
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  auth.isAuthenticated = false;
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
    <Authentication>
      <div>Private rankings</div>
    </Authentication>,
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
