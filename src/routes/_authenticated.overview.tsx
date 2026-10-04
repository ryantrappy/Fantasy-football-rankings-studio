import { createFileRoute } from '@tanstack/react-router';
import { WeeklyOverviewPage } from '../components/WeeklyOverviewPage';
export const Route = createFileRoute('/_authenticated/overview')({ component: WeeklyOverviewPage });
