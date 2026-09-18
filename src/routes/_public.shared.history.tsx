import { createFileRoute } from '@tanstack/react-router';
import { HistoryPage } from '../components/HistoryPage';
import { validateHistoryPageSearch } from '../components/report-search';
import { loadSharedReportPreview, sharedReportMeta } from '../shared-report-meta';
export const Route = createFileRoute('/_public/shared/history')({
  validateSearch: validateHistoryPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, years: search.years }),
  loader: ({ context, deps }) =>
    loadSharedReportPreview(
      context.publicInsightsApi,
      deps.leagueId,
      deps.years?.length ? `${deps.years.join(', ')} league history` : 'league history',
    ),
  head: ({ loaderData }) => ({ meta: sharedReportMeta(loaderData?.preview) }),
  component: SharedHistoryPage,
});

function SharedHistoryPage() {
  return (
    <HistoryPage
      search={Route.useSearch()}
      navigate={Route.useNavigate()}
      initialLeague={Route.useLoaderData().league}
      shared
    />
  );
}
