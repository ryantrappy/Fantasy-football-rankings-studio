/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Named overflow sections must be focusable for keyboard table scrolling. */
import './decision-explorer.css';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useState } from 'react';
import type { LiveTeam } from '../live-matchups';
import { PlayerProfileLink } from './PlayerProfileLink';
import { InfoTooltip } from './InfoTooltip';
import { adviseLineup } from '../lineup-advisor';
export function LineupAdvisor({
  team,
  slots,
  capturedAt,
  leagueId,
  year,
  excludedIds,
  onExcludedChange,
}: {
  team: LiveTeam;
  slots?: string[];
  capturedAt?: string;
  leagueId?: string;
  year?: number;
  excludedIds?: string[];
  onExcludedChange?: (ids: string[]) => void;
}) {
  const [localExcluded, setExcluded] = useState<string[]>([]);
  const excluded = excludedIds ?? localExcluded;
  const advice = adviseLineup(team.players, slots, excluded);
  const [now] = useState(() => Date.now());
  const stale = !capturedAt || now - new Date(capturedAt).getTime() > 5 * 60_000;
  return (
    <Box className="decision-explorer decision-explorer-advisor" mt={3}>
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
      <section
        className="decision-explorer-table-wrap"
        tabIndex={0}
        aria-label={`Complete proposed lineup for ${team.name} · ${leagueId ?? 'current team'} · ${year ?? 'current season'}`}
      >
        <table className="decision-explorer-table">
          <caption>
            Complete proposed lineup{' '}
            <InfoTooltip label="Lineup projection method">
              Uses the selected league’s slots and available projections from starters and bench.
              Known locked starters stay fixed. Missing projections and unknown locks remain
              explicit below.
            </InfoTooltip>
          </caption>
          <thead>
            <tr>
              <th scope="col">Slot</th>
              <th scope="col">Proposed starter</th>
              <th scope="col">Status</th>
              <th scope="col">Projection</th>
            </tr>
          </thead>
          <tbody>
            {advice.assignment.map(({ slot, player }, index) => (
              <tr key={`${slot}:${index}`}>
                <td>{slot}</td>
                <td>
                  {leagueId && year ? (
                    <PlayerProfileLink leagueId={leagueId} year={year} playerId={player.id}>
                      {player.name}
                    </PlayerProfileLink>
                  ) : (
                    player.name
                  )}
                </td>
                <td>
                  {player.locked
                    ? 'Locked'
                    : player.locked === undefined
                      ? 'Lock unknown'
                      : 'Unlocked'}
                  {player.availability ? ` · ${player.availability}` : ''}
                </td>
                <td>{player.projectedPoints?.toFixed(2) ?? 'Unavailable'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <details>
        <summary>Submitted lineup and all roster inputs</summary>
        <section
          className="decision-explorer-table-wrap"
          tabIndex={0}
          aria-label={`Submitted lineup and bench evidence for ${team.name} · ${leagueId ?? 'current team'} · ${year ?? 'current season'}`}
        >
          <table className="decision-explorer-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Submitted slot</th>
                <th scope="col">Status</th>
                <th scope="col">Projection / source</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    {player.reserve
                      ? 'Reserve'
                      : player.starter
                        ? (player.lineupSlot ?? 'Starter')
                        : 'Bench'}
                  </td>
                  <td>
                    {player.bye ? 'Bye · ' : ''}
                    {player.availability || 'No flagged injury'} ·{' '}
                    {player.locked
                      ? 'Locked'
                      : player.locked === undefined
                        ? 'Lock unknown'
                        : 'Unlocked'}
                    {excluded.includes(player.id) ? ' · Excluded from scenario' : ''}
                  </td>
                  <td>
                    {player.projectedPoints?.toFixed(2) ?? 'Unavailable'} ·{' '}
                    {player.projectionMethod ?? 'native'}
                    {player.projectionSources?.map((source) => (
                      <div key={source.provider}>
                        {source.provider}: {source.points.toFixed(2)} · {source.capturedAt}
                      </div>
                    ))}
                    {player.projectionNote && <div>{player.projectionNote}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </details>
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
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...excluded, player.id]
                      : excluded.filter((id) => id !== player.id);
                    setExcluded(next);
                    onExcludedChange?.(next);
                  }}
                />{' '}
                Exclude {player.name}
              </label>
            </Box>
          ))}
      </details>
    </Box>
  );
}
