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
