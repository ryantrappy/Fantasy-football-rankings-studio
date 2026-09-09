import { Flex, Link as ChakraLink } from '@chakra-ui/react';
import { Link, useSearch } from '@tanstack/react-router';
import { defaultSeason } from '../util/rankings';
export function AppNavigation({ shared = false }: { shared?: boolean }) {
  const search = useSearch({ strict: false });
  const leagueId = search.leagueId || '';
  return (
    <Flex
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
            Rankings studio
          </Link>
        </ChakraLink>
      )}
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/insights' : '/insights'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId, year: defaultSeason() }}
        >
          Season insights
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link
          to={shared ? '/shared/history' : '/history'}
          activeOptions={{ includeSearch: false }}
          search={{ leagueId }}
        >
          League history
        </Link>
      </ChakraLink>
    </Flex>
  );
}
