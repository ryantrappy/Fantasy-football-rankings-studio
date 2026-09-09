import { logClientError } from '../logging';
import type { ReportPageProps } from './report-search';
import { ShareReport } from '../components/ShareReport';
import { DataTable } from '../components/DataTable';
import {
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
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
import type { SeasonRecord } from '../league-summary';
import {
  average,
  percentage,
  summarizeLeague,
  visibleManagers,
  luckIndex,
} from '../league-summary';
import { LeagueSummary } from '../components/LeagueSummary';

const n = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
export function HistoryPage({
  search,
  navigate,
  shared = false,
}: ReportPageProps<{ leagueId: string; years?: number[] }>) {
  const api = useInsightsApi(),
    { leagueId, years: requestedYears } = search;
  const [catalog, setCatalog] = useState<{
    api: typeof api;
    leagueId: string;
    leagues: League[];
    years: number[];
    activeManagerKeys?: string[];
    activeSeason?: number;
    error?: string;
  }>();
  const [refresh, setRefresh] = useState(0);
  const [manager, setManager] = useState('');
  const [includeFormer, setIncludeFormer] = useState(false);
  const [loaded, setLoaded] = useState<{
    api: typeof api;
    key: string;
    records: SeasonRecord[];
    errors: { year: number; message: string }[];
    done: boolean;
  }>();
  const currentCatalog =
    catalog?.api === api && catalog.leagueId === leagueId ? catalog : undefined;
  const years = useMemo(() => {
    if (!currentCatalog) return [];
    if (requestedYears) return requestedYears.filter((year) => currentCatalog.years.includes(year));
    const prior = currentCatalog.years.filter((year) => year < defaultSeason());
    return (prior.length ? prior : currentCatalog.years).slice(0, 3);
  }, [currentCatalog, requestedYears]);
  const key = `${leagueId}:${years.join(',')}:${refresh}`;
  const current = loaded?.api === api && loaded.key === key ? loaded : undefined;
  const records = current?.records || [];
  const loading = !!years.length && !current?.done;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const leagues = await api.listLeagues().catch((error): League[] => {
          logClientError('HistoryPage', error);
          if (!leagueId) throw error;
          return [];
        });
        if (leagueId && !leagues.some((league) => league.leagueId === leagueId)) {
          leagues.push(await api.getLeague(leagueId));
        }
        if (cancelled) return;
        if (!leagueId && leagues[0]) {
          void navigate({ search: { leagueId: leagues[0].leagueId }, replace: true });
          return;
        }
        if (!leagueId) {
          setCatalog({ api, leagueId, leagues, years: [] });
          return;
        }
        if (!leagues.some((l) => l.leagueId === leagueId)) throw new Error('League not found.');
        const context = await api.getLeagueSeasons(leagueId);
        if (cancelled) return;
        setCatalog({ api, leagueId, leagues, ...context });
      } catch (error) {
        logClientError('HistoryPage', error);
        if (!cancelled)
          setCatalog({ api, leagueId, leagues: [], years: [], error: errorMessage(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, navigate]);
  useEffect(() => {
    if (!years.length) return;
    let cancelled = false;
    void (async () => {
      const records: SeasonRecord[] = [],
        errors: { year: number; message: string }[] = [];
      for (const year of years) {
        if (cancelled) return;
        try {
          const data = await api.getInsights(leagueId, year, refresh > 0);
          if (cancelled) return;
          records.push({ year, data });
        } catch (error) {
          logClientError('HistoryPage', error);
          if (cancelled) return;
          errors.push({ year, message: errorMessage(error) });
        }
        setLoaded({
          api,
          key,
          records: [...records],
          errors: [...errors],
          done: records.length + errors.length === years.length,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, key, leagueId, years, refresh]);
  const managers = visibleManagers(
    summarizeLeague(records),
    currentCatalog?.activeManagerKeys || [],
    includeFormer,
  );
  const historyRows = records
    .flatMap((record) => summarizeLeague([record]).map((row) => ({ year: record.year, ...row })))
    .filter((row) => managers.some((m) => m.key === row.key) && (!manager || row.key === manager))
    .sort((a, b) => b.year - a.year || a.managerName.localeCompare(b.managerName));
  function choose(next: number[]) {
    void navigate({ search: { leagueId, years: [...next].sort((a, b) => b - a) } });
    setManager('');
  }
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
            The league archive
          </Text>
          <Heading as="h1" size="3xl" mb={4}>
            League history
          </Heading>
          <Text mb={4}>
            One good move is a moment. Find the managers who repeat it across seasons.
          </Text>
        </Box>
        <Button asChild colorPalette="indigo">
          <Link
            to={shared ? '/shared/insights' : '/insights'}
            search={{ leagueId, year: defaultSeason() }}
          >
            Current season insights
          </Link>
        </Button>
        <ShareReport path="/history" search={{ leagueId, years }} />
      </Flex>
      {!currentCatalog ? (
        <chakra.output
          bg="bg"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          rounded="lg"
          p={{ base: 4, md: 6 }}
          className="panel"
        >
          Finding linked seasons…
        </chakra.output>
      ) : currentCatalog.error ? (
        <Box role="alert" className="notice error">
          {currentCatalog.error}
          <Button
            variant="outline"
            type="button"
            onClick={() => void navigate({ search: { leagueId: '' } })}
          >
            Choose another league
          </Button>
        </Box>
      ) : (
        <>
          <Field.Root width="auto" minW="120px" gap={2} className="pickup-filter">
            <Field.Label>League</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={leagueId}
                onChange={(e) => {
                  setManager('');
                  void navigate({ search: { leagueId: e.target.value } });
                }}
              >
                {currentCatalog.leagues.map((l) => (
                  <option key={l.leagueId} value={l.leagueId}>
                    {l.leagueName}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {!currentCatalog.leagues.length ? (
            <Text mb={4}>
              <ChakraLink asChild>
                <Link to="/leagues/new">
                  Open a shared league link, or sign in to choose a league.
                </Link>
              </ChakraLink>
            </Text>
          ) : (
            <>
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
                  Seasons to compare
                </Heading>
                <Text mb={4}>
                  The most recent three prior seasons are selected initially. Add older years for a
                  longer view. Unavailable seasons are shown separately and never counted as zeros.
                </Text>
                <fieldset className="history-years">
                  <legend>Include seasons</legend>
                  {currentCatalog.years.map((year) => (
                    <label key={year}>
                      <chakra.input
                        accentColor="green.700"
                        width="auto"
                        type="checkbox"
                        checked={years.includes(year)}
                        onChange={(e) =>
                          choose(
                            e.target.checked ? [...years, year] : years.filter((y) => y !== year),
                          )
                        }
                      />
                      {year}
                      {year === defaultSeason() ? ' · in progress' : ''}
                    </label>
                  ))}
                </fieldset>
                <Flex flexWrap="wrap" gap={4} className="history-actions">
                  <Button
                    variant="plain"
                    type="button"

                    onClick={() => choose(currentCatalog.years.filter((y) => y < defaultSeason()))}
                  >
                    Select all prior seasons
                  </Button>
                  <Button
                    variant="plain"
                    type="button"

                    disabled={loading || !years.length}
                    onClick={() => setRefresh((v) => v + 1)}
                  >
                    Refresh selected seasons
                  </Button>
                </Flex>
              </Box>
              {!years.length && <Text mb={4}>Select at least one season to compare.</Text>}
              {loading && (
                <chakra.output className="notice insights-notice">
                  Loaded {records.length + (current?.errors.length || 0)} of {years.length} seasons.
                  Historical provider reads can take a moment.
                </chakra.output>
              )}
              {!!current?.errors.length && (
                <Box className="notice error" role="alert">
                  <strong>Some seasons could not be loaded.</strong>
                  {current.errors.map((e) => (
                    <Text mb={4} key={e.year}>
                      {e.year}: {e.message}
                    </Text>
                  ))}
                  <Button
                    variant="outline"
                    type="button"
                    disabled={loading}
                    onClick={() => setRefresh((v) => v + 1)}
                  >
                    Retry selected seasons
                  </Button>
                </Box>
              )}
              {!!records.length && (
                <>
                  <Text mb={4} className="insights-meta">
                    Included:{' '}
                    {records
                      .map((r) => r.year)
                      .sort((a, b) => b - a)
                      .join(', ')}{' '}
                    · {records.length} of {years.length} selected seasons loaded
                    {loading ? ' · provisional while loading' : ''}. Managers match by provider
                    account ID; renamed teams stay together. New owners and changed co-owner groups
                    start a separate record. Unknown owners stay separate by season.
                  </Text>
                  <label className="history-toggle">
                    <chakra.input
                      accentColor="green.700"
                      width="auto"
                      type="checkbox"
                      checked={includeFormer}
                      onChange={(e) => {
                        setIncludeFormer(e.target.checked);
                        setManager('');
                      }}
                    />{' '}
                    Include former managers
                  </label>
                  <Text mb={4} className="insights-meta">
                    Active membership uses the latest linked season ({currentCatalog.activeSeason}).
                    Historical comparisons still include every team that played.
                  </Text>
                  <LeagueSummary
                    records={records}
                    historical
                    activeManagerKeys={currentCatalog.activeManagerKeys || []}
                    includeFormer={includeFormer}
                  />
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
                          Year by year
                        </Text>
                        <Heading as="h2" size="xl" mb={4}>
                          Track the manager, not the team name
                        </Heading>
                      </Box>
                      <Field.Root width="auto" minW="120px" gap={2}>
                        <Field.Label>Manager history</Field.Label>
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            value={manager}
                            onChange={(e) => setManager(e.target.value)}
                          >
                            <option value="">All managers</option>
                            {managers.map((m) => (
                              <option key={m.key} value={m.key}>
                                {m.managerName}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                    </Flex>
                    <Box overflowX="auto" className="insight-table-wrap">
                      <DataTable
                        label="Manager season history"
                        data={historyRows}
                        getRowId={(r) => `${r.year}:${r.key}`}
                        initialSorting={[
                          { id: '0', desc: true },
                          { id: '1', desc: false },
                        ]}
                        columns={[
                          {
                            id: '0',
                            header: 'Season',
                            value: (r) => r.year,
                            cell: (r) => (
                              <>
                                <ChakraLink asChild>
                                  <Link
                                    to={shared ? '/shared/insights' : '/insights'}
                                    search={{ leagueId, year: r.year }}
                                  >
                                    {r.year}
                                  </Link>
                                </ChakraLink>
                              </>
                            ),
                          },
                          {
                            id: '1',
                            header: 'Manager / team that year',
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
                            id: 'finish',
                            header: 'Final finish',
                            value: (r) => average(r.finishTotal, r.finishSeasons),
                            cell: (r) => <>{n(average(r.finishTotal, r.finishSeasons))}</>,
                          },
                          {
                            id: 'playoffs',
                            header: 'Playoffs',
                            value: (r) => (r.playoffSeasons ? r.playoffAppearances : null),
                            cell: (r) => (
                              <>{r.playoffSeasons ? (r.playoffAppearances ? 'Yes' : 'No') : '—'}</>
                            ),
                          },
                          {
                            id: 'title',
                            header: 'Champion',
                            value: (r) => (r.championshipSeasons ? r.championships : null),
                            cell: (r) => (
                              <>{r.championshipSeasons ? (r.championships ? 'Yes' : 'No') : '—'}</>
                            ),
                          },
                          {
                            id: 'last',
                            header: 'Last place',
                            value: (r) => (r.lastPlaceSeasons ? r.lastPlaces : null),
                            cell: (r) => (
                              <>{r.lastPlaceSeasons ? (r.lastPlaces ? 'Yes' : 'No') : '—'}</>
                            ),
                          },
                          {
                            id: '2',
                            header: 'Avg. vs. median',
                            value: (r) => average(r.medianPercentTotal, r.medianWeeks),
                            cell: (r) => (
                              <>
                                {n(average(r.medianPercentTotal, r.medianWeeks))}%
                                <small>{r.weeks} weeks</small>
                              </>
                            ),
                          },
                          {
                            id: '3',
                            header: 'All-play win rate',
                            value: (r) => percentage(r.allPlayWins, r.allPlayGames),
                            cell: (r) => <>{n(percentage(r.allPlayWins, r.allPlayGames))}%</>,
                          },
                          {
                            id: '4',
                            header: 'Luck index',
                            value: (r) => luckIndex(r),
                            cell: (r) => <>{n(luckIndex(r))} pp</>,
                          },
                          {
                            id: '5',
                            header: 'Trade gain / trade',
                            value: (r) => average(r.tradeGainTotal, r.gradedTrades),
                            cell: (r) => (
                              <>
                                {n(average(r.tradeGainTotal, r.gradedTrades))}
                                <small>{r.gradedTrades} graded</small>
                              </>
                            ),
                          },
                          {
                            id: '6',
                            header: 'Pickup lift / pickup',
                            value: (r) => average(r.pickupLiftTotal, r.ratedPickups),
                            cell: (r) => (
                              <>
                                {n(average(r.pickupLiftTotal, r.ratedPickups))}
                                <small>{r.ratedPickups} rated</small>
                              </>
                            ),
                          },
                          {
                            id: '7',
                            header: 'Pickup hit rate',
                            value: (r) => percentage(r.pickupHits, r.ratedPickups),
                            cell: (r) => <>{n(percentage(r.pickupHits, r.ratedPickups))}%</>,
                          },
                        ]}
                      />
                    </Box>
                  </Box>
                  <Box as="section" className="insights-method">
                    <Heading as="h2" size="xl" mb={4}>
                      Coverage and interpretation
                    </Heading>
                    <Text mb={4}>
                      Trading and waiver summaries aggregate the four-week assessments in Season
                      Insights; they do not pretend to value entire careers or draft picks. Trade
                      results use equal observation windows and positional baselines. Pickup lift
                      uses the dropped-player or positional baseline shown on each season page.
                      Per-move averages weight each graded move equally. Scoring rates weight each
                      observed week or all-play comparison, not each season equally. Selection and
                      failed seasons affect the leaders shown above.
                    </Text>
                    {records.map((r) => (
                      <details key={r.year}>
                        <summary>{r.year} data notes</summary>
                        <ul>
                          {r.data.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </Box>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
