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
    <Box className="report-sharing-inline">
      {enabled !== undefined && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
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
      <Text fontSize="xs" color="fg.muted" as="span">
        {enabled === undefined
          ? 'Loading sharing state…'
          : enabled
            ? 'Public season and history reports are enabled.'
            : 'Public season and history reports are disabled.'}
      </Text>
      {error && (
        <>
          <Text fontSize="xs" role="alert">
            {error}
          </Text>
          <Button
            size="xs"
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
