import { ApiContext } from '../auth/session';
import { ReportSharing } from './ReportSharing';
import { logClientError } from '../logging';
import { Box, Button, Input, Text } from '@chakra-ui/react';
import { defaultStringifySearch } from '@tanstack/react-router';
import { useContext, useState } from 'react';

export function ShareReport({
  path,
  search,
}: {
  path: '/insights' | '/history';
  search: { leagueId: string; year?: number; years?: number[] };
}) {
  const api = useContext(ApiContext);
  const [copied, setCopied] = useState('');
  const [fallback, setFallback] = useState('');
  const href = `/shared${path}${defaultStringifySearch(search)}`;
  return (
    <Box>
      <Button
        type="button"
        variant="outline"
        disabled={!search.leagueId}
        onClick={async () => {
          const url = new URL(href, window.location.origin).href;
          try {
            await navigator.clipboard.writeText(url);
            setCopied(href);
            setFallback('');
          } catch (error) {
            logClientError('share.copy', error);
            setFallback(url);
          }
        }}
      >
        {copied === href ? 'Link copied' : 'Copy share link'}
      </Button>
      <Text fontSize="sm" mt={2} mb={0} aria-live="polite">
        Anyone with the link can view this report while public sharing is enabled.
      </Text>
      {api?.reportSharing && (
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
