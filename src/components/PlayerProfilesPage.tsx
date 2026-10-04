import { PageHeading } from './PageHeading';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Field,
  Input,
  NativeSelect,
  SimpleGrid,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useApi } from '../auth/session';
import type { League } from '../types';
import type { SeasonInsights } from '../insights';
import type { LiveLeague } from '../live-matchups';
import type { WaiverPool } from '../waivers';
import { defaultSeason } from '../util/rankings';
import { playerProfiles, comparePlayerRange } from '../player-profiles';

const points = (value: number | null | undefined) =>
  value == null ? 'Unavailable' : value.toFixed(2);
const checkboxStyle = { width: 18, height: 18, flexShrink: 0, accentColor: '#3949ab' };

export function PlayerProfilesPage({
  search = {},
}: {
  search?: { leagueId?: string; year?: number; playerId?: string };
}) {
  const api = useApi();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueId, setLeagueId] = useState(search.leagueId ?? '');
  const [year, setYear] = useState(search.year ?? defaultSeason());
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('');
  const [selected, setSelected] = useState<string[]>(search.playerId ? [search.playerId] : []);
  const [report, setReport] = useState<SeasonInsights>();
  const [live, setLive] = useState<LiveLeague>();
  const [pool, setPool] = useState<WaiverPool>();
  const [notices, setNotices] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [poolBusy, setPoolBusy] = useState(false);
  const [poolError, setPoolError] = useState('');
  const [poolRetry, setPoolRetry] = useState(0);
  const [retry, setRetry] = useState(0);
  const [customRange, setRange] = useState<number[]>();

  useEffect(() => {
    let active = true;
    void api.listLeagues().then(
      (rows) => {
        if (!active) return;
        setLeagues(rows);
        // Refresh keeps the league and season chosen in the controls.
        if (!leagueId && rows[0]) {
          setLeagueId(rows[0].leagueId);
          if (!search.year) setYear(rows[0].seasonId);
        }
        if (!rows.length) setBusy(false);
      },
      () => {
        if (active) {
          setError('Leagues are unavailable. Try again.');
          setBusy(false);
        }
      },
    );
    return () => {
      active = false;
    };
    // The list loads on entry/refresh; changing the controls only reloads player data.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [api, retry]);

  useEffect(() => {
    if (!leagueId) return;
    let active = true;
    // Clear data when the account, league or season snapshot changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setBusy(true);
    setReport(undefined);
    setLive(undefined);
    setPool(undefined);
    setNotices([]);
    setError('');
    setPoolError('');
    setPoolBusy(false);
    void Promise.allSettled([api.getInsights(leagueId, year), api.getLiveMatchups()]).then(
      ([insights, current]) => {
        if (!active) return;
        const failures: string[] = [];
        if (insights.status === 'fulfilled') {
          setReport(insights.value);
          failures.push(...(insights.value.partialFailures ?? []).map((entry) => entry.message));
        } else failures.push('Observed scoring history unavailable.');
        if (current.status === 'fulfilled') {
          const snapshot = current.value.find(
            (row) => row.leagueId === leagueId && row.season === year,
          );
          setLive(snapshot);
          if (snapshot?.error) failures.push(snapshot.error);
        } else failures.push('Current rosters and projections unavailable.');
        setNotices(failures);
        setBusy(false);
      },
    );
    return () => {
      active = false;
    };
  }, [api, leagueId, year, retry]);

  useEffect(() => {
    if (!poolRetry || !api.waivers || !leagueId) return;
    let active = true;
    // This request is canceled when the user changes league/season or refreshes.
    // oxlint-disable-next-line react/set-state-in-effect
    setPoolBusy(true);
    setPoolError('');
    void api.waivers
      .get(leagueId, year)
      .then(
        (next) => {
          if (active) {
            setPool(next);
            setPoolError(next.unavailable ?? '');
          }
        },
        () => {
          if (active)
            setPoolError(
              'Unowned pool unavailable; select a managed team and check provider coverage.',
            );
        },
      )
      .finally(() => {
        if (active) setPoolBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api, leagueId, year, poolRetry, retry]);

  function resetContext() {
    setSelected([]);
    setQuery('');
    setPosition('');
    setPoolRetry(0);
    setRange(undefined);
  }
  function toggle(id: string) {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }
  const league = leagues.find((row) => row.leagueId === leagueId);
  const provider = league?.leagueType === 1 ? 'ESPN' : 'Sleeper';
  const profiles = playerProfiles(provider, year, report, live, pool);
  const positions = [...new Set(profiles.map((player) => player.position ?? 'Unknown'))].sort();
  const shown = profiles.filter(
    (player) =>
      (!position || (player.position ?? 'Unknown') === position) &&
      `${player.name} ${player.id} ${player.position ?? ''} ${player.ownership}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const chosen = selected.flatMap((id) => profiles.filter((player) => player.id === id));
  const observedWeeks = (report?.scores ?? [])
    .map((score) => score.week)
    .filter((week) => week >= 1 && week <= 18);
  const range = customRange ?? [
    1,
    observedWeeks.length ? Math.max(...observedWeeks) : (live?.week ?? 18),
  ];
  const validRange = range[0] <= range[1];

  return (
    <Box maxW="1200px" mx="auto">
      <PageHeading
        title="Player profiles & comparisons"
        eyebrow="Know your roster"
        description="Find players and compare their projections and observed scoring in your league."
      >
        <Button
          variant="outline"
          disabled={busy && !!leagueId}
          onClick={() => {
            setPoolRetry(0);
            setRetry((value) => value + 1);
          }}
        >
          {busy && leagueId ? 'Refreshing player data…' : 'Refresh player data'}
        </Button>
      </PageHeading>
      <Flex wrap="wrap" align="end" gap={4} p={4} mb={5} bg="bg.subtle" rounded="lg">
        <Field.Root flex="1" minW="200px">
          <Field.Label htmlFor="player-league">Player league</Field.Label>
          <NativeSelect.Root bg="bg" disabled={busy && !leagues.length}>
            <NativeSelect.Field
              id="player-league"
              value={leagueId}
              onChange={(event) => {
                setLeagueId(event.target.value);
                setYear(
                  leagues.find((row) => row.leagueId === event.target.value)?.seasonId ?? year,
                );
                resetContext();
              }}
            >
              {!leagues.length && <option value="">No connected leagues</option>}
              {leagues.map((row) => (
                <option key={row.leagueId} value={row.leagueId}>
                  {row.leagueName}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root width={{ base: '100%', sm: '140px' }}>
          <Field.Label htmlFor="player-season">Player season</Field.Label>
          <Input
            id="player-season"
            type="number"
            min={2000}
            max={2100}
            value={year}
            bg="bg"
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next >= 2000 && next <= 2100 && next !== year) {
                setYear(next);
                resetContext();
              }
            }}
          />
        </Field.Root>
        {league && (
          <Text fontSize="sm" color="fg.muted" pb={2}>
            {provider} · {year}
            {live ? ` · Projection week ${live.week}` : ''}
          </Text>
        )}
      </Flex>
      {busy && (
        <Text as="output" display="block" mb={4}>
          Loading player data…
        </Text>
      )}
      {error && (
        <Text role="alert" mb={4} color="fg.error">
          {error}
        </Text>
      )}
      {notices.map((notice) => (
        <Text as="output" display="block" mb={3} key={notice}>
          {notice}
        </Text>
      ))}
      {!busy && (
        <>
          <Box borderWidth="1px" borderStyle="solid" rounded="xl" p={4} mb={5} bg="bg">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading as="h2" size="md">
                  Selected players · {selected.length}
                </Heading>
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  {selected.length
                    ? 'Your selections stay here while you search and filter.'
                    : 'Select a player to open their profile. Add more to compare.'}
                </Text>
              </Box>
              <Button
                size="sm"
                variant="outline"
                disabled={!selected.length}
                onClick={() => setSelected([])}
              >
                Clear selection
              </Button>
            </Flex>
            {!!selected.length && (
              <Flex gap={2} wrap="wrap" mt={3}>
                {selected.map((id) => {
                  const player = profiles.find((entry) => entry.id === id);
                  return (
                    <Button
                      key={id}
                      size="sm"
                      variant="outline"
                      colorPalette="indigo"
                      whiteSpace="normal"
                      height="auto"
                      py={2}
                      maxW="100%"
                      aria-label={`Remove ${player?.name ?? `Player ${id}`} from comparison`}
                      onClick={() => toggle(id)}
                    >
                      {player?.name ?? `Player ${id}`} <span aria-hidden="true">×</span>
                    </Button>
                  );
                })}
              </Flex>
            )}
          </Box>
          <Box
            display="grid"
            gridTemplateColumns={{ base: 'minmax(0, 1fr)', lg: '320px minmax(0, 1fr)' }}
            alignItems="start"
            gap={5}
          >
            <Box
              as="section"
              aria-label="Find players"
              minW={0}
              bg="bg"
              p={4}
              borderWidth="1px"
              borderStyle="solid"
              rounded="xl"
            >
              <Heading as="h2" size="lg" mb={4}>
                Find players
              </Heading>
              <Field.Root mb={3}>
                <Field.Label htmlFor="player-search">
                  Search player name, position or provider ID
                </Field.Label>
                <Input
                  id="player-search"
                  type="search"
                  placeholder="Name, team, position or ID"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Field.Root>
              <Field.Root mb={3}>
                <Field.Label htmlFor="player-position">Position filter</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    id="player-position"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                  >
                    <option value="">All positions</option>
                    {positions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              {(query || position) && (
                <Button
                  size="sm"
                  variant="plain"
                  mb={2}
                  onClick={() => {
                    setQuery('');
                    setPosition('');
                  }}
                >
                  Reset filters
                </Button>
              )}
              <Text fontSize="xs" color="fg.muted" mb={3}>
                {shown.length} of {profiles.length} players · Current projection
              </Text>
              <Box
                as="fieldset"
                border="0"
                p={0}
                m={0}
                minW={0}
                maxH="400px"
                overflowY="auto"
                aria-label="Players to compare"
              >
                {shown.map((player) => (
                  <Box
                    as="label"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    key={player.key}
                    p={3}
                    mb={2}
                    rounded="lg"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor={selected.includes(player.id) ? 'indigo.solid' : 'border'}
                    bg={selected.includes(player.id) ? 'indigo.subtle' : 'bg'}
                    cursor="pointer"
                  >
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      aria-label={`Compare ${player.name}`}
                      checked={selected.includes(player.id)}
                      onChange={() => toggle(player.id)}
                    />
                    <Box minW={0} flex="1">
                      <Text fontWeight="semibold" overflowWrap="anywhere">
                        {player.name}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" mt={1} overflowWrap="anywhere">
                        {player.position ?? 'Unknown position'} · {player.ownership}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" mt={1}>
                        ID {player.id} · Proj. {points(player.projection)}
                      </Text>
                    </Box>
                  </Box>
                ))}
                {!shown.length && (
                  <Text py={3} color="fg.muted">
                    {profiles.length
                      ? 'No players match your filters.'
                      : 'No covered players are available. Connect a league or refresh provider data.'}
                  </Text>
                )}
              </Box>
              {api.waivers && league && (
                <Box mt={4} pt={4} borderTopWidth="1px" borderTopStyle="solid" borderColor="border">
                  <Button
                    variant="outline"
                    size="sm"
                    width="100%"
                    disabled={poolBusy}
                    onClick={() => setPoolRetry((value) => value + 1)}
                  >
                    {poolBusy
                      ? 'Loading unowned players…'
                      : pool
                        ? 'Refresh unowned players'
                        : 'Include verified unowned pool'}
                  </Button>
                  <Text fontSize="xs" color="fg.muted" mt={2}>
                    Requires a managed team and supported provider coverage.
                  </Text>
                  {poolError && (
                    <Text as="output" display="block" fontSize="sm" mt={2} color="fg.error">
                      {poolError}
                    </Text>
                  )}
                  {pool?.notices.map((notice) => (
                    <Text fontSize="xs" mt={2} key={notice}>
                      {notice}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
            <Box as="section" aria-label="Player comparison" minW={0}>
              <Flex justify="space-between" align="start" wrap="wrap" gap={4} mb={4}>
                <Box>
                  <Heading as="h2" size="lg">
                    {chosen.length === 1 ? 'Player profile' : 'Player comparison'}
                  </Heading>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    Observed points · Weeks {range[0]}–{range[1]}
                  </Text>
                </Box>
                {!!selected.length && (
                  <Flex gap={3} wrap="wrap">
                    {[0, 1].map((index) => (
                      <Field.Root key={index} width="120px">
                        <Field.Label htmlFor={`comparison-week-${index}`}>
                          {index === 0 ? 'First week' : 'Last week'}
                        </Field.Label>
                        <Input
                          id={`comparison-week-${index}`}
                          type="number"
                          min={1}
                          max={18}
                          value={range[index]}
                          bg="bg"
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isInteger(value) && value >= 1 && value <= 18)
                              setRange((previous) =>
                                (previous ?? range).map((week, i) => (i === index ? value : week)),
                              );
                          }}
                        />
                      </Field.Root>
                    ))}
                  </Flex>
                )}
              </Flex>
              {!validRange && (
                <Text role="alert" mb={4} color="fg.error">
                  Choose a first week no later than the last week.
                </Text>
              )}
              {!selected.length && (
                <Box p={6} borderWidth="1px" borderStyle="solid" rounded="xl" bg="bg">
                  <Heading as="h3" size="md">
                    Start with a player
                  </Heading>
                  <Text color="fg.muted" mt={2}>
                    Use the player list to see projections, ownership and scoring history here.
                  </Text>
                </Box>
              )}
              {!!selected.length && !chosen.length && (
                <Text>
                  Selected players are unavailable in this snapshot. Try refreshing or choose
                  another player.
                </Text>
              )}
              {validRange && (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {chosen.map((player) => {
                    const compared = comparePlayerRange(player, range[0], range[1]);
                    return (
                      <Box
                        as="section"
                        aria-label={`${player.name} profile`}
                        key={player.key}
                        minW={0}
                        bg="bg"
                        borderWidth="1px"
                        borderStyle="solid"
                        rounded="xl"
                        overflow="hidden"
                      >
                        <Box p={4}>
                          <Flex justify="space-between" align="start" gap={2}>
                            <Box minW={0}>
                              <Heading as="h3" size="md" overflowWrap="anywhere">
                                {player.name}
                              </Heading>
                              <Text fontSize="sm" color="fg.muted" mt={1}>
                                {player.position ?? 'Position unavailable'} · {player.ownership}
                              </Text>
                            </Box>
                            <Button
                              size="sm"
                              variant="plain"
                              flexShrink={0}
                              aria-label={`Remove ${player.name} profile`}
                              onClick={() => toggle(player.id)}
                            >
                              ×
                            </Button>
                          </Flex>
                          <Text fontSize="xs" color="fg.muted" mt={3}>
                            Status:{' '}
                            {player.availability === undefined
                              ? 'Unavailable'
                              : player.availability || 'No flagged injury at snapshot'}{' '}
                            · Bye:{' '}
                            {player.bye === undefined ? 'Unavailable' : player.bye ? 'Yes' : 'No'}
                          </Text>
                        </Box>
                        <Box p={4} bg="indigo.subtle" borderTopWidth="1px" borderTopStyle="solid">
                          <Text fontSize="sm" fontWeight="semibold">
                            {player.projectionWeek
                              ? `Week ${player.projectionWeek} projection`
                              : 'Current projection'}
                          </Text>
                          <Flex align="baseline" gap={2} wrap="wrap" mt={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="indigo.fg">
                              {points(player.projection)}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                              points
                            </Text>
                          </Flex>
                          {player.projectionSpread !== undefined && (
                            <Text fontSize="xs" color="fg.muted" mt={2}>
                              Source disagreement: {player.projectionSpread.toFixed(2)} points
                            </Text>
                          )}
                        </Box>
                        <Box p={4}>
                          <SimpleGrid columns={2} gap={3}>
                            {[
                              ['Observed total', compared.total],
                              ['Observed average', compared.average],
                            ].map(([label, value]) => (
                              <Box key={label as string}>
                                <Text fontSize="xs" color="fg.muted">
                                  {label}
                                </Text>
                                <Text fontSize="lg" fontWeight="bold">
                                  {points(value as number | null)}
                                </Text>
                              </Box>
                            ))}
                          </SimpleGrid>
                          <Text fontSize="sm" color="fg.muted" mt={3}>
                            Coverage: {compared.covered}/{compared.expected} weeks · Weeks{' '}
                            {range[0]}–{range[1]}
                          </Text>
                          {compared.covered < compared.expected && (
                            <Text fontSize="xs" color="fg.muted" mt={2}>
                              Totals and averages use covered weeks only. Missing weeks are
                              unavailable.
                            </Text>
                          )}
                          <Box as="details" mt={4}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                              Weekly scores
                            </summary>
                            <Box
                              as="table"
                              width="100%"
                              mt={3}
                              fontSize="sm"
                              style={{ borderCollapse: 'collapse' }}
                            >
                              <caption style={{ textAlign: 'left', marginBottom: 8 }}>
                                {player.name} · Weeks {range[0]}–{range[1]}
                              </caption>
                              <thead>
                                <tr>
                                  <th scope="col" style={{ textAlign: 'left' }}>
                                    Week
                                  </th>
                                  <th scope="col" style={{ textAlign: 'right' }}>
                                    Points
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {compared.weeks.map((week) => (
                                  <tr key={week.week}>
                                    <td style={{ padding: '8px 0' }}>{week.week}</td>
                                    <td style={{ textAlign: 'right' }}>{points(week.points)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Box>
                          </Box>
                          <Box
                            as="details"
                            mt={4}
                            fontSize="xs"
                            color="fg.muted"
                            overflowWrap="anywhere"
                          >
                            <summary style={{ cursor: 'pointer' }}>
                              Identity &amp; data sources
                            </summary>
                            <Text mt={3}>{player.key}</Text>
                            <Text mt={2}>
                              Observation source: {player.reportAt ?? 'Unavailable'} ·
                              roster/projection source: {player.rosterAt ?? 'Unavailable'}. Verify
                              freshness before acting.
                            </Text>
                            {player.projectionSources?.map((source) => (
                              <Text mt={2} key={source.provider}>
                                {source.provider}: {source.points.toFixed(2)} · player ID{' '}
                                {source.playerId} · fetched {source.capturedAt}
                              </Text>
                            ))}
                            {player.projectionNote && <Text mt={2}>{player.projectionNote}</Text>}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>
          </Box>
          <Box
            as="details"
            mt={5}
            p={4}
            borderWidth="1px"
            borderStyle="solid"
            rounded="lg"
            color="fg.muted"
            fontSize="sm"
          >
            <summary style={{ cursor: 'pointer' }}>Scoring coverage and data limits</summary>
            <Text mt={3}>
              Observed points use this league’s scoring and only the roster weeks present in its
              reports. Missing weeks are unavailable, not zero. This is partial season coverage, not
              career history or cross-provider name matching. Targets, snap share and other usage
              metrics are unavailable.
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
