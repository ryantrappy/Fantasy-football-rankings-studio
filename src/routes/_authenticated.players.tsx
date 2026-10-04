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
  component: () => {
    const search = Route.useSearch();
    return (
      <PlayerProfilesPage
        key={`${search.leagueId}:${search.year}:${search.playerId}`}
        search={search}
      />
    );
  },
});
