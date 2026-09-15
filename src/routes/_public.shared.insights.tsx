import { createFileRoute } from '@tanstack/react-router';
import { InsightsPage } from '../components/InsightsPage';
import { validateInsightsPageSearch } from '../components/report-search';
import { loadSharedReportPreview, sharedReportMeta } from '../shared-report-meta';
export const Route = createFileRoute('/_public/shared/insights')({
  validateSearch: validateInsightsPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: ({ context, deps }) =>
    loadSharedReportPreview(
      context.publicInsightsApi,
      deps.leagueId,
      `${deps.year} season insights`,
    ),
  head: ({ loaderData }) => ({ meta: sharedReportMeta(loaderData?.preview) }),
  component: SharedInsightsPage,
});

function SharedInsightsPage() {
  return (
    <InsightsPage
      search={Route.useSearch()}
      navigate={Route.useNavigate()}
      initialLeague={Route.useLoaderData().league}
      shared
    />
  );
}
