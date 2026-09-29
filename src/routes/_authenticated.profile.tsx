import { EspnSetup } from '../components/EspnSetup';
import { PasswordReset } from '../auth/PasswordReset';
import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { ProfilePage } from '../components/ProfilePage';
export const Route = createFileRoute('/_authenticated/profile')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo === '/leagues/new' ? ('/leagues/new' as const) : undefined,
  }),
  component: ProfileSettings,
});

function ProfileSettings() {
  const api = useApi();
  const navigate = Route.useNavigate();
  const { returnTo } = Route.useSearch();
  return (
    <>
      <ProfilePage api={api} />
      <section className="profile-espn-settings" aria-label="ESPN settings">
        <EspnSetup
          api={api}
          settings
          onComplete={returnTo ? () => void navigate({ to: returnTo }) : undefined}
        />
      </section>
      <PasswordReset />
    </>
  );
}
