import type { ReportPageProps } from './report-search';
import { ShareReport } from '../components/ShareReport';
import { DataTable } from '../components/DataTable';
import {
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
  SimpleGrid,
  Text,
  chakra,
  Field,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useInsightsApi } from '../auth/InsightsAccess';
import { errorMessage } from '../api/client';
import { defaultSeason } from '../util/rankings';
import type { League } from '../types';
import type { SeasonInsights } from '../insights';
import { LeagueSummary } from '../components/LeagueSummary';
import { ScoreTrend } from '../components/ScoreTrend';

const number = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const signed = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)}`;
export function InsightsPage({
  search,
  navigate,
  shared = false,
}: ReportPageProps<{ leagueId: string; year: number }>) {
  const api = useInsightsApi();
  const { leagueId, year } = search;
  const [leagueResult, setLeagueResult] = useState<{ api: typeof api; entries: League[] }>();
  const leagues = leagueResult?.api === api ? leagueResult.entries : [];
  const [result, setResult] = useState<{
    key: string;
    api: typeof api;
    data?: SeasonInsights;
    activeManagerKeys?: string[];
    error?: string;
  }>();
  const [reload, setReload] = useState(0);
  const [teamId, setTeamId] = useState('');
  const [pickupTeam, setPickupTeam] = useState('');
  const [allPickups, setAllPickups] = useState(false);
  const [includeFormer, setIncludeFormer] = useState(false);
  const requestKey = `${leagueId}:${year}:${reload}`;
  const loading = result?.key !== requestKey || result?.api !== api;
  const data = loading ? undefined : result?.data;
  const error = loading ? '' : result?.error || '';
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await api.listLeagues().catch((error): League[] => {
          if (!leagueId) throw error;
          return [];
        });
        if (leagueId && !entries.some((league) => league.leagueId === leagueId)) {
          entries.push(await api.getLeague(leagueId));
        }
        if (cancelled) return;
        setLeagueResult({ api, entries });
        const selected =
          entries.find((l) => l.leagueId === leagueId) || (!leagueId ? entries[0] : undefined);
        if (!selected) {
          if (leagueId) throw new Error('League not found.');
          setResult({ api, key: requestKey });
          return;
        }
        if (!leagueId) {
          void navigate({ search: { leagueId: selected.leagueId, year }, replace: true });
          return;
        }
        const [result, context] = await Promise.all([
          api.getInsights(selected.leagueId, year, reload > 0),
          api.getLeagueSeasons(selected.leagueId),
        ]);
        if (!cancelled) {
          setResult({
            api,
            key: requestKey,
            data: result,
            activeManagerKeys: context.activeManagerKeys,
          });
          setTeamId(result.teams[0]?.teamId || '');
          setPickupTeam('');
          setAllPickups(false);
        }
      } catch (failure) {
        if (!cancelled) setResult({ api, key: requestKey, error: errorMessage(failure) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, reload, navigate, requestKey]);
  const scoreRows = useMemo(
    () => data?.scores.filter((s) => s.teamId === teamId).sort((a, b) => a.week - b.week) || [],
    [data, teamId],
  );
  const selectedTeam = data?.teams.find((t) => t.teamId === teamId);
  const names = new Map(data?.teams.map((t) => [t.teamId, t.teamName]));
  const evaluatedPickups = data?.pickups.filter((p) => p.lift !== null) || [];
  const bestPickup = evaluatedPickups[0];
  const filteredPickups = data?.pickups.filter((p) => !pickupTeam || p.teamId === pickupTeam) || [];
  const judgedTrades = data?.tradeComparisons.filter((t) => t.winner !== null).length || 0;
  const leader = data?.teams
    .filter((t) => t.average !== null)
    .sort((a, b) => b.average! - a.average!)[0];
  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        mt={4}
        mb={6}
        className="page-heading"
      >
        <Box>
          <Text mb={4} className="eyebrow">
            The season, by the numbers
          </Text>
          <Heading as="h1" size="3xl" mb={4}>
            Did the moves pay off?
          </Heading>
          <Text mb={4}>
            Follow the points. Find the steals. See who keeps beating expectations.
          </Text>
        </Box>
        <ShareReport path="/insights" search={{ leagueId, year }} />
      </Flex>
      <Box className="selection-bar insights-controls">
        <Field.Root width="auto" minW="120px" gap={2}>
          <Field.Label>League</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={leagueId}
              onChange={(e) => void navigate({ search: { leagueId: e.target.value, year } })}
            >
              <option value="" disabled>
                Choose a league
              </option>
              {leagues.map((l) => (
                <option key={l.leagueId} value={l.leagueId}>
                  {l.leagueName}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root width="auto" minW="120px" gap={2}>
          <Field.Label>Season</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={year}
              onChange={(e) =>
                void navigate({ search: { leagueId, year: Number(e.target.value) } })
              }
            >
              {Array.from({ length: defaultSeason() - 1999 }, (_, i) => defaultSeason() - i).map(
                (y) => (
                  <option key={y}>{y}</option>
                ),
              )}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Button
          variant="outline"
          type="button"

          disabled={loading}
          onClick={() => setReload((v) => v + 1)}
        >
          Refresh insights
        </Button>
      </Box>
      {error && (
        <Box className="notice error" role="alert">
          {error}{' '}
          <Button variant="outline" type="button" onClick={() => setReload((v) => v + 1)}>
            Try again
          </Button>
        </Box>
      )}
      {loading && (
        <chakra.output
          bg="bg"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          rounded="lg"
          p={{ base: 4, md: 6 }}
          className="panel"
        >
          Reading season scores and transactions… This can take a moment for a full season.
        </chakra.output>
      )}
      {!loading && !error && !leagues.length && (
        <Box
          as="section"
          bg="bg"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          rounded="lg"
          p={{ base: 4, md: 6 }}
          className="panel"
        >
          <Heading as="h2" size="xl" mb={4}>
            Open a shared league link to explore its season.
          </Heading>
          <ChakraLink asChild>
            <Link to="/leagues/new">Sign in to choose or connect a league</Link>
          </ChakraLink>
        </Box>
      )}
      {data && (
        <>
          <Text mb={4} className="insights-meta">
            {data.completedWeek
              ? `Through completed week ${data.completedWeek}`
              : 'No completed weeks yet'}{' '}
            · Updated{' '}
            {new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {!data.completedWeek && (
            <Box className="notice insights-notice">
              The current week is excluded while games are unfinished. Choose an earlier season to
              explore historical results.
            </Box>
          )}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} my={6} className="insight-cards">
            <Box as="article">
              <Text mb={4} className="eyebrow">
                Scoring pace
              </Text>
              <Heading as="h2" size="xl" mb={4}>
                {number(leader?.average ?? null)} <small>pts / week</small>
              </Heading>
              <Text mb={4}>{leader?.teamName || 'Waiting for completed scores'}</Text>
            </Box>
            <Box as="article">
              <Text mb={4} className="eyebrow">
                Best pickup above baseline
              </Text>
              <Heading as="h2" size="xl" mb={4}>
                {bestPickup?.player || 'Not yet evaluated'}
              </Heading>
              <Text mb={4}>
                {bestPickup
                  ? `${signed(bestPickup.lift)} pts / start vs. ${bestPickup.baseline} · ${bestPickup.comparisonWeeks.length} starts`
                  : 'At least two comparable starts are needed.'}
              </Text>
            </Box>
            <Box as="article">
              <Text mb={4} className="eyebrow">
                Trade verdicts
              </Text>
              <Heading as="h2" size="xl" mb={4}>
                {judgedTrades} <small>with a scoring leader</small>
              </Heading>
              <Text mb={4}>
                {data.tradeComparisons.length} player trades assessed individually over equal
                post-trade windows.
              </Text>
            </Box>
          </SimpleGrid>
          <label className="history-toggle">
            <chakra.input
              accentColor="green.700"
              width="auto"
              type="checkbox"
              checked={includeFormer}
              onChange={(e) => setIncludeFormer(e.target.checked)}
            />{' '}
            Include former managers in summary
          </label>
          <LeagueSummary
            records={[{ year, data }]}
            activeManagerKeys={result?.activeManagerKeys || []}
            includeFormer={includeFormer}
          />
          <Text mb={4}>
            <ChakraLink asChild>
              <Link to={shared ? '/shared/history' : '/history'} search={{ leagueId }}>
                Explore this league’s history →
              </Link>
            </ChakraLink>
          </Text>
          <Box
            as="section"
            bg="bg"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            className="panel insight-section"
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'stretch', md: 'center' }}
              justify="space-between"
              gap={4}
              className="insight-heading"
            >
              <Box>
                <Text mb={4} className="eyebrow">
                  Expectation vs. reality
                </Text>
                <Heading as="h2" size="xl" mb={4}>
                  Weekly scoring trends
                </Heading>
              </Box>
              <Field.Root width="auto" minW="120px" gap={2}>
                <Field.Label>Team</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                    {data.teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.teamName}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </Flex>
            {scoreRows.length ? (
              <>
                <Text mb={4}>
                  <strong>{number(selectedTeam?.average ?? null)}</strong> points per week ·{' '}
                  <strong>{selectedTeam?.aboveMedian}</strong> of {selectedTeam?.weeks} weeks above
                  the league median
                  {selectedTeam?.projectedWeeks ? (
                    <>
                      {' '}
                      · <strong>{signed(selectedTeam.projectionDelta)}</strong> average vs.
                      projection across {selectedTeam.projectedWeeks} weeks
                    </>
                  ) : (
                    ''
                  )}
                </Text>
                <Text mb={4} className="chart-legend">
                  <span>● Actual points</span>
                  {scoreRows.some((s) => s.projected !== null) && <span>┄ Lineup projection</span>}
                </Text>
                <ScoreTrend scores={scoreRows} />
                <details>
                  <summary>View exact weekly scores</summary>
                  <Box overflowX="auto" className="insight-table-wrap">
                    <DataTable
                      label="Weekly scores"
                      data={scoreRows}
                      getRowId={(s) => String(s.week)}
                      initialSorting={[{ id: '0', desc: false }]}
                      columns={[
                        {
                          id: '0',
                          header: 'Week',
                          value: (s) => s.week,
                          cell: (s) => <>{s.week}</>,
                        },
                        {
                          id: '1',
                          header: 'Actual points',
                          value: (s) => s.actual,
                          cell: (s) => <>{number(s.actual)}</>,
                        },
                        {
                          id: '2',
                          header: 'Projected points',
                          value: (s) => s.projected,
                          cell: (s) => <>{number(s.projected)}</>,
                        },
                        {
                          id: '3',
                          header: 'Difference',
                          value: (s) => (s.projected === null ? null : s.actual - s.projected),
                          cell: (s) => (
                            <>{signed(s.projected === null ? null : s.actual - s.projected)}</>
                          ),
                        },
                      ]}
                    />
                  </Box>
                </details>
              </>
            ) : (
              <Text mb={4}>No completed scores for this team and season.</Text>
            )}
          </Box>
          <Box
            as="section"
            bg="bg"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            className="panel insight-section"
          >
            <Text mb={4} className="eyebrow">
              The whole league
            </Text>
            <Heading as="h2" size="xl" mb={4}>
              Who delivers every week?
            </Heading>
            <Box overflowX="auto" className="insight-table-wrap">
              <DataTable
                label="Team scoring"
                data={data.teams}
                getRowId={(t) => t.teamId}
                initialSorting={[{ id: '1', desc: true }]}
                columns={[
                  {
                    id: '0',
                    header: 'Team',
                    value: (t) => t.teamName,
                    rowHeader: true,
                    cell: (t) => (
                      <>
                        {t.teamName}
                        <small>{t.managerName}</small>
                      </>
                    ),
                  },
                  {
                    id: '1',
                    header: 'Avg. points',
                    value: (t) => t.average,
                    cell: (t) => <>{number(t.average)}</>,
                  },
                  {
                    id: '2',
                    header: 'Best week',
                    value: (t) => t.best,
                    cell: (t) => <>{number(t.best)}</>,
                  },
                  {
                    id: '3',
                    header: 'Above median',
                    value: (t) => (t.weeks ? t.aboveMedian / t.weeks : null),
                    cell: (t) => (
                      <>
                        {t.aboveMedian} / {t.weeks}
                      </>
                    ),
                  },
                  {
                    id: '4',
                    header: 'Avg. vs. projection',
                    value: (t) => t.projectionDelta,
                    cell: (t) => <>{signed(t.projectionDelta)}</>,
                  },
                  {
                    id: '5',
                    header: 'Beat projection',
                    value: (t) => (t.projectedWeeks ? t.beatProjection / t.projectedWeeks : null),
                    cell: (t) => (
                      <>{t.projectedWeeks ? `${t.beatProjection} / ${t.projectedWeeks}` : '—'}</>
                    ),
                  },
                ]}
              />
            </Box>
          </Box>
          <Box
            as="section"
            bg="bg"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            className="panel insight-section"
          >
            <Text mb={4} className="eyebrow">
              Head to head
            </Text>
            <Heading as="h2" size="xl" mb={4}>
              Who won each trade?
            </Heading>
            <Text mb={4}>
              Compare the value each side gained over the same first four post-trade weeks. Value
              means points above the league’s median starter at each player’s position, per week.
              Bench scoring is included to evaluate the players exchanged, independent of lineup
              choices.
            </Text>
            {data.tradeComparisons.length ? (
              data.tradeComparisons.map((trade) => (
                <Box as="article" className="trade-detail" key={trade.id}>
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    align={{ base: 'stretch', md: 'center' }}
                    justify="space-between"
                    gap={4}
                    className="insight-heading"
                  >
                    <Heading as="h3" size="lg" mb={4}>
                      Week {trade.week} ·{' '}
                      {trade.sides.map((side) => names.get(side.teamId) || side.teamId).join(' ↔ ')}
                    </Heading>
                    <strong>
                      {trade.verdict === 'leader'
                        ? `${names.get(trade.winner!) || trade.winner} leads`
                        : trade.verdict === 'close'
                          ? 'Too close to call'
                          : trade.verdict === 'picks'
                            ? 'Draft picks not valued'
                            : 'Insufficient comparable data'}
                    </strong>
                  </Flex>
                  <Text mb={4}>
                    {trade.weeks.length} of {trade.possibleWeeks} completed weeks compared
                    {trade.weeks.length ? ` (weeks ${trade.weeks.join(', ')})` : ''}.{' '}
                    {trade.possibleWeeks < 4
                      ? 'Early read: the four-week window is not complete.'
                      : 'Four-week assessment.'}
                  </Text>
                  <Box overflowX="auto" className="insight-table-wrap">
                    <DataTable
                      label="Trade comparison"
                      data={trade.sides}
                      getRowId={(side) => side.teamId}
                      columns={[
                        {
                          id: '0',
                          header: 'Team / received players',
                          value: (side) => names.get(side.teamId) || side.teamId,
                          rowHeader: true,
                          cell: (side) => (
                            <>
                              {names.get(side.teamId) || side.teamId}
                              <small>{side.received.join(', ') || 'No players'}</small>
                            </>
                          ),
                        },
                        {
                          id: '1',
                          header: 'Sent players',
                          value: (side) => side.sent.join(', '),
                          cell: (side) => <>{side.sent.join(', ') || 'No players'}</>,
                        },
                        {
                          id: '2',
                          header: 'Received value / wk',
                          value: (side) => side.receivedValue,
                          cell: (side) => <>{signed(side.receivedValue)}</>,
                        },
                        {
                          id: '3',
                          header: 'Sent value / wk',
                          value: (side) => side.sentValue,
                          cell: (side) => <>{signed(side.sentValue)}</>,
                        },
                        {
                          id: '4',
                          header: 'Net gain / wk',
                          value: (side) => side.gain,
                          cell: (side) => (
                            <>
                              <strong>{signed(side.gain)}</strong>
                            </>
                          ),
                        },
                      ]}
                    />
                  </Box>
                </Box>
              ))
            ) : (
              <Text mb={4}>No completed player trades returned for this season.</Text>
            )}
          </Box>
          <Box
            as="section"
            bg="bg"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            className="panel insight-section"
          >
            <Text mb={4} className="eyebrow">
              Found on the wire
            </Text>
            <Heading as="h2" size="xl" mb={4}>
              Free-agent moves that paid off
            </Heading>
            <Text mb={4}>
              Pickups ranked by average improvement per start in their first four post-pickup weeks.
              We use the dropped player at the same position when there is one clear pair and
              complete scoring coverage; otherwise we use the league’s positional starter median.
            </Text>
            <Field.Root width="auto" minW="120px" gap={2} className="pickup-filter">
              <Field.Label>Filter pickups by team</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={pickupTeam}
                  onChange={(e) => {
                    setPickupTeam(e.target.value);
                    setAllPickups(false);
                  }}
                >
                  <option value="">All teams</option>
                  {data.teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            {filteredPickups.length ? (
              <Box overflowX="auto" className="insight-table-wrap">
                <DataTable
                  label="Free-agent pickups"
                  data={filteredPickups}
                  getRowId={(p) => p.id}
                  initialSorting={[{ id: '5', desc: true }]}
                  limit={allPickups ? undefined : 10}
                  columns={[
                    {
                      id: '0',
                      header: 'Player',
                      value: (p) => p.player,
                      rowHeader: true,
                      cell: (p) => (
                        <>
                          {p.player}
                          <small>{p.position || 'Position unavailable'}</small>
                        </>
                      ),
                    },
                    {
                      id: '1',
                      header: 'Team',
                      value: (p) => names.get(p.teamId) || p.teamId,
                      cell: (p) => <>{names.get(p.teamId) || p.teamId}</>,
                    },
                    {
                      id: '2',
                      header: 'Added week',
                      value: (p) => p.week,
                      cell: (p) => <>{p.week}</>,
                    },
                    {
                      id: '3',
                      header: 'Baseline',
                      value: (p) => p.baseline,
                      cell: (p) => <>{p.baseline}</>,
                    },
                    {
                      id: '4',
                      header: 'Avg. player points',
                      value: (p) => p.averagePoints,
                      cell: (p) => number(p.averagePoints),
                    },
                    {
                      id: 'averageBaseline',
                      header: 'Avg. baseline points',
                      value: (p) => p.averageBaseline,
                      cell: (p) => number(p.averageBaseline),
                    },
                    {
                      id: '5',
                      header: 'Lift / start',
                      value: (p) => p.lift,
                      cell: (p) => <>{p.lift === null ? 'Insufficient data' : signed(p.lift)}</>,
                    },
                    {
                      id: '6',
                      header: 'Compared starts',
                      value: (p) => p.comparisonWeeks.length,
                      cell: (p) => (
                        <>
                          {p.comparisonWeeks.length}
                          <small>
                            {p.comparisonWeeks.length
                              ? `Weeks ${p.comparisonWeeks.join(', ')}`
                              : ''}
                          </small>
                        </>
                      ),
                    },
                  ]}
                />
              </Box>
            ) : (
              <Text mb={4}>No completed pickups returned for this selection.</Text>
            )}
            {filteredPickups.length > 10 && (
              <Button
                variant="plain"
                type="button"
                onClick={() => setAllPickups((value) => !value)}
              >
                {allPickups ? 'Show top 10' : `Show all ${filteredPickups.length} pickups`}
              </Button>
            )}
          </Box>
          <Box as="section" className="insights-method">
            <Heading as="h2" size="xl" mb={4}>
              How to read these numbers
            </Heading>
            <ul>
              <li>
                Only completed weeks are included. A dash means unavailable or not yet evaluable; it
                is not a zero.
              </li>
              <li>
                Assessments use at most the first four weeks after a move, excluding the transaction
                week. Trades use identical weeks for every asset, including bench scoring; later
                lineup decisions do not change who appears to have won. Pickups count starts only
                while retained, before the next move.
              </li>
              <li>
                Each positional baseline is the median of at least three other distinct starters in
                this league that week, excluding all traded assets. Multi-player package values are
                summed above these baselines, so a raw quarterback score does not automatically beat
                a receiver package.
              </li>
              <li>
                A scoring leader needs at least two common weeks, at least 75% coverage of the
                completed comparison window, and more than a 1-point/week gap between the leading
                net gains. Close results remain uncalled. This is an early scoring assessment, not a
                statistical confidence claim.
              </li>
              <li>
                We only observe players present in league roster snapshots. Missing scores and
                unknown positions are not treated as zero; byes/injuries with reported zero points
                count as zero. Trade grades exclude FAAB, draft picks and long-term dynasty value.
                Trades with picks receive no overall winner call.
              </li>
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Box>
        </>
      )}
    </>
  );
}
