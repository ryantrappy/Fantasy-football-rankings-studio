import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { TradeAnalyzerPage } from '../components/TradeAnalyzerPage';
import { validateStudioSearch } from '../studio-selection';
export const Route = createFileRoute('/_authenticated/trades')({
  validateSearch: validateStudioSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: ({ context, deps }) => warmTab('trades', context, deps),
  component: () => {
    const search = Route.useSearch();
    return <TradeAnalyzerPage key={`${search.leagueId}:${search.year}`} search={search} />;
  },
});
