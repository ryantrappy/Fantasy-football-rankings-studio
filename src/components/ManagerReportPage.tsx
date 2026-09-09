import { Box, Button, Heading, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { ManagerReport } from '../manager-report';
import { getKonzReport } from '../functions/manager-report.functions';
import { logClientError } from '../logging';
const n = (value: number | null) => (value === null ? '—' : value.toFixed(1));
async function readReport() {
  const result = await getKonzReport();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export function ManagerReportPage({ load = readReport }: { load?: () => Promise<ManagerReport> }) {
  const [data, setData] = useState<ManagerReport>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void load().then(
      (result) => {
        if (!cancelled) setData(result);
      },
      (error) => {
        logClientError('managerReport.load', error);
        if (!cancelled) setError(error instanceof Error ? error.message : 'Report unavailable.');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, retry]);
  const measured = data?.seasons.filter((s) => s.weeks > 0) || [];
  return (
    <Stack gap={8} maxW="6xl" mx="auto">
      <Box as="header" p={{ base: 5, md: 10 }} bg="fg" color="white" rounded="xl">
        <Text textTransform="uppercase" letterSpacing="wide">
          The hindsight department
        </Text>
        <Heading as="h1" size={{ base: '3xl', md: '5xl' }} my={4}>
          konz4: the receipts
        </Heading>
        <Text fontSize="lg">A fantasy-football roast, backed by the box scores.</Text>
        <Text mt={3}>
          Bad weeks. Regrettable moves. Picks that aged poorly. A deliberately critical look at the
          available league record—not a complete verdict on the manager.
        </Text>
      </Box>
      {!data && !error && (
        <Text as="output">
          Building the report from linked Sleeper seasons. The first load can take a minute…
        </Text>
      )}
      {error && (
        <Box role="alert">
          <Text>{error}</Text>
          <Button
            onClick={() => {
              setError('');
              setRetry((v) => v + 1);
            }}
          >
            Retry report
          </Button>
        </Box>
      )}
      {data && (
        <>
          <Text>
            {data.seasons.length} / {data.attempted} seasons loaded · Updated{' '}
            {new Date(data.generatedAt).toLocaleString()} · Cached for up to 15 minutes
          </Text>
          {data.errors.map((e) => (
            <Text key={e.year} role="alert">
              {e.year}: {e.message}
            </Text>
          ))}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {[
              [
                'Weeks below the median',
                measured.reduce((s, r) => s + r.belowMedian, 0),
                `${measured.reduce((s, r) => s + r.weeks, 0)} observed weeks`,
              ],
              [
                'Negative graded trades',
                measured.reduce((s, r) => s + r.trades.length, 0),
                `${measured.reduce((s, r) => s + r.gradedTrades, 0)} graded trades`,
              ],
              [
                'Negative pickup lifts',
                measured.reduce((s, r) => s + r.pickups.length, 0),
                `${measured.reduce((s, r) => s + r.ratedPickups, 0)} rated pickups`,
              ],
            ].map(([label, value, note]) => (
              <Box key={label} p={5} bg="bg" borderWidth="1px" rounded="lg">
                <Text>{label}</Text>
                <Text fontSize="4xl" fontWeight="bold">
                  {value}
                </Text>
                <Text>{note}</Text>
              </Box>
            ))}
          </SimpleGrid>
          {!measured.length && (
            <Text>No completed scoring weeks yet. There are no results to roast.</Text>
          )}
          {data.seasons.map((season) => (
            <Box
              as="section"
              key={season.year}
              bg="bg"
              p={{ base: 4, md: 7 }}
              borderWidth="1px"
              rounded="lg"
            >
              <Heading as="h2" size="2xl">
                {season.year}: {season.teamName}
              </Heading>
              <Link
                href={`https://sleeper.com/leagues/${season.leagueId}`}
                target="_blank"
                rel="noreferrer"
              >
                View source league on Sleeper
              </Link>
              <Text my={4}>
                {season.weeks} observed weeks · {season.belowMedian} below median ·{' '}
                {n(season.allPlay)}% all-play wins · {n(season.vsMedian)}% average vs. median ·
                Final finish: {n(season.finish)} · Playoffs:{' '}
                {season.playoff === null ? 'Unknown' : season.playoff ? 'Yes' : 'Missed'}
              </Text>
              <Text>
                {n(season.actualWins)} win credits in {season.games} measured regular-season games
                (ties count half).
              </Text>
              <Stack gap={6} mt={6}>
                <Box>
                  <Heading as="h3" size="lg" mb={3}>
                    Weeks to forget
                  </Heading>
                  {season.poorWeeks.length ? (
                    season.poorWeeks.slice(0, 5).map((w) => (
                      <Text key={w.week}>
                        Week {w.week}: {n(w.points)} points, {n(w.deficit)} below the league median
                        of {n(w.median)}.
                      </Text>
                    ))
                  ) : (
                    <Text>No below-median weeks in the available scores.</Text>
                  )}
                </Box>
                <Box>
                  <Heading as="h3" size="lg" mb={3}>
                    Trades that gave away scoring value
                  </Heading>
                  {season.trades.length ? (
                    season.trades.map((t) => (
                      <Text key={t.id} mb={3}>
                        Week {t.week}: received {t.received.join(', ') || 'no players'}; sent{' '}
                        {t.sent.join(', ') || 'no players'}. Net {n(t.gain)} points/week versus
                        positional baselines over {t.weeks} shared weeks
                        {t.verdict === 'close' ? ' (the overall trade was close)' : ''}.
                      </Text>
                    ))
                  ) : (
                    <Text>
                      No negative graded trades found. Ungraded trades are not counted as losses.
                    </Text>
                  )}
                </Box>
                <Box>
                  <Heading as="h3" size="lg" mb={3}>
                    Adds that did not clear the bar
                  </Heading>
                  {season.pickups.length ? (
                    season.pickups.slice(0, 10).map((p) => (
                      <Text key={p.id} mb={3}>
                        Week {p.week}: {p.player}, {n(p.lift)} points/start versus {p.baseline}{' '}
                        across {p.starts} compared starts.
                      </Text>
                    ))
                  ) : (
                    <Text>No negative rated pickups found.</Text>
                  )}
                </Box>
                <Box>
                  <Heading as="h3" size="lg" mb={3}>
                    Draft hindsight: still on the board
                  </Heading>
                  {season.draftNote && <Text>{season.draftNote}</Text>}
                  {season.draftMisses.length
                    ? season.draftMisses.slice(0, 10).map((p, i) => (
                        <Text key={`${p.pick}:${i}`} mb={3}>
                          Pick {p.pick}: {p.picked}. {p.alternative} went at pick{' '}
                          {p.alternativePick} and averaged {n(p.gap)} more points/week over{' '}
                          {p.weeks} commonly observed weeks.
                        </Text>
                      ))
                    : !season.draftNote && (
                        <Text>No qualifying same-position draft misses in the observed data.</Text>
                      )}
                </Box>
              </Stack>
            </Box>
          ))}
          <Box as="section">
            <Heading as="h2" size="xl" mb={4}>
              Fine print for the group chat
            </Heading>
            <Text>
              This page selects negative outcomes. Trade and pickup comparisons use the first four
              post-move weeks and show only graded evidence. Draft comparisons look at same-position
              players picked within the next 12 selections, require at least four common observed
              weeks, and show gaps above 2 points/week. These are hindsight comparisons, not claims
              that a better result was predictable. Roster snapshots can miss unrostered players;
              injuries, keepers and dynasty value are not adjusted. Missing data is never filled
              with zero. Up to six linked seasons are included. The worst five weeks and up to ten
              pickups/draft comparisons are shown per season.
            </Text>
          </Box>
        </>
      )}
    </Stack>
  );
}
