import { PageHeading } from './PageHeading';
import { LoadingSkeleton } from './LoadingSkeleton';
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
import type { LiveLeague, LiveTeam } from '../live-matchups';
import { PlayerProfileLink } from './PlayerProfileLink';
import { evaluateTrade } from '../trade-analysis';

const points = (value: number | null | undefined) =>
  value == null ? 'Unavailable' : value.toFixed(2);

function Proposal({ league }: { league: LiveLeague }) {
  const teams = [
    ...new Map(
      league.matchups
        .flatMap((matchup) => [matchup.home, ...(matchup.away ? [matchup.away] : [])])
        .map((team) => [team.teamId, team]),
    ).values(),
  ];
  const [ids, setIds] = useState([teams[0]?.teamId ?? '', teams[1]?.teamId ?? '']);
  const [send, setSend] = useState<string[][]>([[], []]);
  const [search, setSearch] = useState(['', '']);
  const [openSlots, setOpenSlots] = useState([0, 0]);
  const [acknowledgeImbalance, setAcknowledge] = useState(false);
  const selected = ids.map((id) => teams.find((team) => team.teamId === id));
  const ready = selected.every(Boolean) && send.every((players) => players.length > 0);
  const imbalance = ready && send[0].length !== send[1].length;
  const gainingSide = send[0].length > send[1].length ? 1 : 0;
  const extraSlots = Math.abs(send[0].length - send[1].length);
  const result = ready
    ? evaluateTrade(selected as [LiveTeam, LiveTeam], league.lineupSlots, {
        send,
        drops: [[], []],
        openSlots,
        acknowledgeImbalance,
      })
    : undefined;

  function reset() {
    setSend([[], []]);
    setOpenSlots([0, 0]);
    setAcknowledge(false);
  }
  function toggle(side: number, id: string) {
    setSend((previous) =>
      previous.map((values, index) =>
        index === side
          ? values.includes(id)
            ? values.filter((value) => value !== id)
            : [...values, id]
          : values,
      ),
    );
    setAcknowledge(false);
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Heading as="h2" size="lg">
            Build your trade
          </Heading>
          <Text color="fg.muted" mt={1}>
            Choose the players each team sends. Lineup impact updates as you select. This
            hypothetical comparison ignores current game locks.
          </Text>
        </Box>
        <Button variant="outline" disabled={!send.flat().length} onClick={reset}>
          Clear trade
        </Button>
      </Flex>
      {imbalance && (
        <Box borderWidth="1px" borderStyle="solid" rounded="xl" p={5} mb={5} bg="bg.subtle">
          <Heading as="h3" size="md">
            Roster space for this {send[0].length}-for-{send[1].length} trade
          </Heading>
          <Text mt={2} mb={3}>
            {selected[gainingSide]?.name} receives {extraSlots} extra{' '}
            {extraSlots === 1 ? 'player' : 'players'} and needs {extraSlots} open roster{' '}
            {extraSlots === 1 ? 'slot' : 'slots'}.
          </Text>
          <Field.Root maxW="320px" mb={3}>
            <Field.Label htmlFor="trade-open-slots">
              Available open roster slots for {selected[gainingSide]?.name}
            </Field.Label>
            <Input
              id="trade-open-slots"
              type="number"
              min={0}
              max={10}
              value={openSlots[gainingSide]}
              bg="bg"
              onChange={(event) => {
                setOpenSlots((previous) =>
                  previous.map((value, index) =>
                    index === gainingSide ? Number(event.target.value) : value,
                  ),
                );
                setAcknowledge(false);
              }}
            />
          </Field.Root>
          <Flex as="label" align="center" gap={3}>
            <input
              type="checkbox"
              style={{ width: 18, height: 18, accentColor: '#3949ab' }}
              checked={acknowledgeImbalance}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            I confirm this roster space is available. No replacement players are assumed.
          </Flex>
        </Box>
      )}
      {result?.error && (!imbalance || acknowledgeImbalance) && (
        <Text as="output" display="block" mb={4} color="fg.error">
          {result.error}
        </Text>
      )}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
        {[0, 1].map((side) => {
          const team = selected[side];
          const roster = team?.players.filter((player) => player.owned && !player.reserve) ?? [];
          const query = search[side].trim().toLowerCase();
          const visible = roster.filter((player) =>
            `${player.name} ${player.position ?? ''}`.toLowerCase().includes(query),
          );
          const receiving =
            selected[1 - side]?.players.filter((player) => send[1 - side].includes(player.id)) ??
            [];
          const impact = result?.sides[side];
          return (
            <Box
              key={side}
              as="section"
              aria-label={`Trade team ${side + 1}`}
              minW={0}
              borderWidth="1px"
              borderStyle="solid"
              rounded="xl"
              bg="bg"
              overflow="hidden"
            >
              <Box p={5} bg="bg.subtle">
                <Field.Root>
                  <Field.Label htmlFor={`trade-team-${side}`}>Trade team {side + 1}</Field.Label>
                  <NativeSelect.Root bg="bg">
                    <NativeSelect.Field
                      id={`trade-team-${side}`}
                      value={ids[side]}
                      onChange={(event) => {
                        setIds((previous) =>
                          previous.map((value, index) =>
                            index === side ? event.target.value : value,
                          ),
                        );
                        reset();
                        setSearch(['', '']);
                      }}
                    >
                      <option value="">Choose team</option>
                      {teams.map((option) => (
                        <option
                          key={option.teamId}
                          value={option.teamId}
                          disabled={option.teamId === ids[1 - side]}
                        >
                          {option.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Box mt={4} aria-label={`${team?.name ?? `Team ${side + 1}`} exchange`}>
                  <Text fontWeight="semibold" fontSize="sm">
                    Sending · {send[side].length} selected
                  </Text>
                  {send[side].length ? (
                    <Flex wrap="wrap" gap={2} mt={2}>
                      {roster
                        .filter((player) => send[side].includes(player.id))
                        .map((player) => (
                          <Button
                            key={player.id}
                            size="sm"
                            whiteSpace="normal"
                            height="auto"
                            py={2}
                            maxW="100%"
                            variant="outline"
                            bg="bg"
                            onClick={() => toggle(side, player.id)}
                            aria-label={`Remove ${player.name} from trade`}
                          >
                            {player.name} <span aria-hidden="true">×</span>
                          </Button>
                        ))}
                    </Flex>
                  ) : (
                    <Text fontSize="sm" color="fg.muted" mt={1}>
                      Select players below.
                    </Text>
                  )}
                  <Text fontWeight="semibold" fontSize="sm" mt={3}>
                    Receiving · {receiving.length} {receiving.length === 1 ? 'player' : 'players'}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {receiving.length
                      ? receiving.map((player) => player.name).join(', ')
                      : 'Choose players on the other team.'}
                  </Text>
                </Box>
              </Box>
              <Box
                p={5}
                borderTopWidth="1px"
                borderTopStyle="solid"
                bg={impact ? 'indigo.subtle' : 'bg'}
                aria-label={`${team?.name ?? `Team ${side + 1}`} lineup impact`}
              >
                <Text fontWeight="semibold" fontSize="sm">
                  Week {league.week} lineup impact
                </Text>
                {impact ? (
                  <>
                    <Flex align="baseline" gap={2} mt={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="indigo.fg">
                        {impact.difference === null
                          ? 'Unavailable'
                          : `${impact.difference >= 0 ? '+' : ''}${impact.difference.toFixed(2)}`}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        projected points
                      </Text>
                    </Flex>
                    <Text fontSize="sm">
                      Before: {points(impact.before)} → After: {points(impact.after)}
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mt={2}>
                      Active roster: {impact.rosterSize} ·{' '}
                      {impact.coverage
                        .map((entry) => `${entry.position} ${entry.count}`)
                        .join(' · ')}
                    </Text>
                    {impact.notices.map((notice) => (
                      <Text fontSize="sm" mt={2} key={notice}>
                        {notice}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text fontSize="sm" color="fg.muted" mt={2}>
                    {ready
                      ? 'Confirm roster space above to see the impact.'
                      : 'Select at least one player from each team to compare.'}
                  </Text>
                )}
              </Box>
              <Box p={5} borderTopWidth="1px" borderTopStyle="solid">
                <Field.Root mb={3}>
                  <Field.Label htmlFor={`trade-search-${side}`}>Find a player</Field.Label>
                  <Input
                    id={`trade-search-${side}`}
                    type="search"
                    placeholder="Search name or position"
                    value={search[side]}
                    onChange={(event) =>
                      setSearch((previous) =>
                        previous.map((value, index) =>
                          index === side ? event.target.value : value,
                        ),
                      )
                    }
                  />
                </Field.Root>
                <Flex
                  justify="space-between"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={2}
                  pr={3}
                >
                  <Text>
                    {visible.length} of {roster.length} players
                  </Text>
                  <Text>Week {league.week} proj.</Text>
                </Flex>
                <Box
                  maxH="360px"
                  overflowY="auto"
                  as="fieldset"
                  border="0"
                  p="0"
                  minW="0"
                  aria-label={`${team?.name ?? `Team ${side + 1}`} players to send`}
                >
                  {visible.map((player) => (
                    <Flex
                      key={player.id}
                      align="center"
                      gap={3}
                      p={3}
                      mb={2}
                      borderWidth="1px"
                      borderStyle="solid"
                      borderColor={send[side].includes(player.id) ? 'indigo.solid' : 'border'}
                      rounded="lg"
                      bg={send[side].includes(player.id) ? 'indigo.subtle' : 'bg'}
                    >
                      <Box
                        as="label"
                        display="flex"
                        alignItems="center"
                        gap={3}
                        flex="1"
                        minW={0}
                        cursor="pointer"
                      >
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18, flexShrink: 0, accentColor: '#3949ab' }}
                          aria-label={`Send ${player.name}`}
                          checked={send[side].includes(player.id)}
                          onChange={() => toggle(side, player.id)}
                        />
                        <Box minW={0}>
                          <Text fontWeight="semibold" overflowWrap="anywhere">
                            {player.name}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {player.position ?? 'Unknown'} ·{' '}
                            {player.locked ? 'Game locked' : player.starter ? 'Starter' : 'Bench'}
                            {player.bye ? ' · Bye' : ''}
                          </Text>
                        </Box>
                      </Box>
                      <Box textAlign="right" flexShrink={0}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {points(player.projectedPoints)}
                        </Text>
                        <Text fontSize="xs">
                          <PlayerProfileLink
                            leagueId={league.leagueId}
                            year={league.season}
                            playerId={player.id}
                          >
                            Profile
                          </PlayerProfileLink>
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                  {!visible.length && (
                    <Text color="fg.muted" py={4}>
                      {roster.length
                        ? 'No players match your search.'
                        : 'No active owned players available.'}
                    </Text>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>
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
        <summary style={{ cursor: 'pointer' }}>
          Projection source and limits · Week {league.week}
        </summary>
        <Text mt={3}>
          {league.provider} · {league.season} · Snapshot: {league.capturedAt ?? 'Unavailable'}.
        </Text>
        <Text mt={2}>
          Compares each team’s best legal lineup for the current week. Future weeks, draft picks,
          positional roster caps, trade deadlines, approval rules and matchup/playoff changes are
          not simulated. This is not a fair-value verdict; confirm provider eligibility and refresh
          stale rosters. No roster changes are submitted.
        </Text>
      </Box>
    </Box>
  );
}
export function TradeAnalyzerPage() {
  const api = useApi();
  const [leagues, setLeagues] = useState<LiveLeague[]>([]),
    [id, setId] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    // Load an account-owned live snapshot on entry or explicit refresh.
    // oxlint-disable-next-line react/set-state-in-effect
    setBusy(true);
    void api
      .getLiveMatchups()
      .then(
        (rows) => {
          if (active) {
            setLeagues(rows);
            setId((previous) =>
              rows.some((league) => league.leagueId === previous)
                ? previous
                : (rows[0]?.leagueId ?? ''),
            );
            setError('');
          }
        },
        () => {
          if (active) {
            setLeagues([]);
            setError('Trade roster data is unavailable. Try again.');
          }
        },
      )
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api, retry]);
  const selected = leagues.find((league) => league.leagueId === id);
  return (
    <Box maxW="1200px" mx="auto">
      <PageHeading
        title="Trade analyzer"
        eyebrow="Find the right exchange"
        description="See how a player exchange changes both teams’ weekly lineups."
      >
        <Button variant="outline" disabled={busy} onClick={() => setRetry((value) => value + 1)}>
          {busy ? 'Refreshing rosters…' : 'Refresh trade rosters'}
        </Button>
      </PageHeading>
      {busy && <LoadingSkeleton label="Loading rosters…" />}
      {error && <Text role="alert">{error}</Text>}
      {leagues.length > 0 && (
        <Flex align="end" wrap="wrap" gap={4} mb={6} p={4} bg="bg.subtle" rounded="lg">
          <Field.Root maxW="400px">
            <Field.Label htmlFor="trade-league">Trade league</Field.Label>
            <NativeSelect.Root bg="bg" disabled={busy}>
              <NativeSelect.Field
                id="trade-league"
                value={id}
                onChange={(event) => setId(event.target.value)}
              >
                {leagues.map((league) => (
                  <option key={league.leagueId} value={league.leagueId}>
                    {league.leagueName}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {selected && (
            <Text fontSize="sm" color="fg.muted" pb={2}>
              {selected.provider} · {selected.season} · Week {selected.week}
            </Text>
          )}
        </Flex>
      )}
      {!busy &&
        (selected?.error ? (
          <Text as="output">{selected.error}</Text>
        ) : selected ? (
          <Proposal
            key={`${selected.leagueId}:${selected.capturedAt}:${retry}`}
            league={selected}
          />
        ) : (
          !error && <Text>Connect a league to compare hypothetical trades.</Text>
        ))}
    </Box>
  );
}
