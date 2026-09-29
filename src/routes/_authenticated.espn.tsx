import { createFileRoute, Navigate } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/espn')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo === '/leagues/new' ? ('/leagues/new' as const) : undefined,
  }),
  component: EspnSettingsPage,
});

function EspnSettingsPage() {
  const { returnTo } = Route.useSearch();
  return <Navigate to="/profile" search={{ returnTo }} replace />;
}
