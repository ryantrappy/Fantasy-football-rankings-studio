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
      updateProviderId: vi.fn(),
      delete: vi.fn(),
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
      updateProviderId: vi.fn(),
      delete: vi.fn(),
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

it('validates a provider ID and requires the exact name before permanent deletion', async () => {
  const league = {
    leagueId: '1',
    providerLeagueId: '99',
    leagueName: 'Provider name',
    leagueType: 0,
    seasonId: 2026,
  };
  const api = {
    listLeagues: vi.fn(async () => [league]),
    management: {
      archived: vi.fn(async () => []),
      archive: vi.fn(),
      rename: vi.fn(),
      updateProviderId: vi.fn(async (_id: string, providerLeagueId: string) => ({
        ...league,
        providerLeagueId,
      })),
      delete: vi.fn(),
    },
  } as unknown as LeagueApi;
  render(
    <Provider>
      <ManageLeagues api={api} />
    </Provider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Edit provider league ID' }));
  fireEvent.change(screen.getByLabelText('Provider league ID'), {
    target: { value: 'not-a-number' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save provider league ID' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('valid numeric provider league ID');
  fireEvent.change(screen.getByLabelText('Provider league ID'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save provider league ID' }));
  expect(api.management!.updateProviderId).toHaveBeenCalledWith('1', '123');
  await screen.findByText('Provider name now uses provider league ID 123.');
  fireEvent.click(await screen.findByRole('button', { name: 'Delete league' }));
  fireEvent.change(await screen.findByLabelText('Type Provider name to confirm'), {
    target: { value: 'wrong' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Delete league permanently' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Type Provider name to confirm deletion',
  );
  expect(api.management!.delete).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Type Provider name to confirm'), {
    target: { value: 'Provider name' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Delete league permanently' }));
  expect(api.management!.delete).toHaveBeenCalledWith('1');
});
