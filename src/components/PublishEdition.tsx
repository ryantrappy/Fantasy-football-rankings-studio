import { Box, Button, Input, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { PublicationStatus, PublishingApi } from '../publishing';
import { logClientError } from '../logging';
export function PublishEdition({
  api,
  id,
  revision,
  disabled,
}: {
  api: PublishingApi;
  id: string;
  revision: number;
  disabled: boolean;
}) {
  const [status, setStatus] = useState<PublicationStatus | null>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    let active = true;
    void api.status(id).then(
      (value) => {
        if (active) setStatus(value);
      },
      (failure) => {
        logClientError('publication.status', failure);
        if (active) setError('Publication status could not be loaded.');
      },
    );
    return () => {
      active = false;
    };
  }, [api, id]);
  async function change(remove = false) {
    setBusy(true);
    setError('');
    try {
      if (remove) {
        await api.unpublish(id);
        setStatus(null);
        setConfirm(false);
      } else setStatus(await api.publish(id, revision));
    } catch (failure) {
      logClientError('publication.change', failure);
      setError(failure instanceof Error ? failure.message : 'Publication failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box as="section" aria-label="Publication" bg="bg.muted" p={4} mb={4} rounded="lg">
      <Text fontWeight="bold">{status ? 'Published edition' : 'Private draft'}</Text>
      <Text mb={3}>
        Publishing shares a snapshot with anyone who has its link. Later edits remain private until
        you publish again.
      </Text>
      {status && (
        <>
          <Input
            aria-label="Published edition link"
            readOnly
            value={`${window.location.origin}/shared/rankings/${status.publicId}`}
            mb={3}
          />
          <Text mb={3}>
            {status.revision === revision
              ? 'The saved revision is published.'
              : 'The published snapshot differs from the saved draft.'}
          </Text>
        </>
      )}
      {disabled && (
        <Text mb={3}>
          Save your changes and resolve any draft recovery or conflict before publishing.
        </Text>
      )}
      <Button disabled={disabled || busy} onClick={() => void change()} mr={3}>
        {busy ? 'Updating publication…' : status ? 'Publish saved revision' : 'Publish edition'}
      </Button>
      {status && (
        <Button disabled={busy} variant="outline" onClick={() => setConfirm(true)}>
          Unpublish
        </Button>
      )}
      {confirm && (
        <Box mt={3}>
          <Text mb={2}>
            Disable this public link? Copies already downloaded by readers cannot be recalled.
          </Text>
          <Button disabled={busy} onClick={() => void change(true)} mr={3}>
            Confirm unpublish
          </Button>
          <Button variant="plain" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
        </Box>
      )}
      {error && (
        <Text role="alert" mt={3}>
          {error}
        </Text>
      )}
    </Box>
  );
}
