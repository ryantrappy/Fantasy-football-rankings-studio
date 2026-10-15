import { Link, useSearch } from '@tanstack/react-router';
import { PageHeading } from './PageHeading';
import { Icon } from './Icon';
import { defaultSeason } from '../util/rankings';

export function ToolsBreadcrumb({ pathname }: { pathname: string }) {
  const search = useSearch({ strict: false });
  const context = { leagueId: search.leagueId || '', year: search.year || defaultSeason() };
  return (
    <div className="explorer-subtool-bar">
      <nav className="explorer-breadcrumb" aria-label="Breadcrumb">
        <Link to="/tools" search={context}>
          Other tools
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">
          {pathname === '/tools'
            ? 'All tools'
            : pathname === '/players'
              ? 'Players'
              : 'Trade analyzer'}
        </span>
      </nav>
      <nav className="explorer-subtool-pills" aria-label="Other tools quick switcher">
        <Link
          to="/tools"
          search={context}
          className="explorer-subtool-pill"
          aria-current={pathname === '/tools' ? 'page' : undefined}
        >
          All tools
        </Link>
        <Link
          to="/players"
          search={context}
          className="explorer-subtool-pill"
          aria-current={pathname === '/players' ? 'page' : undefined}
        >
          Players
        </Link>
        <Link
          to="/trades"
          search={context}
          className="explorer-subtool-pill"
          aria-current={pathname === '/trades' ? 'page' : undefined}
        >
          Trade analyzer
        </Link>
      </nav>
    </div>
  );
}

export function OtherToolsPage() {
  const search = useSearch({ strict: false });
  const context = { leagueId: search.leagueId || '', year: search.year };
  return (
    <>
      <PageHeading
        title="Other tools"
        eyebrow="Player research and decisions"
        description="Inspect player evidence or build a trade with both managers’ lineups in view."
      />
      <div className="explorer-tools-grid">
        <Link to="/players" search={context} className="explorer-tool-link">
          <Icon name="players" size={24} />
          <h2>Players</h2>
          <p>
            Search rosters, inspect scoring and projection sources, and compare players over the
            same weeks.
          </p>
        </Link>
        <Link to="/trades" search={context} className="explorer-tool-link">
          <Icon name="exchange" size={24} />
          <h2>Trade analyzer</h2>
          <p>Compare lineup impact for both teams and turn trade ideas into editable scenarios.</p>
        </Link>
      </div>
    </>
  );
}
