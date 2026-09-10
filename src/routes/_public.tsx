import { createFileRoute, Outlet } from '@tanstack/react-router';
import { InsightsAccess } from '../auth/InsightsAccess';
import { AppNavigation } from '../components/AppNavigation';
export const Route = createFileRoute('/_public')({
  component: () => (
    <InsightsAccess>
      <AppNavigation shared />
      <Outlet />
    </InsightsAccess>
  ),
});
