import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ShareReport } from './ShareReport';
import { ApiContext } from '../auth/session';
import type { createApi } from '../api/client';
import type { SnapshotInput } from '../report-snapshot';

const input: SnapshotInput = {
  leagueId: '123',
  view: 'history',
  records: [],
  activeSeason: 2026,
  activeManagerKeys: [],
};
afterEach(() => vi.restoreAllMocks());
it('saves displayed ESPN records before copying a snapshot URL and offers fallback when clipboard fails', async () => {
  const createReportSnapshot = vi
    .fn()
    .mockResolvedValue({ publicId: 'saved-id', savedAt: '2026-09-15T00:00:00Z' });
  const copy = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <Provider>
      <ApiContext.Provider
        value={{ createReportSnapshot } as unknown as ReturnType<typeof createApi>}
      >
        <ShareReport
          path="/history"
          search={{ leagueId: '123', years: [2025] }}
          espn
          snapshotData={input}
        />
      </ApiContext.Provider>
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
  const link = await screen.findByRole('textbox', { name: 'Share link' });
  expect(link).toHaveValue(`${window.location.origin}/shared/snapshots/saved-id`);
  expect(createReportSnapshot).toHaveBeenCalledWith(input);
  expect(copy).toHaveBeenCalledWith(`${window.location.origin}/shared/snapshots/saved-id`);
  expect(screen.getByText(/expire after 10 days/)).toBeInTheDocument();
});

it('does not copy a live ESPN link when saving fails and permits retry', async () => {
  const createReportSnapshot = vi
    .fn()
    .mockRejectedValue(new Error('Enable public report sharing before creating a snapshot.'));
  const copy = vi.fn();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <Provider>
      <ApiContext.Provider
        value={{ createReportSnapshot } as unknown as ReturnType<typeof createApi>}
      >
        <ShareReport path="/history" search={{ leagueId: '123' }} espn snapshotData={input} />
      </ApiContext.Provider>
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Enable public report sharing');
  expect(copy).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Copy share link' })).toBeEnabled(),
  );
});

it('keeps snapshot caveats and owner revocation reachable in the compact sharing menu', async () => {
  const reportSharing = {
    get: vi.fn().mockResolvedValue(true),
    set: vi.fn().mockResolvedValue(false),
  };
  render(
    <Provider>
      <ApiContext.Provider
        value={
          { createReportSnapshot: vi.fn(), reportSharing } as unknown as ReturnType<
            typeof createApi
          >
        }
      >
        <ShareReport
          compact
          path="/history"
          search={{ leagueId: '123' }}
          espn
          snapshotData={input}
        />
      </ApiContext.Provider>
    </Provider>,
  );
  const summary = screen.getByText('Share report', { exact: true });
  expect(summary).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(summary);
  await screen.findByRole('button', { name: 'Disable public reports' });
  await waitFor(() =>
    expect(screen.getByText(/including private ESPN data.*expire after 10 days/)).toBeVisible(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Disable public reports' }));
  await waitFor(() => expect(reportSharing.set).toHaveBeenCalledWith('123', false));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Enable public reports' })).toBeVisible(),
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(summary).toHaveAttribute('aria-expanded', 'false');
  expect(summary).toHaveFocus();
});
