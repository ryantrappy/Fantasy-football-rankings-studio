import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { LiveMatchupsPage } from '../components/LiveMatchupsPage';
import { validateStudioSearch } from '../studio-selection';

export const Route = createFileRoute('/_authenticated/live')({
  validateSearch: validateStudioSearch,
  loader: ({ context }) => warmTab('live', context),
  component: () => {
    const search = Route.useSearch();
    return <LiveMatchupsPage key={`${search.leagueId}:${search.year}`} search={search} />;
  },
});
