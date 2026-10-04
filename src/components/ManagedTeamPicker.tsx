import { Box, Button, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { LeagueApi, ManagedTeamSelection } from '../types';

export function ManagedTeamPicker({
  api,
  leagueId,
  initialYear,
}: {
  api: NonNullable<LeagueApi['managedTeam']>;
  leagueId: string;
  initialYear: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [selection, setSelection] = useState<ManagedTeamSelection>();
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    // Reset state before loading the newly selected season.
    // oxlint-disable-next-line react/set-state-in-effect
    setSelection(undefined);
    setError('');
    setNotice('');
    void api.get(leagueId, year).then(
      (result) => {
        if (!active) return;
        setSelection(result);
        setTeamId(result.teamId ?? '');
      },
      () => {
        if (active) setError('Could not load teams. Check the season and retry.');
      },
    );
    return () => {
      active = false;
    };
  }, [api, leagueId, year, retry]);
  return (
    <Box mt={4}>
      <label htmlFor={`my-team-year-${leagueId}`}>My team season</label>{' '}
      <input
        id={`my-team-year-${leagueId}`}
        type="number"
        min={2000}
        max={2100}
        value={year}
        disabled={busy}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isInteger(next) && next >= 2000 && next <= 2100) setYear(next);
        }}
      />
      {selection ? (
        <Box
          as="form"
          mt={2}
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            setNotice('');
            try {
              const result = await api.set(leagueId, year, teamId || null);
              setSelection(result);
              setTeamId(result.teamId ?? '');
              setNotice(
                result.teamId ? 'Your managed team was saved.' : 'Commissioner mode saved.',
              );
            } catch {
              setError('Could not save your team. Reload teams and try again.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor={`my-team-${leagueId}`}>My managed team</label>{' '}
          <select
            id={`my-team-${leagueId}`}
            value={teamId}
            disabled={busy}
            onChange={(event) => setTeamId(event.target.value)}
          >
            <option value="">No team / commissioner mode</option>
            {selection.teams.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName} — {team.managerName}
              </option>
            ))}
          </select>
          {selection.needsReselection && (
            <Text as="output">
              Your saved team is no longer available or its manager changed. Choose your team again.
            </Text>
          )}
          <Button type="submit" ml={2} disabled={busy}>
            Save my team
          </Button>
        </Box>
      ) : (
        !error && <Text>Loading teams…</Text>
      )}
      {notice && <Text as="output">{notice}</Text>}
      {error && <Text role="alert">{error}</Text>}
      <Button
        mt={2}
        variant="outline"
        disabled={busy}
        onClick={() => setRetry((value) => value + 1)}
      >
        Reload teams
      </Button>
    </Box>
  );
}
