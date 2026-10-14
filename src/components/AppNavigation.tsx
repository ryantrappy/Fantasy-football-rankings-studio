import { Flex, Link as ChakraLink } from '@chakra-ui/react';
import { Link, useRouterState, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { defaultSeason } from '../util/rankings';
import { Icon } from './Icon';

export function AppNavigation({ shared = false }: { shared?: boolean }) {
  const search = useSearch({ strict: false });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigation = useRef<HTMLDivElement>(null);
  const leagueId = search.leagueId || '';
  const year = search.year || search.years?.[0] || defaultSeason();
  const toolsActive = ['/tools', '/players', '/trades'].includes(pathname);
  useEffect(() => {
    const nav = navigation.current;
    const active = nav?.querySelector<HTMLElement>(
      'a[data-status="active"], a[aria-current="page"]',
    );
    if (!nav || !active) return;
    const keepActiveVisible = () => {
      const bounds = nav.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.right > bounds.right) nav.scrollLeft += tab.right - bounds.right + 12;
      else if (tab.left < bounds.left) nav.scrollLeft += tab.left - bounds.left - 12;
    };
    keepActiveVisible();
    window.addEventListener('resize', keepActiveVisible);
    return () => window.removeEventListener('resize', keepActiveVisible);
  }, [pathname]);
  return (
    <Flex ref={navigation} as="nav" className="app-nav" aria-label="Main navigation">
      {!shared && (
        <>
          <ChakraLink asChild>
            <Link
              to="/"
              search={{
                leagueId: search.leagueId || undefined,
                year: search.year || search.years?.[0],
                week: search.week,
              }}
              activeOptions={{ exact: true }}
            >
              <Icon name="edit" size={16} /> Rankings studio
            </Link>
          </ChakraLink>
          <ChakraLink asChild>
            <Link to="/overview">
              <Icon name="grid" size={16} /> Weekly overview
            </Link>
          </ChakraLink>
          <ChakraLink asChild>
            <Link to="/live">
              <Icon name="ball" size={16} /> Live matchups
            </Link>
          </ChakraLink>
        </>
      )}
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/insights' : '/insights'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, year }}
        >
          <Icon name="chart" size={16} /> Season insights
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/playoffs' : '/playoffs'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, year }}
        >
          <Icon name="trophy" size={16} /> Playoff simulator
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/history' : '/history'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, years: search.years || (search.year ? [search.year] : undefined) }}
        >
          <Icon name="archive" size={16} /> League history
        </Link>
      </ChakraLink>
      {!shared && (
        <ChakraLink asChild>
          <Link
            to="/tools"
            search={{ leagueId, year }}
            aria-current={toolsActive ? 'page' : undefined}
          >
            <Icon name="players" size={16} /> Other tools
          </Link>
        </ChakraLink>
      )}
    </Flex>
  );
}
