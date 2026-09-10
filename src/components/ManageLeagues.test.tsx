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
