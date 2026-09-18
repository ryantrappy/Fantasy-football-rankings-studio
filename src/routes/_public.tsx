import { createFileRoute, Outlet } from '@tanstack/react-router';
import { InsightsAccess } from '../auth/InsightsAccess';
import { AppNavigation } from '../components/AppNavigation';
export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  const { publicInsightsApi } = Route.useRouteContext();
  return (
    <InsightsAccess publicApi={publicInsightsApi}>
      <AppNavigation shared />
      <Outlet />
    </InsightsAccess>
  );
}
