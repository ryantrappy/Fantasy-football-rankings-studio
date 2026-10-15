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
    const navigate = Route.useNavigate();
    return (
      <TradeAnalyzerPage
        search={search}
        onContextChange={(context) => {
          if (context.leagueId !== search.leagueId || context.year !== search.year) {
            void navigate({ search: context, replace: true });
          }
        }}
      />
    );
  },
});
