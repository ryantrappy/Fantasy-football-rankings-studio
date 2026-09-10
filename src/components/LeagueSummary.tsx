import { SeasonAchievements } from './SeasonAchievements';
import { CalculationGuide } from './CalculationGuide';
import { DataTable } from './DataTable';
import { Box, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import {
  average,
  percentage,
  summarizeLeague,
  luckIndex,
  visibleManagers,
  type SeasonRecord,
} from '../league-summary';
const n = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const signed = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${n(value)}`;
export function LeagueSummary({
  records,
  historical = false,
  activeManagerKeys,
  includeFormer = false,
}: {
  records: SeasonRecord[];
  historical?: boolean;
  activeManagerKeys?: string[];
  includeFormer?: boolean;
}) {
  const rows = useMemo(() => {
    const all = summarizeLeague(records);
    return activeManagerKeys ? visibleManagers(all, activeManagerKeys, includeFormer) : all;
  }, [records, activeManagerKeys, includeFormer]);
  const trading = [...rows]
    .filter((r) => r.gradedTrades >= 3)
    .sort((a, b) => b.tradeGainTotal / b.gradedTrades - a.tradeGainTotal / a.gradedTrades)[0];
  const waivers = [...rows]
    .filter((r) => r.ratedPickups >= 5)
    .sort((a, b) => b.pickupLiftTotal / b.ratedPickups - a.pickupLiftTotal / a.ratedPickups)[0];
  const scoring = [...rows]
    .filter((r) => r.medianWeeks >= 4)
    .sort((a, b) => b.medianPercentTotal / b.medianWeeks - a.medianPercentTotal / a.medianWeeks)[0];
  return (
    <Box
      as="section"
      className="insight-section"
      aria-label={historical ? 'Long-term manager summary' : 'Season manager summary'}
    >
      <Text mb={4} className="eyebrow">
        {historical ? 'Across the selected seasons' : 'Season report card'}
      </Text>
      <Heading as="h2" size="xl" mb={4}>
        {historical ? 'Who keeps making the right moves?' : 'Who is winning the season?'}
      </Heading>
      <Text mb={4}>
        Trade and pickup averages reward the quality of each move, rather than simply making more
        moves. Sample sizes stay visible; leaders require 3 graded trades, 5 rated pickups, or 4
        scored weeks.
      </Text>
      <CalculationGuide />
      <SeasonAchievements rows={rows} />
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} my={6} className="insight-cards">
        <Box as="article">
          <Text mb={4} className="eyebrow">
            Trading leader
          </Text>
          <Heading as="h3" size="lg" mb={4}>
            {trading?.managerName || 'More graded trades needed'}
          </Heading>
          <Text mb={4}>
            {trading
              ? `${signed(average(trading.tradeGainTotal, trading.gradedTrades))} pts/week gained per trade · ${trading.gradedTrades} graded trades`
              : 'Individual results are listed below, including small samples.'}
          </Text>
        </Box>
        <Box as="article">
          <Text mb={4} className="eyebrow">
            Waiver-wire leader
          </Text>
          <Heading as="h3" size="lg" mb={4}>
            {waivers?.managerName || 'More rated pickups needed'}
          </Heading>
          <Text mb={4}>
            {waivers
              ? `${signed(average(waivers.pickupLiftTotal, waivers.ratedPickups))} pts/start lift per pickup · ${waivers.ratedPickups} rated`
              : 'At least five comparable pickups are required.'}
          </Text>
        </Box>
        <Box as="article">
          <Text mb={4} className="eyebrow">
            Above-median leader
          </Text>
          <Heading as="h3" size="lg" mb={4}>
            {scoring?.managerName || 'More scored weeks needed'}
          </Heading>
          <Text mb={4}>
            {scoring
              ? `${signed(average(scoring.medianPercentTotal, scoring.medianWeeks))}% average vs. weekly league median · ${scoring.medianWeeks} weeks`
              : 'At least four scored weeks are required.'}
          </Text>
        </Box>
      </SimpleGrid>
      <Box
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel"
      >
        <Heading as="h3" size="lg" mb={4}>
          Schedule luck index
        </Heading>
        <Text mb={4}>
          Positive means a favorable schedule; negative means an unfavorable one. Extra wins compare
          actual head-to-head results with expected wins from playing a random league opponent each
          week. The index is extra wins per game × 100, in percentage points. Ties count as half a
          win.
        </Text>
        <Box overflowX="auto" className="insight-table-wrap">
          <DataTable
            label="Schedule luck"
            data={rows}
            getRowId={(r) => r.key}
            initialSorting={[{ id: '1', desc: true }]}
            columns={[
              {
                id: '0',
                header: 'Manager',
                value: (r) => r.managerName,
                rowHeader: true,
                cell: (r) => <>{r.managerName}</>,
              },
              {
                id: '1',
                header: 'Luck index',
                value: (r) => luckIndex(r),
                cell: (r) => <>{signed(luckIndex(r))} pp</>,
              },
              {
                id: '2',
                header: 'Extra wins',
                value: (r) => (r.luckGames ? r.actualWins - r.expectedWins : null),
                cell: (r) => <>{signed(r.luckGames ? r.actualWins - r.expectedWins : null)}</>,
              },
              {
                id: '3',
                header: 'Actual wins',
                value: (r) => (r.luckGames ? r.actualWins : null),
                cell: (r) => <>{n(r.luckGames ? r.actualWins : null)}</>,
              },
              {
                id: '4',
                header: 'Expected wins',
                value: (r) => (r.luckGames ? r.expectedWins : null),
                cell: (r) => <>{n(r.luckGames ? r.expectedWins : null)}</>,
              },
              {
                id: '5',
                header: 'Games measured',
                value: (r) => r.luckGames,
                cell: (r) => (
                  <>
                    {r.luckGames}
                    {r.luckGames < 4 ? ' · small sample' : ''}
                  </>
                ),
              },
            ]}
          />
        </Box>
        <Text mb={4} className="insights-meta">
          Regular-season matchups with complete league scores only; byes, playoffs, and missing
          opponents are excluded. History weights every measured game equally. This measures
          schedule luck, not injuries or projection errors.
        </Text>
      </Box>
      <Box
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={4}
          className="insight-heading"
        >
          <Heading as="h3" size="lg" mb={4}>
            Manager scorecard
          </Heading>
        </Flex>
        <Box overflowX="auto" className="insight-table-wrap">
          <DataTable
            label="Manager scorecard"
            data={rows}
            getRowId={(r) => r.key}
            initialSorting={[{ id: '2', desc: true }]}
            columns={[
              {
                id: '0',
                header: 'Manager / latest team',
                value: (r) => r.managerName,
                rowHeader: true,
                cell: (r) => (
                  <>
                    {r.managerName}
                    <small>{r.teamName}</small>
                  </>
                ),
              },
              {
                id: '1',
                header: 'Seasons',
                value: (r) => r.seasons.length,
                cell: (r) => r.seasons.length,
              },
              { id: 'weeks', header: 'Weeks', value: (r) => r.weeks, cell: (r) => r.weeks },
              {
                id: '2',
                header: 'Avg. vs. median',
                value: (r) => average(r.medianPercentTotal, r.medianWeeks),
                cell: (r) => <>{signed(average(r.medianPercentTotal, r.medianWeeks))}%</>,
              },
              {
                id: '3',
                header: 'Above median',
                value: (r) => percentage(r.aboveMedian, r.weeks),
                cell: (r) => (
                  <>
                    {r.aboveMedian} / {r.weeks}
                  </>
                ),
              },
              {
                id: '4',
                header: 'All-play win rate',
                value: (r) => percentage(r.allPlayWins, r.allPlayGames),
                cell: (r) => <>{n(percentage(r.allPlayWins, r.allPlayGames))}%</>,
              },
              {
                id: '5',
                header: 'Trade gain / trade',
                value: (r) => average(r.tradeGainTotal, r.gradedTrades),
                cell: (r) => (
                  <>
                    {signed(average(r.tradeGainTotal, r.gradedTrades))}
                    <small>
                      {r.gradedTrades} / {r.trades} graded
                      {r.gradedTrades < 3 ? ' · small sample' : ''}
                    </small>
                  </>
                ),
              },
              {
                id: '6',
                header: 'Trade wins',
                value: (r) => r.tradeWins,
                cell: (r) => r.tradeWins,
              },
              {
                id: 'tradeLosses',
                header: 'Trade losses',
                value: (r) => r.tradeLosses,
                cell: (r) => r.tradeLosses,
              },
              {
                id: 'tradeTies',
                header: 'Close trades',
                value: (r) => r.tradeTies,
                cell: (r) => r.tradeTies,
              },
              {
                id: '7',
                header: 'Pickup lift / pickup',
                value: (r) => average(r.pickupLiftTotal, r.ratedPickups),
                cell: (r) => (
                  <>
                    {signed(average(r.pickupLiftTotal, r.ratedPickups))}
                    <small>
                      {r.ratedPickups} / {r.pickups} rated
                      {r.ratedPickups < 5 ? ' · small sample' : ''}
                    </small>
                  </>
                ),
              },
              {
                id: '8',
                header: 'Pickup hit rate',
                value: (r) => percentage(r.pickupHits, r.ratedPickups),
                cell: (r) => (
                  <>
                    {n(percentage(r.pickupHits, r.ratedPickups))}%
                    <small>
                      {r.pickupHits} / {r.ratedPickups} positive
                    </small>
                  </>
                ),
              },
            ]}
          />
        </Box>
        {!rows.length && <Text mb={4}>No manager results loaded yet.</Text>}
        <details>
          <summary>Scoring records and measured pickup impact</summary>
          <Box overflowX="auto" className="insight-table-wrap">
            <DataTable
              label="Scoring records and pickup impact"
              data={rows}
              getRowId={(r) => r.key}
              columns={[
                {
                  id: '0',
                  header: 'Manager',
                  value: (r) => r.managerName,
                  rowHeader: true,
                  cell: (r) => <>{r.managerName}</>,
                },
                {
                  id: '1',
                  header: 'Avg. weekly points',
                  value: (r) => average(r.totalPoints, r.weeks),
                  cell: (r) => <>{n(average(r.totalPoints, r.weeks))}</>,
                },
                {
                  id: '2',
                  header: 'Best week vs. median',
                  value: (r) => r.bestWeek?.vsMedian,
                  cell: (r) => (
                    <>
                      {r.bestWeek
                        ? `${r.bestWeek.year} W${r.bestWeek.week}: ${n(r.bestWeek.points)} pts (${signed(r.bestWeek.vsMedian)}%)`
                        : '—'}
                    </>
                  ),
                },
                {
                  id: '3',
                  header: 'Measured pickup surplus',
                  value: (r) => (r.ratedPickups ? r.measuredSurplus : null),
                  cell: (r) => <>{signed(r.ratedPickups ? r.measuredSurplus : null)} pts</>,
                },
              ]}
            />
          </Box>
        </details>
        <Text mb={4} className="insights-meta">
          Trade gain averages each graded trade’s positional-adjusted points/week gain. Pickup lift
          averages each rated pickup’s points/start lift against its displayed dropped-player or
          positional baseline. Measured surplus sums that lift over evaluated starts, not the whole
          season. Close trades are separate; ungraded moves do not count as losses. All-play
          compares each score with every other team that week; ties count half. Median percentages
          normalize within each season’s scoring rules; weeks with a nonpositive median are omitted
          from that percentage.
        </Text>
      </Box>
    </Box>
  );
}
