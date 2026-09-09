import { createFileRoute } from '@tanstack/react-router';
import { useApi } from '../auth/session';
import { EspnSetup } from '../components/EspnSetup';
export const Route = createFileRoute('/_authenticated/espn')({
  component: () => <EspnSetup api={useApi()} settings />,
});
