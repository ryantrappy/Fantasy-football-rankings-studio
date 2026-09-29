import { createFileRoute, Outlet } from '@tanstack/react-router';
import { InsightsAccess } from '../auth/InsightsAccess';
import { AppShell } from '../components/AppShell';
export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  const { publicInsightsApi } = Route.useRouteContext();
  return (
    <InsightsAccess publicApi={publicInsightsApi}>
      <AppShell shared>
        <Outlet />
      </AppShell>
    </InsightsAccess>
  );
}
