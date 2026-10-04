import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import type { LeagueApi } from '../types';
import { PlayerProfileLink } from './PlayerProfileLink';
import { recommendedDrop, waiverImpact, type WaiverPool } from '../waivers';
export function WaiverAdvisor({
  api,
  leagueId,
  year,
}: {
  api: NonNullable<LeagueApi['waivers']>;
  leagueId: string;
  year: number;
}) {
  const [pool, setPool] = useState<WaiverPool>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [position, setPosition] = useState(''),
    [candidateId, setCandidateId] = useState(''),
    [dropId, setDropId] = useState('');
  const candidate = pool?.candidates.find((player) => player.id === candidateId);
  const impact = pool && candidate ? waiverImpact(pool, candidate, dropId) : undefined;
  return (
    <Box mt={3}>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            setPool(await api.get(leagueId, year));
            setCandidateId('');
            setDropId('');
          } catch {
            setPool(undefined);
            setError('Available-player data could not refresh. Try again.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Loading available players…' : 'Load / refresh available players'}
      </Button>
      {error && <Text role="alert">{error}</Text>}
      {pool && (
        <>
          <Text>
            Week {pool.week ?? 'unavailable'} · Ownership checked {pool.capturedAt} · Rosters{' '}
            {pool.ownership
              ? `${pool.ownership.covered}/${pool.ownership.expected}`
              : 'unavailable'}
          </Text>
          {pool.unavailable ? (
            <Text as="output">{pool.unavailable}</Text>
          ) : (
            <>
              <label>
                Available-player position{' '}
                <select
                  value={position}
                  onChange={(event) => {
                    setPosition(event.target.value);
                    setCandidateId('');
                    setDropId('');
                  }}
                >
                  <option value="">All positions</option>
                  {[...new Set(pool.candidates.map((player) => player.position))]
                    .filter(Boolean)
                    .sort()
                    .map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                </select>
              </label>
              <Box mt={2}>
                <label>
                  Unowned candidate{' '}
                  <select
                    value={candidateId}
                    onChange={(event) => {
                      setCandidateId(event.target.value);
                      const next = pool.candidates.find(
                        (player) => player.id === event.target.value,
                      );
                      setDropId(next ? (recommendedDrop(pool, next)?.player.id ?? '') : '');
                    }}
                  >
                    <option value="">Choose candidate</option>
                    {pool.candidates
                      .filter((player) => !position || player.position === position)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} · {player.position} ·{' '}
                          {player.projectedPoints?.toFixed(2) ?? 'Projection unavailable'}
                          {player.bye ? ' · Bye' : ''}
                          {player.availability ? ` · ${player.availability}` : ''}
                        </option>
                      ))}
                  </select>
                </label>
              </Box>
              <Box mt={2}>
                <label>
                  Hypothetical roster drop{' '}
                  <select value={dropId} onChange={(event) => setDropId(event.target.value)}>
                    <option value="">Choose same-position drop</option>
                    {pool.team?.players
                      .filter(
                        (player) =>
                          !player.reserve &&
                          !player.locked &&
                          player.position === candidate?.position,
                      )
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                  </select>
                </label>
              </Box>
              {candidate && (
                <PlayerProfileLink leagueId={leagueId} year={year} playerId={candidate.id}>
                  View {candidate.name} profile
                </PlayerProfileLink>
              )}
              {candidate && (
                <Text>
                  {candidate.locked
                    ? 'Candidate’s game has started; no add/drop impact is recommended.'
                    : candidate.locked === undefined
                      ? 'Candidate lock state is unknown; verify at your provider.'
                      : ''}
                </Text>
              )}
              {impact && (
                <Text>
                  Optimized current-week lineup change:{' '}
                  {impact.difference === null
                    ? 'Unavailable'
                    : `${impact.difference >= 0 ? '+' : ''}${impact.difference.toFixed(2)} points`}
                  . {impact.reason}
                </Text>
              )}
            </>
          )}
          {pool.notices.map((notice) => (
            <Text as="output" display="block" key={notice}>
              {notice}
            </Text>
          ))}
        </>
      )}
    </Box>
  );
}
