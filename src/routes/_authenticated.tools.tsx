import { createFileRoute } from '@tanstack/react-router';
import { OtherToolsPage } from '../components/OtherToolsPage';
import { validateInsightsPageSearch } from '../components/report-search';

export const Route = createFileRoute('/_authenticated/tools')({
  validateSearch: validateInsightsPageSearch,
  component: OtherToolsPage,
});
