import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useApi } from '../auth/session';
import type { LiveLeague, LiveTeam } from '../live-matchups';
import { PlayerProfileLink } from './PlayerProfileLink';
import { evaluateTrade } from '../trade-analysis';
function Proposal({ league }: { league: LiveLeague }) {
  const teams = [
    ...new Map(
      league.matchups
        .flatMap((matchup) => [matchup.home, ...(matchup.away ? [matchup.away] : [])])
        .map((team) => [team.teamId, team]),
    ).values(),
  ];
  const [ids, setIds] = useState([teams[0]?.teamId ?? '', teams[1]?.teamId ?? '']);
  const [send, setSend] = useState<string[][]>([[], []]),
    [drops, setDrops] = useState<string[][]>([[], []]),
    [openSlots, setOpenSlots] = useState([0, 0]),
    [acknowledgeImbalance, setAcknowledge] = useState(false);
  const selected = ids.map((id) => teams.find((team) => team.teamId === id));
  const result = selected.every(Boolean)
    ? evaluateTrade(selected as [LiveTeam, LiveTeam], league.lineupSlots, {
        send,
        drops,
        openSlots,
        acknowledgeImbalance,
      })
    : undefined;
  function toggle(
    set: React.Dispatch<React.SetStateAction<string[][]>>,
    side: number,
    id: string,
    checked: boolean,
  ) {
    set((previous) =>
      previous.map((values, index) =>
        index === side
          ? checked
            ? [...values, id]
            : values.filter((value) => value !== id)
          : values,
      ),
    );
  }
  return (
    <Box>
      <label>
        Trade projection week{' '}
        <select value={league.week} onChange={() => {}}>
          <option value={league.week}>Week {league.week} (available snapshot)</option>
        </select>
      </label>
      <Text>
        {league.provider} · {league.season} · Available projection week {league.week}. Snapshot:{' '}
        {league.capturedAt ?? 'Unavailable'}.
      </Text>
      <Text>
        Current-week hypothetical legal lineup comparison. Future weeks, draft picks, positional
        roster caps, trade deadlines, approval rules and matchup/playoff changes are not simulated.
        This is not a fair-value verdict; confirm provider eligibility and refresh stale rosters.
      </Text>
      <Flex wrap="wrap" gap={4} mt={4}>
        {[0, 1].map((side) => (
          <Box key={side} flex="1" minW="260px">
            <label>
              Trade team {side + 1}{' '}
              <select
                value={ids[side]}
                onChange={(event) => {
                  setIds((previous) =>
                    previous.map((value, index) => (index === side ? event.target.value : value)),
                  );
                  setSend([[], []]);
                  setDrops([[], []]);
                }}
              >
                <option value="">Choose team</option>
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            {selected[side]?.players
              .filter((player) => player.owned && !player.reserve)
              .map((player) => (
                <Box key={player.id} mt={2}>
                  <Text>
                    <PlayerProfileLink
                      leagueId={league.leagueId}
                      year={league.season}
                      playerId={player.id}
                    >
                      {player.name}
                    </PlayerProfileLink>{' '}
                    · {player.position} ·{' '}
                    {player.projectedPoints?.toFixed(2) ?? 'Projection unavailable'}
                  </Text>
                  <label>
                    <input
                      type="checkbox"
                      checked={send[side].includes(player.id)}
                      disabled={player.locked}
                      onChange={(event) => toggle(setSend, side, player.id, event.target.checked)}
                    />{' '}
                    Send {player.name}
                  </label>{' '}
                  <label>
                    <input
                      type="checkbox"
                      checked={drops[side].includes(player.id)}
                      disabled={player.locked}
                      onChange={(event) => toggle(setDrops, side, player.id, event.target.checked)}
                    />{' '}
                    Drop {player.name}
                  </label>
                </Box>
              ))}
            <label>
              Assumed open roster slots for team {side + 1}{' '}
              <input
                type="number"
                min={0}
                max={10}
                value={openSlots[side]}
                onChange={(event) =>
                  setOpenSlots((previous) =>
                    previous.map((value, index) =>
                      index === side ? Number(event.target.value) : value,
                    ),
                  )
                }
              />
            </label>
          </Box>
        ))}
      </Flex>
      <Box mt={3}>
        <label>
          <input
            type="checkbox"
            checked={acknowledgeImbalance}
            onChange={(event) => setAcknowledge(event.target.checked)}
          />{' '}
          Confirm drops/open-slot assumptions for an unbalanced trade; no replacement waiver
          acquisition is assumed.
        </label>
      </Box>
      {result?.error && (
        <Text as="output" mt={3}>
          {result.error}
        </Text>
      )}
      {result?.sides.map((side) => (
        <Box key={side.teamId} mt={4} borderWidth="1px" p={3}>
          <Heading as="h2" size="md">
            {side.name}
          </Heading>
          <Text>
            Legal lineup before: {side.before?.toFixed(2) ?? 'Unavailable'} · after:{' '}
            {side.after?.toFixed(2) ?? 'Unavailable'} · change:{' '}
            {side.difference === null
              ? 'Unavailable'
              : `${side.difference >= 0 ? '+' : ''}${side.difference.toFixed(2)}`}
          </Text>
          <Text>
            Active roster after: {side.rosterSize}. Positions:{' '}
            {side.coverage.map((entry) => `${entry.position} ${entry.count}`).join(', ')}.
          </Text>
          {side.notices.map((notice) => (
            <Text as="output" display="block" key={notice}>
              {notice}
            </Text>
          ))}
        </Box>
      ))}
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
    <Box>
      <Heading as="h1" mb={3}>
        Trade analyzer
      </Heading>
      <Button disabled={busy} onClick={() => setRetry((value) => value + 1)}>
        Refresh trade rosters
      </Button>
      {busy && <Text>Loading rosters…</Text>}
      {error && <Text role="alert">{error}</Text>}
      <Box my={3}>
        <label>
          Trade league{' '}
          <select value={id} onChange={(event) => setId(event.target.value)}>
            {leagues.map((league) => (
              <option key={league.leagueId} value={league.leagueId}>
                {league.leagueName}
              </option>
            ))}
          </select>
        </label>
      </Box>
      {selected?.error ? (
        <Text as="output">{selected.error}</Text>
      ) : selected ? (
        <Proposal key={`${selected.leagueId}:${selected.capturedAt}`} league={selected} />
      ) : (
        !busy && <Text>Connect a league to compare hypothetical trades.</Text>
      )}
    </Box>
  );
}
