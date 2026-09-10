import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from '../components/ui/provider';
import { PasswordReset } from './PasswordReset';
const login = vi.hoisted(() => vi.fn());
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ loginWithRedirect: login }) }));
vi.mock('../logging', () => ({ logClientError: vi.fn() }));
beforeEach(() => {
  login.mockReset();
});
it('forces the hosted login form and preserves the return path', async () => {
  let resolve!: () => void;
  login.mockImplementation(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  render(
    <Provider>
      <PasswordReset />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reset password through Auth0' }));
  expect(login).toHaveBeenCalledWith({
    authorizationParams: { prompt: 'login', screen_hint: 'login' },
    appState: { returnTo: window.location.pathname + window.location.search },
  });
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByText(/For Google or another provider/)).toBeInTheDocument();
  resolve();
  await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
});
it('shows a safe error and permits retry when redirect fails', async () => {
  login.mockRejectedValueOnce(new Error('internal auth details')).mockResolvedValueOnce(undefined);
  render(
    <Provider>
      <PasswordReset />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please try again');
  expect(screen.queryByText(/internal auth details/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
