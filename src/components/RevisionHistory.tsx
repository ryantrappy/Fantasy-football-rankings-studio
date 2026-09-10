import { Box, Button, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useState } from 'react';
import type { LeagueApi, WeeklyRanking } from '../types';
import { logClientError } from '../logging';
export function RevisionHistory({
  api,
  ranking,
  disabled,
  onRestored,
}: {
  api: NonNullable<LeagueApi['revisions']>;
  ranking: WeeklyRanking;
  disabled: boolean;
  onRestored: () => void;
}) {
  const [entries, setEntries] = useState<{ savedAt: string; ranking: WeeklyRanking }[]>([]),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const selected = entries[index];
  async function load() {
    setBusy(true);
    setError('');
    try {
      setEntries(await api.list(ranking._id!));
      setIndex(0);
    } catch (e) {
      logClientError('revisions.load', e);
      setError('Could not load revision history.');
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await api.restore(ranking._id!, selected.ranking.revision ?? 0, ranking.revision ?? 0);
      setEntries([]);
      onRestored();
    } catch (e) {
      logClientError('revisions.restore', e);
      setError(e instanceof Error ? e.message : 'Could not restore revision.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box as="section" aria-label="Revision history" mb={4}>
      <Button variant="outline" disabled={busy} onClick={() => void load()}>
        View saved revisions
      </Button>
      {entries.length > 0 && (
        <Box p={4} mt={3} bg="bg.muted" rounded="lg">
          <NativeSelect.Root>
            <NativeSelect.Field
              aria-label="Saved revision"
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {entries.map((entry, i) => (
                <option key={entry.ranking.revision} value={i}>
                  Revision {entry.ranking.revision} · {entry.savedAt || 'Date unavailable'}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          {selected && (
            <Box mt={3} maxH="400px" overflowY="auto">
              <Heading as="h3" size="md">
                {selected.ranking.rankingsTitle}
              </Heading>
              <Text whiteSpace="pre-wrap">{selected.ranking.introduction}</Text>
              {selected.ranking.teams.map((t) => (
                <Box key={t.teamId} my={3}>
                  <Text fontWeight="bold">
                    {t.position}. {t.teamName}
                  </Text>
                  <Text whiteSpace="pre-wrap">{t.description}</Text>
                </Box>
              ))}
            </Box>
          )}
          <Text my={3}>
            Restoring creates a new saved revision. Existing history and published snapshots are
            retained.
          </Text>
          {disabled && <Text>Save or resolve your current edits before restoring.</Text>}
          <Button
            disabled={disabled || busy || selected?.ranking.revision === (ranking.revision ?? 0)}
            onClick={() => void restore()}
          >
            Restore selected revision
          </Button>
        </Box>
      )}
      {error && <Text role="alert">{error}</Text>}
    </Box>
  );
}
