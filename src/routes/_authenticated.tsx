import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { defaultSeason } from '../util/rankings';
import { Authentication } from '../auth/Authentication';

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <Authentication>
      <nav className="app-nav" aria-label="Main navigation">
        <Link to="/" activeOptions={{ exact: true }}>
          Rankings studio
        </Link>
        <Link
          to="/insights"
          activeOptions={{ includeSearch: false }}
          search={{ leagueId: '', year: defaultSeason() }}
        >
          Season insights
        </Link>
        <Link to="/history" activeOptions={{ includeSearch: false }} search={{ leagueId: '' }}>
          League history
        </Link>
      </nav>
      <Outlet />
    </Authentication>
  ),
});
