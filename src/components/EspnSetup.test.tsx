import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { EspnSetup } from './EspnSetup';
import type { EspnCredentialsApi } from '../espn-credentials';
const incomplete = { configured: false, onboardingComplete: false };
const saved = { configured: true, onboardingComplete: true };
const skipped = { configured: false, onboardingComplete: true };
const makeApi = (): EspnCredentialsApi => ({
  getEspnCredentialStatus: vi.fn().mockResolvedValue(incomplete),
  saveEspnCredentials: vi.fn().mockResolvedValue(saved),
  removeEspnCredentials: vi.fn().mockResolvedValue(skipped),
  skipEspnSetup: vi.fn().mockResolvedValue(skipped),
});
it('offers setup after first login, permits skipping, and does not recheck on rerender', async () => {
  const api = makeApi();
  const view = render(
    <Provider>
      <EspnSetup api={api}>
        <p>Requested destination</p>
      </EspnSetup>
    </Provider>,
  );
  expect(
    await screen.findByRole('heading', { name: 'Connect your ESPN account' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Requested destination')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
  expect(await screen.findByText('Requested destination')).toBeInTheDocument();
  view.rerender(
    <Provider>
      <EspnSetup api={api}>
        <p>Another tab</p>
      </EspnSetup>
    </Provider>,
  );
  expect(screen.getByText('Another tab')).toBeInTheDocument();
  expect(api.getEspnCredentialStatus).toHaveBeenCalledTimes(1);
  expect(api.skipEspnSetup).toHaveBeenCalledTimes(1);
});
it('saves password fields, clears their values, and supports removal in settings', async () => {
  const api = makeApi();
  render(
    <Provider>
      <EspnSetup api={api} settings />
    </Provider>,
  );
  const s2 = await screen.findByLabelText(/espn_s2/);
  const swid = screen.getByLabelText(/SWID/);
  expect(s2).toHaveAttribute('type', 'password');
  fireEvent.change(s2, { target: { value: 'my-cookie' } });
  fireEvent.change(swid, { target: { value: '{12345678-1234-1234-1234-123456789abc}' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save ESPN credentials' }));
  await screen.findByText('ESPN credentials saved.');
  expect(api.saveEspnCredentials).toHaveBeenCalledWith({
    espnS2: 'my-cookie',
    swid: '{12345678-1234-1234-1234-123456789abc}',
  });
  expect(s2).toHaveValue('');
  expect(swid).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Remove credentials' }));
  await screen.findByText('ESPN credentials removed.');
  expect(api.removeEspnCredentials).toHaveBeenCalledTimes(1);
});
it('shows save failures and allows retry without discarding typed values', async () => {
  const api = makeApi();
  vi.mocked(api.saveEspnCredentials).mockRejectedValueOnce(new Error('Storage unavailable.'));
  render(
    <Provider>
      <EspnSetup api={api} settings />
    </Provider>,
  );
  const s2 = await screen.findByLabelText(/espn_s2/);
  fireEvent.change(s2, { target: { value: 'cookie' } });
  fireEvent.change(screen.getByLabelText(/SWID/), { target: { value: 'swid' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save ESPN credentials' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable.');
  expect(s2).toHaveValue('cookie');
  fireEvent.click(screen.getByRole('button', { name: 'Save ESPN credentials' }));
  await screen.findByText('ESPN credentials saved.');
});
it('hides one user’s status when the session API changes', async () => {
  const first = makeApi(),
    second = makeApi();
  vi.mocked(first.getEspnCredentialStatus).mockResolvedValue(saved);
  const view = render(
    <Provider>
      <EspnSetup api={first}>
        <p>Private page</p>
      </EspnSetup>
    </Provider>,
  );
  await screen.findByText('Private page');
  view.rerender(
    <Provider>
      <EspnSetup api={second}>
        <p>Private page</p>
      </EspnSetup>
    </Provider>,
  );
  expect(screen.queryByText('Private page')).not.toBeInTheDocument();
  await screen.findByRole('button', { name: 'Skip for now' });
  await waitFor(() => expect(second.getEspnCredentialStatus).toHaveBeenCalledTimes(1));
});
