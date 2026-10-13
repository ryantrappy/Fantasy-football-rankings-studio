import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../../ui/provider';
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
    { wrapper: Provider },
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

it('locks the preview selection and consent while its snapshot request is pending', async () => {
  const user = userEvent.setup();
  let resolve!: (value: { publicId: string }) => void;
  const createReportSnapshot = vi.fn(
    () =>
      new Promise<{ publicId: string }>((done) => {
        resolve = done;
      }),
  );
  const previous = fixture();
  previous.year = 2024;
  render(
    <ApiContext.Provider value={{ createReportSnapshot } as never}>
      <Wrapped records={[fixture(), previous]} leagueId="123" />
    </ApiContext.Provider>,
    { wrapper: Provider },
  );
  await user.selectOptions(screen.getByLabelText('Wrapped manager'), 'a');
  await user.click(screen.getByLabelText('Publish this preview to anyone with its link'));
  await user.click(screen.getByRole('button', { name: 'Create public Wrapped snapshot' }));
  expect(screen.getByLabelText('Wrapped manager')).toBeDisabled();
  expect(screen.getByLabelText('Wrapped season')).toBeDisabled();
  expect(screen.getByLabelText('Publish this preview to anyone with its link')).toBeDisabled();
  await user.selectOptions(screen.getByLabelText('Wrapped manager'), 'b');
  await user.selectOptions(screen.getByLabelText('Wrapped season'), '2024');
  await user.click(screen.getByLabelText('Publish this preview to anyone with its link'));
  expect(screen.getByLabelText('Wrapped manager')).toHaveValue('a');
  expect(screen.getByLabelText('Wrapped season')).toHaveValue('2025');
  expect(screen.getByLabelText('Publish this preview to anyone with its link')).toBeChecked();
  resolve({ publicId: 'alex-2025' });
  expect(await screen.findByLabelText('Wrapped share link')).toHaveValue(
    'http://localhost:3000/shared/snapshots/alex-2025',
  );
  expect(screen.getByRole('heading', { name: "Alex's 2025 Fantasy Wrapped" })).toBeInTheDocument();
  expect(screen.getByLabelText('Wrapped manager')).toBeEnabled();
  await user.selectOptions(screen.getByLabelText('Wrapped manager'), 'b');
  expect(screen.queryByLabelText('Wrapped share link')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Publish this preview to anyone with its link')).not.toBeChecked();
});
