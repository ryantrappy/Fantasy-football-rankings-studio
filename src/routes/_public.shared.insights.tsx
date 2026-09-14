import { createFileRoute } from '@tanstack/react-router';
import { InsightsPage } from '../components/InsightsPage';
import { validateInsightsPageSearch } from '../components/report-search';
import { loadSharedReportPreview, sharedReportMeta } from '../shared-report-meta';
export const Route = createFileRoute('/_public/shared/insights')({
  validateSearch: validateInsightsPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: ({ deps }) => loadSharedReportPreview(deps.leagueId, `${deps.year} season insights`),
  head: ({ loaderData }) => ({ meta: sharedReportMeta(loaderData) }),
  component: () => (
    <InsightsPage search={Route.useSearch()} navigate={Route.useNavigate()} shared={true} />
  ),
});
