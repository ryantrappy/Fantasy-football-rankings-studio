import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { PlayoffPathsPage } from '../components/PlayoffPaths';
import { validateInsightsPageSearch } from '../components/report-search';
export const Route = createFileRoute('/_authenticated/playoff-paths')({
  validateSearch: validateInsightsPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: ({ context, deps }) => warmTab('insights', context, deps),
  component: () => (
    <PlayoffPathsPage search={Route.useSearch()} navigate={Route.useNavigate()} shared={false} />
  ),
});
