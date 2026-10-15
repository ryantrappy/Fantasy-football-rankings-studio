import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { PlayerProfilesPage } from '../components/PlayerProfilesPage';
import { validateStudioSearch } from '../studio-selection';
export const Route = createFileRoute('/_authenticated/players')({
  validateSearch: (input: Record<string, unknown>) => ({
    ...validateStudioSearch(input),
    ...(typeof input.playerId === 'string' && /^[a-z\d:_-]{1,100}$/i.test(input.playerId)
      ? { playerId: input.playerId }
      : {}),
  }),
  loaderDeps: ({ search }) => ({ leagueId: search.leagueId, year: search.year }),
  loader: ({ context, deps }) => warmTab('players', context, deps),
  component: () => {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <PlayerProfilesPage
        search={search}
        onContextChange={(context) => {
          if (context.leagueId !== search.leagueId || context.year !== search.year) {
            void navigate({ search: context, replace: true });
          }
        }}
      />
    );
  },
});
