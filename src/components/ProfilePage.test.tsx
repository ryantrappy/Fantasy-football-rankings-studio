import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ProfilePage } from './ProfilePage';
import type { ProfileApi } from '../profile';
const profile = {
  userId: 'auth0|owner',
  name: 'Owner',
  nickname: 'owner',
  email: 'owner@example.com',
  emailVerified: true,
};
const makeApi = (): ProfileApi => ({
  getProfile: vi.fn().mockResolvedValue(profile),
  updateProfile: vi.fn().mockResolvedValue({ ...profile, name: 'New name' }),
});
it('displays account identity and persists edited profile fields', async () => {
  const api = makeApi();
  render(
    <Provider>
      <ProfilePage api={api} />
    </Provider>,
  );
  fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: 'New name' } });
  expect(screen.getByText(/owner@example.com \(verified\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await screen.findByText('Profile saved.');
  expect(api.updateProfile).toHaveBeenCalledWith({ name: 'New name', nickname: 'owner' });
});
it('preserves the draft on save failure and allows retry', async () => {
  const api = makeApi();
  vi.mocked(api.updateProfile).mockRejectedValueOnce(new Error('Try again.'));
  render(
    <Provider>
      <ProfilePage api={api} />
    </Provider>,
  );
  const name = await screen.findByLabelText(/^Name/);
  fireEvent.change(name, { target: { value: 'New name' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Try again.');
  expect(name).toHaveValue('New name');
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await screen.findByText('Profile saved.');
});
it('retries a failed load and hides old account data when the session changes', async () => {
  const api = makeApi();
  vi.mocked(api.getProfile).mockRejectedValueOnce(new Error('Unavailable.'));
  const view = render(
    <Provider>
      <ProfilePage api={api} />
    </Provider>,
  );
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByLabelText(/^Name/);
  const next = makeApi();
  vi.mocked(next.getProfile).mockImplementation(() => new Promise(() => {}));
  view.rerender(
    <Provider>
      <ProfilePage api={next} />
    </Provider>,
  );
  expect(screen.queryByDisplayValue('Owner')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Loading');
});
