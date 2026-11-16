import './analytics-explorer.css';
import { ApiContext } from '../auth/session';
import { Icon } from './Icon';
import { LoadingSkeleton } from './LoadingSkeleton';
import { PageHeading } from './PageHeading';
import { ShareReport } from './ShareReport';
import { logClientError } from '../logging';
import type { ReportPageProps } from './report-search';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  IconButton,
  NativeSelect,
  Text,
} from '@chakra-ui/react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useInsightsApi } from '../auth/InsightsAccess';
import { errorMessage } from '../api/client';
import { defaultSeason } from '../util/rankings';
import type { League } from '../types';
import type { SeasonInsights } from '../insights';
import { reportFreshnessLabel } from './report-freshness';
import { usePlayoffPathsForecast } from '../hooks/usePlayoffPathsForecast';
import {
  defaultTeamId,
  fixtureKey,
  picksToFixedOutcomes,
  prefillFromProjections,
  projectedPointsForWeek,
  rankLeverage,
  remainingFixtures,
} from '../playoff-paths';

const percent = (n: number) => `${(n * 100).toFixed(1)}%`;

export function PlayoffPathsPage({
  search,
  navigate,
  shared = false,
  initialLeague,
  snapshot,
}: ReportPageProps<{ leagueId: string; year: number }> & {
  initialLeague?: League | null;
}) {
  const api = useInsightsApi();
  const privateApi = useContext(ApiContext);
  const { leagueId, year } = search;
  const [leagueResult, setLeagueResult] = useState<{ api: typeof api; entries: League[] }>();
  const leagues = leagueResult?.api === api ? leagueResult.entries : [];
  const [result, setResult] = useState<{
    key: string;
    scope: string;
    api: typeof api;
    data?: SeasonInsights;
    activeManagerKeys?: string[];
    activeSeason?: number;
    error?: string;
    refreshed?: boolean;
  }>();
  const [reload, setReload] = useState(0);
  const [managed, setManaged] = useState<{
    scope: string;
    api: typeof privateApi;
    teamId: string | null;
  }>();
  const [teamId, setTeamId] = useState('');
  const [picks, setPicks] = useState<Record<string, string>>({});
  const requestKey = `${leagueId}:${year}:${reload}`;
  const reportScope = `${leagueId}:${year}`;
  const loadedScope = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (shared || snapshot || !leagueId || !privateApi?.managedTeam) return;
    let cancelled = false;
    void privateApi.managedTeam
      .get(leagueId, year)
      .then((selection) => {
        if (!cancelled)
          setManaged({
            scope: reportScope,
            api: privateApi,
            teamId: selection.needsReselection ? null : selection.teamId,
          });
      })
      .catch((error) => logClientError('PlayoffPathsPage.managedTeam', error));
    return () => {
      cancelled = true;
    };
  }, [privateApi, shared, snapshot, leagueId, year, reportScope]);

  const loading = result?.key !== requestKey || result?.api !== api;
  const data = result?.api === api && result.scope === reportScope ? result.data : undefined;
  const error = loading ? '' : result?.error || '';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = shared
          ? initialLeague
            ? [initialLeague]
            : []
          : await api.listLeagues().catch((error): League[] => {
              logClientError('PlayoffPathsPage', error);
              if (!leagueId) throw error;
              return [];
            });
        if (leagueId && !entries.some((league) => league.leagueId === leagueId)) {
          if (shared) throw new Error('League not found.');
          entries.push(await api.getLeague(leagueId));
        }
        if (cancelled) return;
        setLeagueResult({ api, entries });
        const selected =
          entries.find((l) => l.leagueId === leagueId) || (!leagueId ? entries[0] : undefined);
        if (!selected) {
          if (leagueId) throw new Error('League not found.');
          setResult({ api, key: requestKey, scope: reportScope });
          return;
        }
        if (!leagueId) {
          void navigate({ search: { leagueId: selected.leagueId, year }, replace: true });
          return;
        }
        const [insights, context] = await Promise.all([
          api.getInsights(selected.leagueId, year, reload > 0),
          api.getLeagueSeasons(selected.leagueId),
        ]);
        if (!cancelled) {
          setResult({
            api,
            key: requestKey,
            scope: reportScope,
            data: insights,
            activeManagerKeys: context.activeManagerKeys,
            activeSeason: context.activeSeason,
            refreshed: reload > 0,
          });
          if (loadedScope.current !== reportScope) {
            setTeamId('');
            setPicks({});
          }
          loadedScope.current = reportScope;
        }
      } catch (failure) {
        logClientError('PlayoffPathsPage', failure);
        if (!cancelled)
          setResult((previous) => ({
            api,
            key: requestKey,
            scope: reportScope,
            data:
              previous?.api === api && previous.scope === reportScope ? previous.data : undefined,
            activeManagerKeys:
              previous?.api === api && previous.scope === reportScope
                ? previous.activeManagerKeys
                : undefined,
            error: errorMessage(failure),
            refreshed: reload > 0,
          }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, reload, navigate, requestKey, reportScope, shared, initialLeague]);

  // The user's explicit pick wins; otherwise the managed team, otherwise
  // the best current record. Derived during render so no effect is needed.
  const effectiveTeamId =
    teamId && data?.teams.some((t) => t.teamId === teamId)
      ? teamId
      : managed?.teamId && data?.teams.some((t) => t.teamId === managed.teamId)
        ? managed.teamId
        : (defaultTeamId(data) ?? '');

  const settings = data?.playoffSettings;
  const fixtures = useMemo(
    () => (data && settings ? remainingFixtures(data, settings.regularSeasonEnd) : []),
    [data, settings],
  );
  const fixedOutcomes = useMemo(() => picksToFixedOutcomes(picks, fixtures), [picks, fixtures]);
  const {
    base,
    conditional,
    pending,
    error: forecastError,
  } = usePlayoffPathsForecast(data, settings, fixedOutcomes);
  const names = useMemo(() => new Map(data?.teams.map((t) => [t.teamId, t.teamName])), [data]);
  const selectedTeam = data?.teams.find((t) => t.teamId === effectiveTeamId);
  const baseRow = base?.rows.find((r) => r.teamId === effectiveTeamId);
  const conditionalRow = conditional?.rows.find((r) => r.teamId === effectiveTeamId);
  const leverageRows = useMemo(
    () => rankLeverage(conditional, effectiveTeamId),
    [conditional, effectiveTeamId],
  );
  const pickCount = fixedOutcomes.length;
  const prefillCount = useMemo(
    () =>
      data
        ? Object.keys(prefillFromProjections(data, fixtures)).filter((key) => !picks[key]).length
        : 0,
    [data, fixtures, picks],
  );
  const weeks = useMemo(
    () => [...new Set(fixtures.map((f) => f.week))].sort((a, b) => a - b),
    [fixtures],
  );

  const togglePick = (
    fixture: { week: number; homeTeamId: string; awayTeamId: string },
    winner: string,
  ) => {
    const key = fixtureKey(fixture);
    setPicks((current) => {
      const next = { ...current };
      if (next[key] === winner) delete next[key];
      else next[key] = winner;
      return next;
    });
  };

  return (
    <Box className="analytics-explorer">
      <PageHeading
        title="Path to the playoffs"
        description="Pick results for the remaining games and see how your playoff chance moves — or find which games matter most."
        controls={
          <Box className="selection-bar insights-controls">
            {!shared && (
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
            )}
            <Field.Root width="auto" minW="120px" gap={2}>
              <Field.Label>Season</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={year}
                  onChange={(e) =>
                    void navigate({ search: { leagueId, year: Number(e.target.value) } })
                  }
                >
                  {(
                    snapshot?.years ||
                    Array.from({ length: defaultSeason() - 1999 }, (_, i) => defaultSeason() - i)
                  ).map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <IconButton
              aria-label="Refresh insights"
              title="Refresh insights"
              variant="outline"
              borderRadius="8px"
              flexShrink={0}
              type="button"
              disabled={loading || !!snapshot}
              onClick={() => setReload((v) => v + 1)}
            >
              <Icon name="refresh" />
            </IconButton>
          </Box>
        }
      >
        {!shared && (
          <ShareReport
            compact
            key={`${reportScope}:${data?.generatedAt}:playoff-paths`}
            path="/playoff-paths"
            search={{ leagueId, year }}
            disabled={loading || !data}
            snapshotHref={snapshot?.href}
            espn={leagues.find((l) => l.leagueId === leagueId)?.leagueType === 1}
            snapshotData={
              !loading && data
                ? {
                    leagueId,
                    view: 'playoff-paths',
                    records: [{ year, data }],
                    activeManagerKeys: result?.activeManagerKeys || [],
                    activeSeason: result?.activeSeason || year,
                  }
                : undefined
            }
          />
        )}
      </PageHeading>
      {error && !data && (
        <Box className="notice error" role="alert">
          {error}{' '}
          <Button variant="outline" type="button" onClick={() => setReload((v) => v + 1)}>
            Try again
          </Button>
        </Box>
      )}
      {loading && (
        <LoadingSkeleton
          label={
            data
              ? `Refreshing insights… Showing the report ${reportFreshnessLabel(data.generatedAt).toLowerCase()} until the refresh finishes.`
              : 'Reading season scores and transactions… This can take a moment for a full season.'
          }
        />
      )}
      {data && settings && (
        <>
          <Box
            as="section"
            className="panel insight-section analytics-explorer analytics-explorer-forecast"
            bg="bg"
            borderWidth="1px"
            rounded="lg"
            p={4}
          >
            <Flex gap={4} flexWrap="wrap" alignItems="flex-end" justifyContent="space-between">
              <Field.Root width="auto" minW="200px" gap={2}>
                <Field.Label>Team</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={effectiveTeamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    aria-label="Team"
                  >
                    {data.teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.teamName}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Box>
                <Text fontSize="sm" color="fg.muted">
                  Playoff chance{pending ? ' · updating…' : ''}
                </Text>
                <Text fontSize="4xl" fontWeight="bold" lineHeight="1">
                  {conditionalRow ? percent(conditionalRow.playoff) : '—'}
                </Text>
                {pickCount > 0 && baseRow && conditionalRow && (
                  <Text fontSize="sm">
                    Was {percent(baseRow.playoff)} with no picks · projected{' '}
                    {conditionalRow.projectedWins.toFixed(1)} wins
                  </Text>
                )}
                {pickCount === 0 && conditionalRow && (
                  <Text fontSize="sm">
                    Projected {conditionalRow.projectedWins.toFixed(1)} wins
                    {conditionalRow.bye > 0
                      ? ` · first-round bye ${percent(conditionalRow.bye)}`
                      : ''}
                  </Text>
                )}
                {conditional && (
                  <Text fontSize="sm" color="fg.muted">
                    {conditional.simulations.toLocaleString()} simulations · sampling margin ±
                    {percent(conditional.samplingMargin)}
                  </Text>
                )}
              </Box>
            </Flex>
            {forecastError && (
              <Box className="notice error" role="alert" mt={4}>
                {forecastError}
              </Box>
            )}
            {conditional?.projection?.note && (
              <Text fontSize="sm" color="fg.muted" mt={3}>
                {conditional.projection.note}
              </Text>
            )}
            <Text fontSize="sm" color="fg.muted" mt={2}>
              Picked results fix wins only; points for tiebreakers are still simulated.
            </Text>
          </Box>

          {fixtures.length === 0 ? (
            <Box as="output" className="notice" mt={4}>
              The regular season is over — there are no games left to simulate.
            </Box>
          ) : (
            <>
              <Box
                as="section"
                className="panel insight-section"
                bg="bg"
                borderWidth="1px"
                rounded="lg"
                p={4}
                mt={4}
              >
                <Flex gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between">
                  <Heading as="h2" size="md">
                    What matters most
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {selectedTeam?.teamName ?? 'This team'} · ranked by swing
                  </Text>
                </Flex>
                {leverageRows.length === 0 ? (
                  <Text mt={2} fontSize="sm">
                    {pending
                      ? 'Calculating…'
                      : Object.keys(picks).length > 0
                        ? 'Every remaining game is picked, so there is nothing left to rank — clear a pick to see what matters.'
                        : 'No remaining games to rank.'}
                  </Text>
                ) : (
                  <Box as="ol" mt={2} display="flex" flexDirection="column" gap={2}>
                    {leverageRows.slice(0, 8).map((row) => (
                      <Box as="li" key={fixtureKey(row.fixture)}>
                        <Text fontWeight="medium">
                          Week {row.fixture.week}: {names.get(row.fixture.homeTeamId)} vs{' '}
                          {names.get(row.fixture.awayTeamId)}
                        </Text>
                        <Text fontSize="sm">
                          If {names.get(row.fixture.homeTeamId)} wins: {percent(row.homeChance)} ·
                          If {names.get(row.fixture.awayTeamId)} wins: {percent(row.awayChance)}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box
                as="section"
                className="panel insight-section"
                bg="bg"
                borderWidth="1px"
                rounded="lg"
                p={4}
                mt={4}
              >
                <Flex gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between">
                  <Heading as="h2" size="md">
                    Remaining games
                  </Heading>
                  <Flex gap={2} flexWrap="wrap">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      disabled={prefillCount === 0}
                      onClick={() =>
                        data &&
                        setPicks((current) => ({
                          ...prefillFromProjections(data, fixtures),
                          ...current,
                        }))
                      }
                    >
                      Prefill from projections
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      disabled={pickCount === 0}
                      onClick={() => setPicks({})}
                    >
                      Clear picks
                    </Button>
                  </Flex>
                </Flex>
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  Tap a team to pick them to win; tap again to clear. Nothing is prefilled
                  automatically — prefill fills only games you have not picked yet.
                  {prefillCount === 0 && pickCount === 0
                    ? ' No projections cover the remaining games.'
                    : ''}
                </Text>
                {weeks.map((week) => (
                  <Box key={week} mt={4}>
                    <Heading as="h3" size="sm" mb={2}>
                      Week {week}
                    </Heading>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {fixtures
                        .filter((f) => f.week === week)
                        .map((fixture) => {
                          const key = fixtureKey(fixture);
                          const picked = picks[key];
                          const points = projectedPointsForWeek(data, week);
                          const label = (teamId: string) => {
                            const projected = points?.[teamId];
                            return `${names.get(teamId) ?? teamId}${
                              Number.isFinite(projected) ? ` · ${projected!.toFixed(1)}` : ''
                            }`;
                          };
                          return (
                            <Box key={key}>
                              <Flex gap={2} alignItems="center">
                                <Box flex="1" minW={0}>
                                  <Button
                                    size="sm"
                                    type="button"
                                    width="100%"
                                    variant={picked === fixture.homeTeamId ? 'solid' : 'outline'}
                                    colorPalette={
                                      picked === fixture.homeTeamId ? 'indigo' : undefined
                                    }
                                    aria-pressed={picked === fixture.homeTeamId}
                                    aria-label={`Pick ${names.get(fixture.homeTeamId)} to win week ${week}`}
                                    onClick={() => togglePick(fixture, fixture.homeTeamId)}
                                    whiteSpace="normal"
                                    overflowWrap="break-word"
                                    height="auto"
                                    minH="32px"
                                    py={1}
                                  >
                                    {label(fixture.homeTeamId)}
                                  </Button>
                                </Box>
                                <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                                  vs
                                </Text>
                                <Box flex="1" minW={0}>
                                  <Button
                                    size="sm"
                                    type="button"
                                    width="100%"
                                    variant={picked === fixture.awayTeamId ? 'solid' : 'outline'}
                                    colorPalette={
                                      picked === fixture.awayTeamId ? 'indigo' : undefined
                                    }
                                    aria-pressed={picked === fixture.awayTeamId}
                                    aria-label={`Pick ${names.get(fixture.awayTeamId)} to win week ${week}`}
                                    onClick={() => togglePick(fixture, fixture.awayTeamId)}
                                    whiteSpace="normal"
                                    overflowWrap="break-word"
                                    height="auto"
                                    minH="32px"
                                    py={1}
                                  >
                                    {label(fixture.awayTeamId)}
                                  </Button>
                                </Box>
                              </Flex>
                              {picked && (
                                <Text fontSize="sm" color="fg.muted" mt={1}>
                                  Picked: {names.get(picked)}
                                </Text>
                              )}
                            </Box>
                          );
                        })}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </>
      )}
      {data && !settings && (
        <Box as="output" className="notice" mt={4}>
          Playoff settings are unavailable for this league, so the simulator cannot run.
        </Box>
      )}
    </Box>
  );
}
