import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { ManageLeagues } from '../components/ManageLeagues';
export const Route = createFileRoute('/_authenticated/leagues/manage')({
  component: () => <ManageLeagues api={useApi()} />,
});
