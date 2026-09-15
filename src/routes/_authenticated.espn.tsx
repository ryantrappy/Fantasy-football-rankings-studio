import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { EspnSetup } from '../components/EspnSetup';
export const Route = createFileRoute('/_authenticated/espn')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo === '/leagues/new' ? ('/leagues/new' as const) : undefined,
  }),
  component: EspnSettingsPage,
});

function EspnSettingsPage() {
  const api = useApi();
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  return (
    <EspnSetup
      api={api}
      settings
      onComplete={returnTo ? () => void navigate({ to: returnTo }) : undefined}
    />
  );
}
