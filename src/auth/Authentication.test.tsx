import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Authentication } from './Authentication';
import { Provider } from '../components/ui/provider';
const mocks = vi.hoisted(() => ({ login: vi.fn(), dispose: vi.fn(), loading: false }));
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: ReactNode }) => children,
  useAuth0: () => ({
    isLoading: mocks.loading,
    isAuthenticated: false,
    loginWithRedirect: mocks.login,
    getAccessTokenSilently: vi.fn(),
    logout: vi.fn(),
  }),
}));
vi.mock('@tanstack/react-router', () => ({
  ClientOnly: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ navigate: vi.fn() }),
}));
vi.mock('../api/client', () => ({
  createApi: () => ({ dispose: mocks.dispose }),
  errorMessage: (e: Error) => e.message,
}));
vi.mock('../logging', () => ({ logClientError: vi.fn() }));
beforeEach(() => {
  mocks.login.mockReset();
  mocks.dispose.mockResolvedValue(undefined);
  mocks.loading = false;
  vi.stubEnv('VITE_AUTH0_DOMAIN', 'example.auth0.com');
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', 'test-client');
  vi.stubEnv('VITE_AUTH0_AUDIENCE', 'test-audience');
});
afterEach(() => vi.unstubAllEnvs());
it('keeps the return path and shows a busy sign-in action with a retry after failure', async () => {
  mocks.login
    .mockRejectedValueOnce(new Error('Could not open sign-in.'))
    .mockResolvedValueOnce(undefined);
  render(
    <Provider>
      <Authentication>
        <div>Private content</div>
      </Authentication>
    </Provider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Know your team.');
  expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(mocks.login).toHaveBeenCalledWith({
    appState: { returnTo: window.location.pathname + window.location.search },
  });
  await screen.findByRole('alert');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(mocks.login).toHaveBeenCalledTimes(2));
});
it('presents loading and configuration failures without exposing private content', () => {
  mocks.loading = true;
  const view = render(
    <Provider>
      <Authentication>
        <div>Private content</div>
      </Authentication>
    </Provider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Loading your session');
  expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  mocks.loading = false;
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', '');
  view.rerender(
    <Provider>
      <Authentication>
        <div>Private content</div>
      </Authentication>
    </Provider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Sign-in is not configured');
  expect(screen.queryByText('Private content')).not.toBeInTheDocument();
});
