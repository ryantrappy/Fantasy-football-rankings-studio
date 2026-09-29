import { createFileRoute } from '@tanstack/react-router';
import { LiveMatchupsPage } from '../components/LiveMatchupsPage';

export const Route = createFileRoute('/_authenticated/live')({
  component: LiveMatchupsPage,
});
