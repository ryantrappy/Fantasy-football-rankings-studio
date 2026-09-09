import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { CreateLeague } from '../components/CreateLeague';

export const Route = createFileRoute('/_authenticated/leagues/new')({ component: NewLeaguePage });

function NewLeaguePage() {
  const api = useApi();
  const navigate = Route.useNavigate();
  return (
    <CreateLeague
      api={api}
      onCreated={() => void navigate({ to: '/' })}
      onCancel={() => void navigate({ to: '/' })}
    />
  );
}
