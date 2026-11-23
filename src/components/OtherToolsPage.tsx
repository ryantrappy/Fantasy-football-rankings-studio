import { Link, useSearch } from '@tanstack/react-router';
import { PageHeading } from './PageHeading';
import { Icon } from './Icon';
import { defaultSeason } from '../util/rankings';

const tabs = [
  { path: '/tools', label: 'All tools' },
  { path: '/players', label: 'Players' },
  { path: '/trades', label: 'Trade analyzer' },
  { path: '/season-simulator', label: 'Season simulator' },
] as const;

export const isOtherToolsPath = (pathname: string) => tabs.some(({ path }) => path === pathname);

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
        <span aria-current="page">{tabs.find(({ path }) => path === pathname)?.label}</span>
      </nav>
      <nav className="explorer-subtool-pills" aria-label="Other tools quick switcher">
        {tabs.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            search={context}
            className="explorer-subtool-pill"
            aria-current={pathname === path ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
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
        description="Inspect player evidence, build a trade, or simulate a season with current rosters."
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
        <Link to="/season-simulator" search={context} className="explorer-tool-link">
          <Icon name="chart" size={24} />
          <h2>Season simulator</h2>
          <p>
            Resample player scores to explore win totals, finishes, and the impact of a roster
            change.
          </p>
        </Link>
      </div>
    </>
  );
}
