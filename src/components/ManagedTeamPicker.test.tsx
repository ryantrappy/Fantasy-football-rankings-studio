import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ManagedTeamPicker } from './ManagedTeamPicker';
it('reopens the chosen season and persisted team after refresh without carrying it into another account', async () => {
  const browserStorage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => browserStorage.get(key) ?? null,
      setItem: (key: string, value: string) => browserStorage.set(key, value),
    },
  });
  const saved = new Map<number, string>();
  const teams = [{ teamId: '1', teamName: 'My team', managerName: 'Owner' }];
  const api = {
    get: vi.fn(async (_id: string, year: number) => ({
      teams,
      teamId: saved.get(year) ?? null,
      needsReselection: false,
    })),
    set: vi.fn(async (_id: string, year: number, teamId: string | null) => {
      if (teamId) saved.set(year, teamId);
      return { teams, teamId, needsReselection: false };
    }),
  };
  const first = render(
    <Provider>
      <ManagedTeamPicker subject="refresh-test-owner" api={api} leagueId="10" initialYear={2025} />
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText('My team season'), { target: { value: '2026' } });
  fireEvent.change(await screen.findByLabelText('My managed team'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByText('Your managed team was saved.');
  first.unmount();
  const next = render(
    <Provider>
      <ManagedTeamPicker subject="refresh-test-owner" api={api} leagueId="10" initialYear={2025} />
    </Provider>,
  );
  expect(screen.getByLabelText('My team season')).toHaveValue(2026);
  expect(await screen.findByLabelText('My managed team')).toHaveValue('1');
  next.unmount();
  render(
    <Provider>
      <ManagedTeamPicker subject="different-owner" api={api} leagueId="10" initialYear={2025} />
    </Provider>,
  );
  expect(screen.getByLabelText('My team season')).toHaveValue(2025);
  expect(await screen.findByLabelText('My managed team')).toHaveValue('');
});
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
it('shows unsaved changes and preserves the choice for retry after a save failure', async () => {
  const teams = [{ teamId: '1', teamName: 'My team', managerName: 'Owner' }];
  const api = {
    get: vi.fn().mockResolvedValue({ teams, teamId: null, needsReselection: false }),
    set: vi
      .fn()
      .mockRejectedValueOnce(new Error('Provider is unavailable.'))
      .mockResolvedValue({ teams, teamId: '1', needsReselection: false }),
  };
  render(
    <Provider>
      <ManagedTeamPicker api={api} leagueId="10" initialYear={2026} />
    </Provider>,
  );
  fireEvent.change(await screen.findByLabelText('My managed team'), { target: { value: '1' } });
  expect(screen.getByText(/Unsaved team choice/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByText(/Provider is unavailable/);
  expect(screen.getByLabelText('My managed team')).toHaveValue('1');
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByText('Your managed team was saved.');
  expect(screen.queryByText(/Unsaved team choice/)).not.toBeInTheDocument();
});
