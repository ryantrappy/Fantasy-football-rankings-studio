import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ManagerReportPage } from './ManagerReportPage';
vi.mock('../functions/manager-report.functions', () => ({ getKonzReport: vi.fn() }));
it('renders an anonymous report with honest empty-data states and no navigation', async () => {
  const load = vi
    .fn()
    .mockResolvedValue({
      generatedAt: '2026-09-09T00:00:00Z',
      seasons: [],
      errors: [{ year: 2025, message: 'Season unavailable.' }],
      attempted: 1,
    });
  render(
    <Provider>
      <ManagerReportPage load={load} />
    </Provider>,
  );
  expect(await screen.findByText('Season unavailable.', { exact: false })).toBeInTheDocument();
  expect(screen.getByText(/No completed scoring weeks yet/)).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
});
it('allows a failed report load to be retried', async () => {
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('Unavailable.'))
    .mockResolvedValue({
      generatedAt: '2026-09-09T00:00:00Z',
      seasons: [],
      errors: [],
      attempted: 1,
    });
  render(
    <Provider>
      <ManagerReportPage load={load} />
    </Provider>,
  );
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Retry report' }));
  await screen.findByText(/No completed scoring weeks yet/);
  expect(load).toHaveBeenCalledTimes(2);
});
