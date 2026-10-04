import { Box, Heading, Text } from '@chakra-ui/react';
import { useState } from 'react';
import type { LiveTeam } from '../live-matchups';
import { adviseLineup } from '../lineup-advisor';
export function LineupAdvisor({
  team,
  slots,
  capturedAt,
}: {
  team: LiveTeam;
  slots?: string[];
  capturedAt?: string;
}) {
  const [excluded, setExcluded] = useState<string[]>([]);
  const advice = adviseLineup(team.players, slots, excluded);
  const [now] = useState(() => Date.now());
  const stale = !capturedAt || now - new Date(capturedAt).getTime() > 5 * 60_000;
  return (
    <Box mt={3}>
      <Heading as="h4" size="md">
        Weekly lineup advisor
      </Heading>
      <Text fontSize="sm">
        Roster captured: {capturedAt ?? 'Unavailable'}.{' '}
        {stale ? 'Roster may be stale; refresh before acting.' : ''} Read-only scenarios; verify
        provider locks and rules before editing your lineup.
      </Text>
      <Text>
        Submitted projection: {advice.submitted?.toFixed(2) ?? 'Unavailable'} · Proposed:{' '}
        {advice.proposed?.toFixed(2) ?? 'Unavailable'} · Change:{' '}
        {advice.difference === null
          ? 'Unavailable'
          : `${advice.difference >= 0 ? '+' : ''}${advice.difference.toFixed(2)}`}
      </Text>
      {advice.reason && <Text as="output">{advice.reason}</Text>}
      {advice.starts.length > 0 && (
        <Text>
          Start:{' '}
          {advice.starts
            .map((player) => `${player.name} (${player.projectedPoints?.toFixed(2) ?? '—'})`)
            .join(', ')}
        </Text>
      )}
      {advice.benches.length > 0 && (
        <Text>
          Bench:{' '}
          {advice.benches
            .map((player) => `${player.name} (${player.projectedPoints?.toFixed(2) ?? '—'})`)
            .join(', ')}
        </Text>
      )}
      {advice.assignment.map(({ slot, player }) => (
        <Text key={player.id}>
          {slot}: {player.name}
          {player.locked ? ' (locked)' : ''}
        </Text>
      ))}
      {advice.notices.map((notice) => (
        <Text as="output" display="block" key={notice}>
          {notice}
        </Text>
      ))}
      <details>
        <summary>Inspect alternative scenarios</summary>
        {team.players
          .filter((player) => !player.reserve)
          .map((player) => (
            <Box key={player.id}>
              <label>
                <input
                  type="checkbox"
                  checked={excluded.includes(player.id)}
                  disabled={player.locked}
                  onChange={(event) =>
                    setExcluded((previous) =>
                      event.target.checked
                        ? [...previous, player.id]
                        : previous.filter((id) => id !== player.id),
                    )
                  }
                />{' '}
                Exclude {player.name}
              </label>
            </Box>
          ))}
      </details>
    </Box>
  );
}
