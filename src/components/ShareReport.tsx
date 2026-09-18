import { ApiContext } from '../auth/session';
import { ReportSharing } from './ReportSharing';
import { logClientError } from '../logging';
import { Box, Button, Input, Text } from '@chakra-ui/react';
import { defaultStringifySearch } from '@tanstack/react-router';
import { useContext, useState } from 'react';
import { errorMessage } from '../api/client';
import type { SnapshotInput } from '../report-snapshot';

export function ShareReport({
  path,
  search,
  snapshotData,
  espn = false,
  snapshotHref,
  disabled = false,
}: {
  path: '/insights' | '/history' | '/playoffs';
  search: { leagueId: string; year?: number; years?: number[] };
  snapshotData?: SnapshotInput;
  espn?: boolean;
  snapshotHref?: string;
  disabled?: boolean;
}) {
  const api = useContext(ApiContext);
  const [copied, setCopied] = useState('');
  const [fallback, setFallback] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const href = snapshotHref || `/shared${path}${defaultStringifySearch(search)}`;
  const saveSnapshot = !snapshotHref && espn && !!api?.createReportSnapshot;
  return (
    <Box>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !search.leagueId || saving || (saveSnapshot && !snapshotData)}
        onClick={async () => {
          setError('');
          setFallback('');
          setSaving(true);
          try {
            let target = href;
            if (saveSnapshot && snapshotData) {
              const saved = await api!.createReportSnapshot!(snapshotData);
              target = `/shared/snapshots/${saved.publicId}`;
            }
            const url = new URL(target, window.location.origin).href;
            try {
              await navigator.clipboard.writeText(url);
              setCopied(href);
            } catch (error) {
              logClientError('share.copy', error);
              setFallback(url);
            }
          } catch (error) {
            logClientError('share.snapshot', error);
            setError(errorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving
          ? saveSnapshot
            ? 'Saving snapshot…'
            : 'Copying link…'
          : copied === href
            ? 'Link copied'
            : 'Copy share link'}
      </Button>
      <Text fontSize="sm" mt={2} mb={0} aria-live="polite">
        Anyone with the link can view this report while public sharing is enabled.
        {saveSnapshot &&
          ' Sharing saves a snapshot of the loaded report, including private ESPN data. Snapshot links expire after 10 days.'}
      </Text>
      {error && <Text role="alert">{error}</Text>}
      {!snapshotHref && api?.reportSharing && (
        <ReportSharing key={search.leagueId} api={api.reportSharing} leagueId={search.leagueId} />
      )}
      {fallback && (
        <Input
          aria-label="Share link"
          value={fallback}
          readOnly
          onFocus={(event) => event.target.select()}
          mt={2}
        />
      )}
    </Box>
  );
}
