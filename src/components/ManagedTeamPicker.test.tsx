import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ManagedTeamPicker } from './ManagedTeamPicker';
it('loads the saved team, saves commissioner mode, and requests season-specific choices', async () => {
  const teams = [{ teamId: '1', teamName: 'My team', managerName: 'Owner' }];
  const api = {
    get: vi.fn(async () => ({ teams, teamId: '1', needsReselection: false })),
    set: vi.fn(async () => ({ teams, teamId: null, needsReselection: false })),
  };
  render(
    <Provider>
      <ManagedTeamPicker api={api} leagueId="10" initialYear={2026} />
    </Provider>,
  );
  expect(await screen.findByLabelText('My managed team')).toHaveValue('1');
  fireEvent.change(screen.getByLabelText('My managed team'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByText('Commissioner mode saved.');
  expect(api.set).toHaveBeenCalledWith('10', 2026, null);
  fireEvent.change(screen.getByLabelText('My team season'), { target: { value: '2025' } });
  await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('10', 2025));
});
it('shows reselection and a retry after provider failure', async () => {
  const api = {
    get: vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ teams: [], teamId: null, needsReselection: true }),
    set: vi.fn(),
  };
  render(
    <Provider>
      <ManagedTeamPicker api={api} leagueId="10" initialYear={2026} />
    </Provider>,
  );
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Reload teams' }));
  await screen.findByText(/Choose your team again/);
});
