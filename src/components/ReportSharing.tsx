import { Box, Button, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { LeagueApi } from '../types';
import { logClientError } from '../logging';
export function ReportSharing({
  api,
  leagueId,
}: {
  api: NonNullable<LeagueApi['reportSharing']>;
  leagueId: string;
}) {
  const [enabled, setEnabled] = useState<boolean>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void api.get(leagueId).then(
      (value) => {
        if (active) setEnabled(value);
      },
      (failure) => {
        logClientError('sharing.status', failure);
        if (active)
          setError(
            'Sharing controls are available only to the league owner. Retry if this is your league.',
          );
      },
    );
    return () => {
      active = false;
    };
  }, [api, leagueId, retry]);
  return (
    <Box mt={3}>
      <Text>
        {enabled === undefined
          ? 'Loading sharing state…'
          : enabled
            ? 'Public season and history reports are enabled.'
            : 'Public season and history reports are disabled.'}
      </Text>
      {enabled !== undefined && (
        <Button
          variant="outline"
          disabled={busy}
          mt={2}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              setEnabled(await api.set(leagueId, !enabled));
            } catch (failure) {
              logClientError('sharing.update', failure);
              setError('Could not change sharing. Try again.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {enabled ? 'Disable public reports' : 'Enable public reports'}
        </Button>
      )}
      {error && (
        <>
          <Text role="alert">{error}</Text>
          <Button
            variant="plain"
            onClick={() => {
              setError('');
              setRetry((v) => v + 1);
            }}
          >
            Retry sharing status
          </Button>
        </>
      )}
    </Box>
  );
}
