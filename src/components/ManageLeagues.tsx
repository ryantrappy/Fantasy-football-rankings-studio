import { Box, Button, Heading, Input, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { League, LeagueApi } from '../types';
import { logClientError } from '../logging';
export function ManageLeagues({ api }: { api: LeagueApi }) {
  const [archived, setArchived] = useState(false),
    [leagues, setLeagues] = useState<League[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [editing, setEditing] = useState(''),
    [name, setName] = useState(''),
    [providerId, setProviderId] = useState(''),
    [deleting, setDeleting] = useState(''),
    [deleteConfirmation, setDeleteConfirmation] = useState(''),
    [nameError, setNameError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    // Reset the loading indicator for the external list request.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError('');
    void (archived ? api.management!.archived() : api.listLeagues())
      .then(
        (rows) => {
          if (active) setLeagues(rows);
        },
        (e) => {
          logClientError('leagues.manage', e);
          if (active) setError('Could not load leagues.');
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, archived, retry]);
  return (
    <Box>
      <Heading as="h1" size="2xl" mb={4}>
        Manage leagues
      </Heading>
      <Text mb={4}>
        Archiving removes a league from active pickers. Rankings and public sharing stay intact.
      </Text>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          setArchived((v) => !v);
          setNotice('');
        }}
      >
        {archived ? 'Show active leagues' : 'Show archived leagues'}
      </Button>
      <Text as="output" my={3}>
        {notice}
      </Text>
      {loading ? (
        <Text>Loading leagues…</Text>
      ) : leagues.length ? (
        leagues.map((league) => (
          <Box
            key={league.providerLeagueId ?? league.leagueId}
            p={4}
            my={3}
            bg="bg"
            borderWidth="1px"
            rounded="lg"
          >
            <Heading as="h2" size="md">
              {league.leagueName}
            </Heading>
            <Text my={2}>
              {league.leagueType === 0 ? 'Sleeper' : 'ESPN'} ·{' '}
              {league.providerLeagueId ?? league.leagueId}
            </Text>
            {editing === league.leagueId ? (
              <Box
                as="form"
                mb={3}
                onSubmit={async (event) => {
                  event.preventDefault();
                  const leagueName = name.trim();
                  if (!leagueName) {
                    setNameError('Enter a league display name.');
                    return;
                  }
                  if (leagueName.length > 120) {
                    setNameError('League display name must be at most 120 characters.');
                    return;
                  }
                  setBusy(true);
                  setError('');
                  setNameError('');
                  try {
                    const renamed = await api.management!.rename(league.leagueId, leagueName);
                    setLeagues((rows) =>
                      rows.map((row) => (row.leagueId === renamed.leagueId ? renamed : row)),
                    );
                    setNotice(`${league.leagueName} renamed to ${renamed.leagueName}.`);
                    setEditing('');
                  } catch (e) {
                    logClientError('leagues.rename', e);
                    setNameError('Could not rename the league. Check the name and try again.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor={`league-name-${league.leagueId}`}>Display name</label>
                <Input
                  id={`league-name-${league.leagueId}`}
                  value={name}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? `league-name-error-${league.leagueId}` : undefined}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError('');
                  }}
                />
                {nameError && (
                  <Text id={`league-name-error-${league.leagueId}`} role="alert">
                    {nameError}
                  </Text>
                )}
                <Button type="submit" mt={2} mr={2} disabled={busy}>
                  Save display name
                </Button>
                <Button
                  type="button"
                  mt={2}
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing('');
                    setNameError('');
                  }}
                >
                  Cancel rename
                </Button>
              </Box>
            ) : (
              <>
                <Button
                  mr={2}
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing(league.leagueId);
                    setName(league.leagueName);
                    setNameError('');
                    setNotice('');
                  }}
                >
                  Edit display name
                </Button>
                <Button
                  mr={2}
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing(`provider-${league.leagueId}`);
                    setProviderId(league.providerLeagueId ?? league.leagueId);
                    setNameError('');
                    setNotice('');
                  }}
                >
                  Edit provider league ID
                </Button>
              </>
            )}
            {editing === `provider-${league.leagueId}` && (
              <Box
                as="form"
                mb={3}
                onSubmit={async (event) => {
                  event.preventDefault();
                  const id = providerId.trim();
                  if (!/^\d{1,30}$/.test(id)) {
                    setNameError('Enter a valid numeric provider league ID.');
                    return;
                  }
                  setBusy(true);
                  setNameError('');
                  try {
                    const updated = await api.management!.updateProviderId(league.leagueId, id);
                    setLeagues((rows) =>
                      rows.map((row) => (row.leagueId === updated.leagueId ? updated : row)),
                    );
                    setNotice(
                      `${league.leagueName} now uses provider league ID ${updated.providerLeagueId}.`,
                    );
                    setEditing('');
                  } catch (e) {
                    logClientError('leagues.providerId', e);
                    setNameError(
                      'Could not update the provider league ID. Check the ID and try again.',
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor={`provider-id-${league.leagueId}`}>Provider league ID</label>
                <Input
                  id={`provider-id-${league.leagueId}`}
                  inputMode="numeric"
                  value={providerId}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? `provider-id-error-${league.leagueId}` : undefined}
                  onChange={(event) => {
                    setProviderId(event.target.value);
                    setNameError('');
                  }}
                />
                {nameError && (
                  <Text id={`provider-id-error-${league.leagueId}`} role="alert">
                    {nameError}
                  </Text>
                )}
                <Text fontSize="sm" mt={1}>
                  The new ID is checked with {league.leagueType === 0 ? 'Sleeper' : 'ESPN'} before
                  saving.
                </Text>
                <Button type="submit" mt={2} mr={2} disabled={busy}>
                  Save provider league ID
                </Button>
                <Button
                  type="button"
                  mt={2}
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing('');
                    setNameError('');
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await api.management!.archive(league.leagueId, !archived);
                  setNotice(`${league.leagueName} ${archived ? 'restored' : 'archived'}.`);
                  setRetry((v) => v + 1);
                } catch (e) {
                  logClientError('leagues.archive', e);
                  setError('Could not update the league. Try again.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {archived ? 'Restore league' : 'Archive league'}
            </Button>
            {deleting === league.leagueId ? (
              <Box
                as="form"
                mt={4}
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (deleteConfirmation !== league.leagueName) {
                    setNameError(`Type ${league.leagueName} to confirm deletion.`);
                    return;
                  }
                  setBusy(true);
                  setNameError('');
                  try {
                    await api.management!.delete(league.leagueId);
                    setNotice(`${league.leagueName} and its local data were deleted.`);
                    setRetry((v) => v + 1);
                    setDeleting('');
                  } catch (e) {
                    logClientError('leagues.delete', e);
                    setNameError('Could not delete the league. Try again.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Text fontWeight="bold">Delete this workspace and its local rankings?</Text>
                <Text fontSize="sm">
                  This cannot delete the league at {league.leagueType === 0 ? 'Sleeper' : 'ESPN'}.
                </Text>
                <label htmlFor={`delete-${league.leagueId}`}>
                  Type {league.leagueName} to confirm
                </label>
                <Input
                  id={`delete-${league.leagueId}`}
                  value={deleteConfirmation}
                  onChange={(event) => {
                    setDeleteConfirmation(event.target.value);
                    setNameError('');
                  }}
                />
                {nameError && <Text role="alert">{nameError}</Text>}
                <Button type="submit" mt={2} mr={2} colorPalette="red" disabled={busy}>
                  Delete league permanently
                </Button>
                <Button
                  type="button"
                  mt={2}
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setDeleting('');
                    setNameError('');
                  }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                mt={2}
                variant="outline"
                colorPalette="red"
                disabled={busy}
                onClick={() => {
                  setDeleting(league.leagueId);
                  setDeleteConfirmation('');
                  setNameError('');
                  setNotice('');
                }}
              >
                Delete league
              </Button>
            )}
          </Box>
        ))
      ) : (
        <Text>No {archived ? 'archived' : 'active'} leagues.</Text>
      )}
      {error && (
        <>
          <Text role="alert">{error}</Text>
          <Button onClick={() => setRetry((v) => v + 1)}>Retry</Button>
        </>
      )}
    </Box>
  );
}
