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
const page = (years?: number[], leagueId = '123') => (
  <ChakraProvider value={defaultSystem}>
    <HistoryPage search={{ leagueId, years }} navigate={navigate} />
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

it('defaults private History to every available season, including the active season, with bounded progress', async () => {
  const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
  api.getLeagueSeasons.mockResolvedValue({ years, activeManagerKeys: [], activeSeason: 2026 });
  const pending = new Map(years.map((year) => [year, pendingReport()]));
  api.getInsights.mockImplementation((_league: string, year: number) => pending.get(year)!.promise);
  render(page());
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(3));
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual(years.slice(0, 3));
  expect(screen.getByRole('progressbar')).toHaveAttribute('max', '7');
  fireEvent.click(screen.getByText('Seasons to compare'));
  expect(screen.getAllByRole('checkbox')).toHaveLength(7);
  screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).toBeChecked());
  await act(async () => {
    years.slice(0, 3).forEach((year) => pending.get(year)!.resolve(report()));
  });
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(6));
  await act(async () => {
    years.slice(3, 6).forEach((year) => pending.get(year)!.resolve(report()));
  });
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(7));
  await act(async () => pending.get(2020)!.resolve(report()));
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem').map((row) => row.textContent?.slice(0, 4))).toEqual(
    years.map(String),
  );
});
it('preserves explicit years and explicit empty selection instead of replacing them with the catalogue', async () => {
  api.getInsights.mockResolvedValue(report());
  const view = render(page([2024, 2022]));
  await screen.findByRole('list', { name: 'Loaded reports' });
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual([2024, 2022]);
  view.rerender(page([]));
  expect(screen.getByText('Select at least one season to compare.')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Loaded reports' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh selected seasons' })).toBeDisabled();
  await act(async () => {});
  expect(api.getInsights).toHaveBeenCalledTimes(2);
});
it('offers separate all-season and all-prior-season selections without changing the current explicit input', async () => {
  const years = [2026, 2025, 2024, 2023];
  api.getLeagueSeasons.mockResolvedValue({ years, activeManagerKeys: [], activeSeason: 2026 });
  api.getInsights.mockResolvedValue(report());
  render(page([2024]));
  await screen.findByRole('list', { name: 'Loaded reports' });
  fireEvent.click(screen.getByText('Seasons to compare'));
  fireEvent.click(screen.getByRole('button', { name: 'Select all seasons' }));
  expect(navigate).toHaveBeenLastCalledWith({ search: { leagueId: '123', years } });
  fireEvent.click(screen.getByRole('button', { name: 'Select all prior seasons' }));
  expect(navigate).toHaveBeenLastCalledWith({
    search: { leagueId: '123', years: [2025, 2024, 2023] },
  });
  expect(api.getInsights).toHaveBeenCalledTimes(1);
});
it('retains shared defaults and exact snapshot season inputs', async () => {
  api.getInsights.mockResolvedValue(report());
  const league = { leagueId: '123', leagueName: 'League', leagueType: 0 as const, seasonId: 2026 };
  const view = render(
    <ChakraProvider value={defaultSystem}>
      <HistoryPage search={{ leagueId: '123' }} navigate={navigate} initialLeague={league} shared />
    </ChakraProvider>,
  );
  await screen.findByRole('list', { name: 'Loaded reports' });
  expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual([2024, 2023, 2022]);
  api.getInsights.mockClear();
  view.rerender(
    <ChakraProvider value={defaultSystem}>
      <HistoryPage
        search={{ leagueId: '123', years: [2021] }}
        navigate={navigate}
        initialLeague={league}
        shared
        snapshot={{ href: '/shared/snapshot/example', years: [2021], openSeason: vi.fn() }}
      />
    </ChakraProvider>,
  );
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledWith('123', 2021, false));
  expect(api.getInsights).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Refresh selected seasons' })).toBeDisabled();
  expect(api.listLeagues).not.toHaveBeenCalled();
});
it('stops old all-season queue and ignores late reports after changing leagues', async () => {
  const old = pendingReport(),
    next = pendingReport();
  api.listLeagues.mockResolvedValue([
    { leagueId: '123', leagueName: 'Old league' },
    { leagueId: '456', leagueName: 'New league' },
  ]);
  api.getLeagueSeasons.mockImplementation(async (id: string) => ({
    years: id === '123' ? [2026, 2025, 2024, 2023, 2022] : [2020],
    activeManagerKeys: [],
    activeSeason: id === '123' ? 2026 : 2020,
  }));
  api.getInsights.mockImplementation((id: string) => (id === '123' ? old.promise : next.promise));
  const view = render(page());
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledTimes(3));
  view.rerender(page(undefined, '456'));
  await waitFor(() => expect(api.getInsights).toHaveBeenCalledWith('456', 2020, false));
  await act(async () => old.resolve(report('Old account/league snapshot')));
  expect(api.getInsights).toHaveBeenCalledTimes(4);
  expect(screen.queryByText(/Old account\/league snapshot/)).not.toBeInTheDocument();
  await act(async () => next.resolve(report('New league snapshot')));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('listitem')).toHaveTextContent('2020: New league snapshot');
});

it.each([{ years: undefined }, { years: [] }, { years: [2020] }])(
  'preserves requested years $years when automatically resolving the first league',
  async ({ years }) => {
    api.getInsights.mockResolvedValue(report());
    const view = render(page(years, ''));
    const search = { leagueId: '123', ...(years !== undefined ? { years } : {}) };
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ search, replace: true }));
    expect(api.getInsights).not.toHaveBeenCalled();
    view.rerender(page(search.years, search.leagueId));
    if (years?.length === 0) {
      await screen.findByText('Select at least one season to compare.');
      expect(api.getInsights).not.toHaveBeenCalled();
    } else {
      await screen.findByRole('list', { name: 'Loaded reports' });
      expect(api.getInsights.mock.calls.map((call) => call[1])).toEqual(
        years ?? [2024, 2023, 2022, 2021, 2020],
      );
    }
  },
);
