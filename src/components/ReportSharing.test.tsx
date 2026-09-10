import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ReportSharing } from './ReportSharing';
it('shows and updates the owner sharing state', async () => {
  const api = { get: vi.fn().mockResolvedValue(true), set: vi.fn().mockResolvedValue(false) };
  render(
    <Provider>
      <ReportSharing api={api} leagueId="123" />
    </Provider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Disable public reports' }));
  await screen.findByText('Public season and history reports are disabled.');
  expect(api.set).toHaveBeenCalledWith('123', false);
});
