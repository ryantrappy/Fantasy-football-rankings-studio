import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { HistoryPage } from './HistoryPage';
import type { SeasonRecord } from '../league-summary';
import { calculateInsights } from '../server/insights/calculate';

const { api } = vi.hoisted(() => ({
  api: { listLeagues: vi.fn(), getInsights: vi.fn(), getLeagueSeasons: vi.fn() },
}));
vi.mock('../auth/InsightsAccess', () => ({ useInsightsApi: () => api }));
vi.mock('../logging', () => ({ logClientError: vi.fn() }));
vi.mock('./AppShell', () => ({
  HeaderControls: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./ShareReport', () => ({ ShareReport: () => null }));
vi.mock('./LeagueSummary', () => ({ LeagueSummary: () => null }));
vi.mock('./ManagerComparison', () => ({ ManagerComparison: () => null }));
vi.mock('./DataTable', () => ({
  DataTable: () => null,
  ReportExportScope: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./history/HistoryAnalytics', () => ({
  HistoryAnalytics: ({ records }: { records: SeasonRecord[] }) => (
    <ol aria-label="Loaded reports">
      {records.map(({ year, data }) => (
        <li key={year}>
          {year}: {data.generatedAt}
        </li>
      ))}
    </ol>
  ),
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const report = (generatedAt = '2026-10-01T12:00:00Z') => ({
  ...calculateInsights({
    completedWeek: 14,
    teams: [],
    scores: [],
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  }),
  generatedAt,
});
const navigate = vi.fn();
const page = (years: number[]) => (
  <ChakraProvider value={defaultSystem}>
    <HistoryPage search={{ leagueId: '123', years }} navigate={navigate} />
  </ChakraProvider>
);
function pendingReport() {
  let resolve!: (value: ReturnType<typeof report>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<ReturnType<typeof report>>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listLeagues.mockResolvedValue([{ leagueId: '123', leagueName: 'League' }]);
  api.getLeagueSeasons.mockResolvedValue({
    years: [2024, 2023, 2022, 2021, 2020],
    activeManagerKeys: [],
    activeSeason: 2024,
  });
});

it('loads at most three seasons concurrently and publishes ordered reports as each settles', async () => {
  const years = [2024, 2023, 2022, 2021];
  const pending = new Map(years.map((year) => [year, pendingReport()]));
  api.getInsights.mockImplementation((_league: string, year: number) => pending.get(year)!.promise);
  render(page(years));
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(3));
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual(years.slice(0, 3));
  await act(async () => pending.get(2023)!.resolve(report()));
  expect(api.getInsights).toHaveBeenCalledTimes(4);
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1');
  expect(screen.getByRole('list', { name: 'Loaded reports' })).toHaveTextContent('2023:');
  await act(async () => pending.get(2024)!.reject(new Error('Provider unavailable')));
  expect(screen.getByRole('alert')).toHaveTextContent('2024: Provider unavailable');
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '2');
  await act(async () => {
    pending.get(2021)!.resolve(report());
    pending.get(2022)!.resolve(report());
  });
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem').map((row) => row.textContent?.slice(0, 4))).toEqual([
    '2023',
    '2022',
    '2021',
  ]);
  expect(screen.getByRole('alert')).toHaveTextContent('this season is excluded from every section');
});

it('keeps prior reports visible during refresh and retains a season whose refresh fails', async () => {
  api.getInsights.mockResolvedValue(report());
  render(page([2024, 2023]));
  await screen.findByRole('list', { name: 'Loaded reports' });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Refresh selected seasons' })).toBeEnabled(),
  );
  const refreshed = pendingReport();
  const failed = pendingReport();
  api.getInsights.mockImplementation((_league: string, year: number) =>
    year === 2024 ? refreshed.promise : failed.promise,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh selected seasons' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(api.getInsights).toHaveBeenLastCalledWith('123', 2023, true);
  await act(async () => {
    refreshed.resolve(report('2026-10-13T12:00:00Z'));
    failed.reject(new Error('Refresh failed'));
  });
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
    '2024: 2026-10-13T12:00:00Z',
    '2023: 2026-10-01T12:00:00Z',
  ]);
  expect(screen.getByRole('alert')).toHaveTextContent('This season remains visible using data');
});

it('stops queued seasons and ignores in-flight results when the selection changes', async () => {
  const oldReport = pendingReport();
  const newReport = pendingReport();
  api.getInsights.mockImplementation((_league: string, year: number) =>
    year === 2020 ? newReport.promise : oldReport.promise,
  );
  const view = render(page([2024, 2023, 2022, 2021]));
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(3));
  view.rerender(page([2020]));
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledWith('123', 2020, false));
  await act(async () => oldReport.resolve(report()));
  expect(api.getInsights).toHaveBeenCalledTimes(4);
  expect(screen.queryByRole('list', { name: 'Loaded reports' })).not.toBeInTheDocument();
  await act(async () => newReport.resolve(report()));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('listitem')).toHaveTextContent('2020:');
});
