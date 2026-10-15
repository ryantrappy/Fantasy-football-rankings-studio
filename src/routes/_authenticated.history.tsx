import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { HistoryPage } from '../components/HistoryPage';
import { validateHistoryPageSearch } from '../components/report-search';
export const Route = createFileRoute('/_authenticated/history')({
  validateSearch: validateHistoryPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, years: search.years }),
  loader: ({ context, deps, preload }) => {
    // A pending intent preload must not hold navigation behind the entire history.
    // The page renders bounded, progressive reads using the same session cache.
    if (preload) void warmTab('history', context, deps);
  },
  component: () => (
    <HistoryPage search={Route.useSearch()} navigate={Route.useNavigate()} shared={false} />
  ),
});
