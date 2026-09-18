import { createFileRoute } from '@tanstack/react-router';
import { Box, Heading, Text } from '@chakra-ui/react';
import { readReportSnapshot } from '../functions/report-snapshots.functions';
import { SnapshotReport } from '../components/SnapshotReport';

export const Route = createFileRoute('/shared/snapshots/$publicId')({
  loader: ({ params }) => readReportSnapshot({ data: { publicId: params.publicId } }),
  staleTime: 0,
  head: () => ({
    meta: [{ title: 'Saved league report' }, { name: 'robots', content: 'noindex' }],
  }),
  component: SavedReport,
});
function SavedReport() {
  const result = Route.useLoaderData();
  if (!result.ok)
    return (
      <Box role="alert">
        <Heading as="h1" size="xl">
          Snapshot unavailable
        </Heading>
        <Text>{result.error.message}</Text>
      </Box>
    );
  return <SnapshotReport key={result.data.publicId} report={result.data} />;
}
