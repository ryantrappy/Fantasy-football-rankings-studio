import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { WeeklyOverviewPage } from '../components/WeeklyOverviewPage';
export const Route = createFileRoute('/_authenticated/overview')({
  loader: ({ context }) => warmTab('overview', context),
  component: WeeklyOverviewPage,
});
