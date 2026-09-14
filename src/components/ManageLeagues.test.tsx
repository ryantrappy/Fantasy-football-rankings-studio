import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ManageLeagues } from './ManageLeagues';
import type { LeagueApi } from '../types';
it('archives and restores leagues through the management view', async () => {
  const league = { leagueId: '1', leagueName: 'My league', leagueType: 0, seasonId: 2026 };
  let archived = false;
  const api = {
    listLeagues: vi.fn(async () => (archived ? [] : [league])),
    management: {
      archived: vi.fn(async () => (archived ? [league] : [])),
      archive: vi.fn(async (_id: string, value: boolean) => {
        archived = value;
      }),
      rename: vi.fn(),
    },
  } as unknown as LeagueApi;
  render(
    <Provider>
      <ManageLeagues api={api} />
    </Provider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Archive league' }));
  await screen.findByText('No active leagues.');
  fireEvent.click(screen.getByRole('button', { name: 'Show archived leagues' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Restore league' }));
  await screen.findByText('No archived leagues.');
  expect(api.management!.archive).toHaveBeenLastCalledWith('1', false);
});
it('validates, cancels, and saves a local display-name edit', async () => {
  const league = { leagueId: '1', leagueName: 'Provider name', leagueType: 0, seasonId: 2026 };
  const api = {
    listLeagues: vi.fn(async () => [league]),
    management: {
      archived: vi.fn(async () => []),
      archive: vi.fn(),
      rename: vi.fn(async (_id: string, leagueName: string) => ({ ...league, leagueName })),
    },
  } as unknown as LeagueApi;
  render(
    <Provider>
      <ManageLeagues api={api} />
    </Provider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Edit display name' }));
  const input = screen.getByLabelText('Display name');
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save display name' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter a league display name.');
  fireEvent.change(input, { target: { value: 'x'.repeat(121) } });
  fireEvent.click(screen.getByRole('button', { name: 'Save display name' }));
  expect(screen.getByRole('alert')).toHaveTextContent('at most 120 characters');
  expect(api.management!.rename).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel rename' }));
  expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Provider name' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Edit display name' }));
  fireEvent.change(screen.getByLabelText('Display name'), {
    target: { value: '  Writers league  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save display name' }));
  expect(await screen.findByRole('heading', { name: 'Writers league' })).toBeInTheDocument();
  expect(api.management!.rename).toHaveBeenCalledWith('1', 'Writers league');
});
