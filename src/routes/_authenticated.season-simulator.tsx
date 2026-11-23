import { createFileRoute } from '@tanstack/react-router';
import { SeasonBootstrapPage } from '../components/SeasonBootstrapPage';
import { validateStudioSearch } from '../studio-selection';

export const Route = createFileRoute('/_authenticated/season-simulator')({
  validateSearch: ({ leagueId, year }: Record<string, unknown>) => {
    const context = validateStudioSearch({ leagueId, year });
    return { leagueId: context.leagueId, year: context.year };
  },
  component: () => {
    const navigate = Route.useNavigate();
    return (
      <SeasonBootstrapPage
        search={Route.useSearch()}
        select={({ leagueId, year }) => void navigate({ search: { leagueId, year } })}
      />
    );
  },
});
