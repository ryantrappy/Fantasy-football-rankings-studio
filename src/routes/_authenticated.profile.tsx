import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { ProfilePage } from '../components/ProfilePage';
export const Route = createFileRoute('/_authenticated/profile')({
  component: () => <ProfilePage api={useApi()} />,
});
