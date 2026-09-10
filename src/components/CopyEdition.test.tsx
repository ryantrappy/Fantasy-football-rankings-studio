import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from './ui/provider';
import { CopyEdition } from './CopyEdition';
import { copyEdition } from '../copy-edition';
import type { WeeklyRanking } from '../types';
const dest = {
  leagueId: '1',
  year: 2026,
  week: 2,
  rankingsTitle: 'Current',
  introduction: 'Keep intro',
  teams: [
    { teamId: 'a', teamName: 'Renamed', description: 'Keep', position: 1 },
    { teamId: 'b', teamName: 'New team', description: 'Stay', position: 2 },
  ],
} as WeeklyRanking;
const source = {
  ...dest,
  week: 1,
  rankingsTitle: 'Previous',
  introduction: 'Copy intro',
  teams: [
    { ...dest.teams[0], teamName: 'Old name', description: 'Old comment' },
    { teamId: 'gone', description: 'Skip' },
  ],
} as WeeklyRanking;
it('preserves destination identities and unmatched teams without mutating source', () => {
  const result = copyEdition(dest, source, { introduction: true, commentary: true, order: true });
  expect(result.teams.map((t) => t.teamId)).toEqual(['a', 'b']);
  expect(result.teams[0]).toMatchObject({ teamName: 'Renamed', description: 'Old comment' });
  expect(result.teams[1].description).toBe('Stay');
  expect(dest.introduction).toBe('Keep intro');
  expect(source.teams[0].teamName).toBe('Old name');
});
it('requires review and explicit confirmation before copying', () => {
  const onCopy = vi.fn();
  render(
    <Provider>
      <CopyEdition ranking={dest} history={[source]} disabled={false} onCopy={onCopy} />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Copy from a previous edition'));
  fireEvent.change(screen.getByLabelText('Source edition'), { target: { value: '2026:1' } });
  fireEvent.click(screen.getByLabelText('Copy introduction'));
  fireEvent.click(screen.getByRole('button', { name: 'Review copy' }));
  expect(onCopy).not.toHaveBeenCalled();
  expect(screen.getByText(/1 source teams/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm copy' }));
  expect(onCopy.mock.calls[0][0].introduction).toBe('Copy intro');
});
