import { createFileRoute } from '@tanstack/react-router';
import { Box, Heading, Text } from '@chakra-ui/react';
import { readEdition } from '../functions/publishing.functions';
export const Route = createFileRoute('/shared/rankings/$publicId')({
  loader: ({ params }) => readEdition({ data: { publicId: params.publicId } }),
  staleTime: 0,
  head: () => ({
    meta: [{ title: 'Published power rankings' }, { name: 'robots', content: 'noindex, nofollow' }],
  }),
  component: PublishedRanking,
});
function PublishedRanking() {
  const result = Route.useLoaderData();
  if (!result.ok)
    return (
      <Box role="alert">
        <Heading as="h1" size="xl">
          Edition unavailable
        </Heading>
        <Text>{result.error.message}</Text>
      </Box>
    );
  const { ranking, status } = result.data;
  return (
    <Box as="article" maxW="4xl" mx="auto">
      <Text fontSize="sm">
        {ranking.year} · Week {ranking.week} · Published{' '}
        {new Date(status.publishedAt).toISOString().slice(0, 10)}
      </Text>
      <Heading as="h1" size="3xl" my={4}>
        {ranking.rankingsTitle}
      </Heading>
      <Text whiteSpace="pre-wrap" mb={6}>
        {ranking.introduction}
      </Text>
      <Box as="ol" pl={6}>
        {ranking.teams.map((t) => (
          <Box as="li" key={t.teamId} bg="bg" p={5} mb={4} borderWidth="1px" rounded="lg">
            <Heading as="h2" size="lg">
              {t.teamName}
            </Heading>
            <Text color="fg.muted" my={2}>
              {t.managerName} · {t.wins}–{t.loss}–{t.ties}
            </Text>
            <Text whiteSpace="pre-wrap">{t.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
