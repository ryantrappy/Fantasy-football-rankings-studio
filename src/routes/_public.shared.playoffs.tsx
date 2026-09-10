import { createFileRoute } from '@tanstack/react-router';
import { InsightsPage } from '../components/InsightsPage';
import { validateInsightsPageSearch } from '../components/report-search';
export const Route = createFileRoute('/_public/shared/playoffs')({
  validateSearch: validateInsightsPageSearch,
  component: () => (
    <InsightsPage playoff search={Route.useSearch()} navigate={Route.useNavigate()} shared={true} />
  ),
});
