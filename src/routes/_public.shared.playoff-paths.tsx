import { WorkspacePreloader } from '../components/WorkspacePreloader';
import { warmReport } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { PlayoffPathsPage } from '../components/PlayoffPaths';
import { validateInsightsPageSearch } from '../components/report-search';
import { loadSharedReportPreview, sharedReportMeta } from '../shared-report-meta';
export const Route = createFileRoute('/_public/shared/playoff-paths')({
  validateSearch: validateInsightsPageSearch,
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: async ({ context, deps, preload }) => {
    const preview = await loadSharedReportPreview(
      context.publicInsightsApi,
      deps.leagueId,
      `${deps.year} path to the playoffs`,
    );
    if (preload && preview.league)
      await warmReport(context.publicInsightsApi, deps).catch(() => {});
    return preview;
  },
  head: ({ loaderData }) => ({ meta: sharedReportMeta(loaderData?.preview) }),
  component: SharedPlayoffPathsPage,
});

function SharedPlayoffPathsPage() {
  return (
    <>
      {Route.useLoaderData().league && <WorkspacePreloader shared />}
      <PlayoffPathsPage
        search={Route.useSearch()}
        navigate={Route.useNavigate()}
        initialLeague={Route.useLoaderData().league}
        shared
      />
    </>
  );
}
