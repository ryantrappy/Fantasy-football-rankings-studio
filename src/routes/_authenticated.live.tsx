import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { LiveMatchupsPage } from '../components/LiveMatchupsPage';

export const Route = createFileRoute('/_authenticated/live')({
  loader: ({ context }) => warmTab('live', context),
  component: LiveMatchupsPage,
});
