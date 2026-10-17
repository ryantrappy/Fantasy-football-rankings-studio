import { ApiContext } from '../auth/session';
import { ReportSharing } from './ReportSharing';
import { logClientError } from '../logging';
import { Box, Button, Input, Text } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { errorMessage } from '../api/client';
import type { SnapshotInput } from '../report-snapshot';
import { normalizeLeagueId } from './report-search';
import { PersistentDisclosure } from './DisclosureMotion';

export function ShareReport({
  path,
  search,
  snapshotData,
  espn = false,
  snapshotHref,
  disabled = false,
  compact = false,
}: {
  path: '/insights' | '/history' | '/playoffs';
  search: { leagueId: string; year?: number; years?: number[] };
  snapshotData?: SnapshotInput;
  espn?: boolean;
  snapshotHref?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const api = useContext(ApiContext);
  const [copied, setCopied] = useState('');
  const [fallback, setFallback] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canonicalSearch = { ...search, leagueId: normalizeLeagueId(search.leagueId) };
  const query = new URLSearchParams({ leagueId: canonicalSearch.leagueId });
  if (canonicalSearch.year !== undefined) query.set('year', String(canonicalSearch.year));
  if (canonicalSearch.years !== undefined)
    query.set('years', JSON.stringify(canonicalSearch.years));
  const href = snapshotHref || `/shared${path}?${query}`;
  const saveSnapshot = !snapshotHref && espn && !!api?.createReportSnapshot;
  const content = (
    <Box className="share-report-compact">
      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={
            disabled || !canonicalSearch.leagueId || saving || (saveSnapshot && !snapshotData)
          }
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
        {!snapshotHref && api?.reportSharing && (
          <ReportSharing
            key={canonicalSearch.leagueId}
            api={api.reportSharing}
            leagueId={canonicalSearch.leagueId}
          />
        )}
      </Box>
      <Text fontSize="xs" color="fg.muted" mt={1.5} mb={0} aria-live="polite">
        Anyone with the link can view this report while public sharing is enabled.
        {saveSnapshot &&
          ' Sharing saves a snapshot of the loaded report, including private ESPN data. Snapshot links expire after 10 days.'}
      </Text>
      {error && (
        <Text fontSize="xs" role="alert">
          {error}
        </Text>
      )}
      {fallback && (
        <Input
          size="sm"
          aria-label="Share link"
          value={fallback}
          readOnly
          onFocus={(event) => event.target.select()}
          mt={2}
        />
      )}
    </Box>
  );
  return compact ? (
    <PersistentDisclosure
      className="share-report-menu"
      contentClassName="share-report-menu-content"
      label="Share report"
      closeKey={`${path}:${query}:${snapshotHref ?? ''}`}
    >
      {content}
    </PersistentDisclosure>
  ) : (
    content
  );
}
