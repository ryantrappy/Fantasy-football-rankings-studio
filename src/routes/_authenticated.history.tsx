import { createFileRoute } from '@tanstack/react-router';
import { HistoryPage } from '../components/HistoryPage';
import { validateHistoryPageSearch } from '../components/report-search';
export const Route = createFileRoute('/_authenticated/history')({
  validateSearch: validateHistoryPageSearch,
  component: () => (
    <HistoryPage search={Route.useSearch()} navigate={Route.useNavigate()} shared={false} />
  ),
});
