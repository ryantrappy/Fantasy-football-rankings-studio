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
  useEffect(() => {
    const nav = navigation.current;
    const active = nav?.querySelector<HTMLElement>('a[data-status="active"]');
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
    <Flex
      ref={navigation}
      as="nav"
      gap={{ base: 4, md: 6 }}
      flexWrap="wrap"
      mb={8}
      borderBottom="1px solid"
      borderColor="border"
      className="app-nav"
      aria-label="Main navigation"
    >
      {!shared && (
        <ChakraLink asChild>
          <Link to="/" activeOptions={{ exact: true }}>
            <Icon name="edit" size={16} /> Rankings studio
          </Link>
        </ChakraLink>
      )}
      {!shared && (
        <ChakraLink asChild>
          <Link to="/players" search={{ leagueId, year: search.year }}>
            <Icon name="players" size={16} /> Players
          </Link>
        </ChakraLink>
      )}
      {!shared && (
        <ChakraLink asChild>
          <Link to="/trades">
            <Icon name="exchange" size={16} /> Trade analyzer
          </Link>
        </ChakraLink>
      )}
      {!shared && (
        <ChakraLink asChild>
          <Link to="/overview">
            <Icon name="grid" size={16} /> My weekly overview
          </Link>
        </ChakraLink>
      )}
      {!shared && (
        <ChakraLink asChild>
          <Link to="/live">
            <Icon name="ball" size={16} /> Live matchups
          </Link>
        </ChakraLink>
      )}
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/insights' : '/insights'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, year: search.year || defaultSeason() }}
        >
          <Icon name="chart" size={16} /> Season insights
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/playoffs' : '/playoffs'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, year: search.year || defaultSeason() }}
        >
          <Icon name="trophy" size={16} /> Playoff simulation
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/history' : '/history'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId }}
        >
          <Icon name="archive" size={16} /> League history
        </Link>
      </ChakraLink>
    </Flex>
  );
}
