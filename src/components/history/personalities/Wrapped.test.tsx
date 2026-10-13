import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiContext } from '../../../auth/session';
import { fixture } from '../../../history/personalities/activity.test';
import { Wrapped, WrappedPreview } from './Wrapped';
import { buildWrapped } from '../../../history/personalities/wrapped';
it('selects manager, previews cards and requires intentional publish with no raw history', async () => {
  const createReportSnapshot = vi.fn().mockResolvedValue({ publicId: 'saved' });
  render(
    <ApiContext.Provider value={{ createReportSnapshot } as never}>
      <Wrapped records={[fixture()]} leagueId="123" />
    </ApiContext.Provider>,
  );
  fireEvent.change(screen.getByLabelText('Wrapped manager'), { target: { value: 'a' } });
  expect(screen.getByRole('heading', { name: "Alex's 2025 Fantasy Wrapped" })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create public Wrapped snapshot' })).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Publish this preview to anyone with its link'));
  fireEvent.click(screen.getByRole('button', { name: 'Create public Wrapped snapshot' }));
  await waitFor(() => expect(createReportSnapshot).toHaveBeenCalled());
  expect(createReportSnapshot.mock.calls[0][0]).toMatchObject({
    records: [],
    activeManagerKeys: [],
    view: 'wrapped',
    wrapped: { scope: 'personal', year: 2025 },
  });
  expect(await screen.findByLabelText('Wrapped share link')).toHaveValue(
    'http://localhost:3000/shared/snapshots/saved',
  );
});
it('renders responsive share preview and coverage disclosure', () => {
  render(<WrappedPreview recap={buildWrapped(fixture())} />);
  expect(screen.getByRole('article', { name: 'Wrapped share preview' })).toHaveStyle({
    width: '100%',
    boxSizing: 'border-box',
  });
  expect(screen.getByText('Coverage and methods')).toBeInTheDocument();
});
