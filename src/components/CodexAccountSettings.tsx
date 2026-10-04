import { Box, Button, Heading, Link, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { WritingApi, WritingProviderOption } from '../writing';

export const codexSetupUrl =
  'https://github.com/ryantrappy/react_refactor_fantasy_website/blob/improvement_batch/README.md#sign-in-to-codex-in-docker-with-your-chatgpt-account';

export function CodexAccountSettings({
  api,
  revision,
}: {
  api?: Pick<WritingApi, 'providers'>;
  revision?: boolean;
}) {
  const [result, setResult] = useState<{
    api: typeof api;
    revision?: boolean;
    option?: WritingProviderOption;
    failed?: boolean;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    void api.providers().then(
      (providers) => {
        if (!cancelled)
          setResult({
            api,
            revision,
            option: providers.find((provider) => provider.id === 'codex'),
          });
      },
      () => {
        if (!cancelled) setResult({ api, revision, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, revision, retry]);
  const current = result?.api === api && result?.revision === revision ? result : undefined;
  const status = current?.option?.serverStatus;
  return (
    <Box as="section" borderWidth="1px" rounded="md" p={4}>
      <Stack gap={3}>
        <Heading as="h3" size="md">
          Codex with a ChatGPT account
        </Heading>
        <Text>
          An API key is optional. The server operator can sign in to Codex with ChatGPT and enable
          this account for writing suggestions. Authorized users share the operator’s account and
          quota. Login happens on the Docker host; your application sign-in does not connect
          ChatGPT.
        </Text>
        <Text as="output">
          {!api || current?.failed || (current && !status)
            ? 'Server Codex readiness is unavailable. Ask the operator to check setup.'
            : !current
              ? 'Checking server Codex login…'
              : status === 'not-enabled'
                ? 'Server Codex is disabled for your application account. Ask the operator to enable it.'
                : status === 'not-installed'
                  ? 'The server Codex CLI is missing. Ask the operator to rebuild the Docker image.'
                  : status === 'login-check-failed'
                    ? 'Server Codex login check failed. Ask the operator to sign in again and check login status.'
                    : 'Server Codex login is ready. Cached credentials passed the check; generation still requires available account access and quota.'}
        </Text>
        <Text>
          {revision
            ? 'Your saved OpenAI key takes precedence. Use Remove OpenAI API key (Codex) below to use the server login instead.'
            : 'With no saved OpenAI key, Codex uses the enabled server login. For ChatGPT OAuth, the operator should confirm “Logged in using ChatGPT” during setup.'}
        </Text>
        <Link href={codexSetupUrl} target="_blank" rel="noopener noreferrer">
          Docker Codex OAuth setup instructions
        </Link>
        {api && (
          <Button
            variant="outline"
            onClick={() => {
              setResult(undefined);
              setRetry((value) => value + 1);
            }}
          >
            Refresh Codex readiness
          </Button>
        )}
      </Stack>
    </Box>
  );
}
