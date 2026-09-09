import { Box, Button, Flex, Link, Text } from '@chakra-ui/react';
import { CreateLeague } from '../../src/components/CreateLeague';
import { LeagueSummary } from '../../src/components/LeagueSummary';
import { api } from './fixture';

// Exercise the same asChild composition used by the router's Create league link.
export function PalettePreview() {
  return (
    <>
      <Flex
        as="header"
        className="site-header"
        bg="fg"
        color="white"
        p={6}
        mb={6}
        justify="space-between"
      >
        <Link href="#" color="white">
          POWER / RANK
        </Link>
        <Text>Fantasy Power Rankings</Text>
      </Flex>
      <Button asChild colorPalette="indigo">
        <a href="?mode=create">Create league</a>
      </Button>
      <CreateLeague api={api} onCreated={() => {}} onCancel={() => {}} />
      <LeagueSummary records={[]} />
      <Box className="notice error" role="alert">
        We couldn’t load this season. Try again.
      </Box>
      <Box className="notice insights-notice">Only completed weeks are included.</Box>
      <Text className="chart-legend">
        <span>● Actual points</span>
        <span>┄ Lineup projection</span>
      </Text>
    </>
  );
}
