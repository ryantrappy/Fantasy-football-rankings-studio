import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { RevisionHistory } from './RevisionHistory';
import type { WeeklyRanking } from '../types';
it('previews historic content before restoring it', async () => {
  const ranking = { _id: 'id', revision: 2 } as WeeklyRanking;
  const old = {
    ...ranking,
    revision: 1,
    rankingsTitle: 'Old title',
    introduction: 'Old intro',
    teams: [{ teamId: '1', position: 1, teamName: 'Team', description: 'Old commentary' }],
  } as WeeklyRanking;
  const api = {
    list: vi.fn().mockResolvedValue([{ savedAt: '2026-01-01', ranking: old }]),
    restore: vi.fn().mockResolvedValue({ ...old, revision: 3 }),
  };
  const onRestored = vi.fn();
  render(
    <Provider>
      <RevisionHistory api={api} ranking={ranking} disabled={false} onRestored={onRestored} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'View saved revisions' }));
  await screen.findByText('Old commentary');
  expect(api.restore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Restore selected revision' }));
  await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
  expect(api.restore).toHaveBeenCalledWith('id', 1, 2);
});

it('pages older snapshots without accumulating full history in memory', async () => {
  const ranking = { _id: 'id', revision: 30 } as WeeklyRanking;
  const entry = (revision: number) => ({
    savedAt: '',
    ranking: {
      ...ranking,
      revision,
      rankingsTitle: `Revision ${revision}`,
      teams: [],
      introduction: '',
    },
  });
  const api = {
    list: vi
      .fn()
      .mockResolvedValueOnce([entry(30), entry(29), entry(20)])
      .mockResolvedValueOnce([entry(19), entry(10)]),
    restore: vi.fn(),
  };
  render(
    <Provider>
      <RevisionHistory api={api} ranking={ranking} disabled={false} onRestored={() => {}} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'View saved revisions' }));
  await screen.findByRole('option', { name: /Revision 20/ });
  fireEvent.click(screen.getByRole('button', { name: 'Older revisions' }));
  await screen.findByRole('option', { name: /Revision 19/ });
  expect(api.list).toHaveBeenLastCalledWith('id', 20);
  expect(screen.queryByRole('option', { name: /Revision 30/ })).not.toBeInTheDocument();
});
