import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useApi } from '../auth/session';
import type { League } from '../types';
import type { SeasonInsights } from '../insights';
import type { LiveLeague } from '../live-matchups';
import type { WaiverPool } from '../waivers';
import { defaultSeason } from '../util/rankings';
import { playerProfiles, comparePlayerRange } from '../player-profiles';
export function PlayerProfilesPage({
  search = {},
}: {
  search?: { leagueId?: string; year?: number; playerId?: string };
}) {
  const api = useApi();
  const [leagues, setLeagues] = useState<League[]>([]),
    [leagueId, setLeagueId] = useState(search.leagueId ?? ''),
    [year, setYear] = useState(search.year ?? defaultSeason()),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<string[]>(search.playerId ? [search.playerId] : []);
  const [report, setReport] = useState<SeasonInsights>(),
    [live, setLive] = useState<LiveLeague>(),
    [pool, setPool] = useState<WaiverPool>(),
    [notices, setNotices] = useState<string[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    [poolBusy, setPoolBusy] = useState(false),
    [retry, setRetry] = useState(0),
    [range, setRange] = useState([1, 18]);
  useEffect(() => {
    let active = true;
    void api.listLeagues().then(
      (rows) => {
        if (active) {
          setLeagues(rows);
          if (!search.leagueId && rows[0]) {
            setLeagueId(rows[0].leagueId);
            setYear(rows[0].seasonId);
          }
        }
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
  }, [api, search.leagueId, retry]);
  useEffect(() => {
    if (!leagueId) return;
    let active = true;
    // Clear data when the account, league or season snapshot changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setBusy(true);
    setReport(undefined);
    setLive(undefined);
    setPool(undefined);
    setError('');
    void Promise.allSettled([api.getInsights(leagueId, year), api.getLiveMatchups()]).then(
      ([insights, current]) => {
        if (!active) return;
        const failures: string[] = [];
        if (insights.status === 'fulfilled') {
          setReport(insights.value);
          failures.push(...(insights.value.partialFailures ?? []).map((entry) => entry.message));
        } else failures.push('Observed scoring history unavailable.');
        if (current.status === 'fulfilled')
          setLive(
            current.value.find((league) => league.leagueId === leagueId && league.season === year),
          );
        else failures.push('Current rosters and projections unavailable.');
        setNotices(failures);
        setBusy(false);
      },
    );
    return () => {
      active = false;
    };
  }, [api, leagueId, year, retry]);
  const league = leagues.find((row) => row.leagueId === leagueId);
  const profiles = playerProfiles(
    league?.leagueType === 1 ? 'ESPN' : 'Sleeper',
    year,
    report,
    live,
    pool,
  );
  const shown = profiles.filter((player) =>
    `${player.name} ${player.id} ${player.position ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Box>
      <Heading as="h1" mb={3}>
        Player profiles &amp; comparisons
      </Heading>
      <Flex gap={3} wrap="wrap" mb={3}>
        <label>
          Player league{' '}
          <select
            value={leagueId}
            onChange={(event) => {
              setLeagueId(event.target.value);
              setYear(leagues.find((row) => row.leagueId === event.target.value)?.seasonId ?? year);
              setSelected([]);
            }}
          >
            {leagues.map((row) => (
              <option key={row.leagueId} value={row.leagueId}>
                {row.leagueName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player season{' '}
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next >= 2000 && next <= 2100) {
                setYear(next);
                setSelected([]);
              }
            }}
          />
        </label>
        <Button disabled={busy && !!leagueId} onClick={() => setRetry((value) => value + 1)}>
          Refresh player data
        </Button>
      </Flex>
      <Text>
        Observed points use this league’s scoring and only the roster weeks present in its reports.
        Missing weeks are unavailable, not zero. This is partial season coverage, not career history
        or cross-provider name matching. Targets, snap share and other usage metrics are
        unavailable.
      </Text>
      {busy && leagueId && <Text>Loading player data…</Text>}
      {error && <Text role="alert">{error}</Text>}
      {notices.map((notice) => (
        <Text as="output" display="block" key={notice}>
          {notice}
        </Text>
      ))}
      {api.waivers && league && (
        <Button
          my={3}
          disabled={poolBusy}
          onClick={async () => {
            setPoolBusy(true);
            try {
              const next = await api.waivers!.get(leagueId, year);
              setPool(next);
              if (next.unavailable) setNotices((previous) => [...previous, next.unavailable!]);
            } catch {
              setNotices((previous) => [
                ...previous,
                'Unowned pool unavailable; select a managed team and check provider coverage.',
              ]);
            } finally {
              setPoolBusy(false);
            }
          }}
        >
          Include verified unowned pool
        </Button>
      )}
      <Box my={3}>
        <label>
          Search player name, position or provider ID{' '}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Box>
      <Box maxH="260px" overflowY="auto">
        {shown.map((player) => (
          <Box key={player.key}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(player.id)}
                onChange={(event) =>
                  setSelected((previous) =>
                    event.target.checked
                      ? [...previous, player.id]
                      : previous.filter((id) => id !== player.id),
                  )
                }
              />{' '}
              {player.name} · {player.position ?? 'Position unavailable'} · ID {player.id}
            </label>
          </Box>
        ))}
      </Box>
      {!busy && !profiles.length && (
        <Text>No covered players are available. Connect a league or refresh provider data.</Text>
      )}
      <Flex gap={3} wrap="wrap" my={3}>
        {[0, 1].map((index) => (
          <label key={index}>
            {index === 0 ? 'First comparison week' : 'Last comparison week'}{' '}
            <input
              type="number"
              min={1}
              max={18}
              value={range[index]}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isInteger(value) && value >= 1 && value <= 18)
                  setRange((previous) => previous.map((week, i) => (i === index ? value : week)));
              }}
            />
          </label>
        ))}
      </Flex>
      {range[0] > range[1] && (
        <Text role="alert">Choose a first week no later than the last week.</Text>
      )}
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        gap={4}
      >
        {profiles
          .filter((player) => selected.includes(player.id))
          .map((player) => {
            const compared = comparePlayerRange(player, range[0], range[1]);
            return (
              <Box as="section" key={player.key} borderWidth="1px" p={3} minW={0}>
                <Heading as="h2" size="md">
                  {player.name}
                </Heading>
                <Text>
                  {player.key} · Owner: {player.ownership}
                </Text>
                <Text>
                  Status:{' '}
                  {player.availability === undefined
                    ? 'Unavailable'
                    : player.availability || 'No flagged injury at snapshot'}{' '}
                  · Bye: {player.bye === undefined ? 'Unavailable' : player.bye ? 'Yes' : 'No'}
                </Text>
                <Text>
                  Observation source: {player.reportAt ?? 'Unavailable'} · roster/projection source:{' '}
                  {player.rosterAt ?? 'Unavailable'}. Verify freshness before acting.
                </Text>
                <Text>
                  Week {player.projectionWeek ?? 'unavailable'} projection:{' '}
                  {player.projection?.toFixed(2) ?? 'Unavailable'}
                </Text>
                <Text>
                  Observed total: {compared.total?.toFixed(2) ?? 'Unavailable'} · average:{' '}
                  {compared.average?.toFixed(2) ?? 'Unavailable'} · coverage: {compared.covered}/
                  {compared.expected} weeks
                </Text>
                {compared.weeks.map((week) => (
                  <Text key={week.week}>
                    Week {week.week}: {week.points?.toFixed(2) ?? 'Unavailable'}
                  </Text>
                ))}
              </Box>
            );
          })}
      </Box>
    </Box>
  );
}
