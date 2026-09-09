import { logClientError } from '../logging';
import { Box, Button, Field, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { EspnCredentialsApi, EspnCredentialStatus } from '../espn-credentials';
import { errorMessage } from '../api/client';

export function EspnCredentialForm({
  api,
  status,
  onSaved,
  onboarding = false,
}: {
  api: EspnCredentialsApi;
  status: EspnCredentialStatus;
  onSaved: (status: EspnCredentialStatus) => void;
  onboarding?: boolean;
}) {
  const [espnS2, setEspnS2] = useState('');
  const [swid, setSwid] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function update(action: () => Promise<EspnCredentialStatus>, message: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await action();
      setEspnS2('');
      setSwid('');
      setMessage(message);
      onSaved(next);
    } catch (failure) {
      logClientError('EspnSetup', failure);
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box
      as="section"
      maxW="2xl"
      mx="auto"
      p={{ base: 4, md: 8 }}
      borderWidth="1px"
      borderColor="border"
      rounded="lg"
      bg="bg"
    >
      <Stack gap={5}>
        <Heading as="h1" size="2xl">
          {onboarding ? 'Connect your ESPN account' : 'ESPN settings'}
        </Heading>
        <Text>
          Private ESPN leagues need your espn_s2 and SWID cookies. Public ESPN and Sleeper leagues
          work without them.
        </Text>
        <Text>
          On ESPN’s website, sign in and open your browser’s developer tools. Under Application or
          Storage, open Cookies for espn.com and copy the values named espn_s2 and SWID.
        </Text>
        <Text>
          {status.configured
            ? 'Credentials saved. Enter both values to replace them.'
            : 'No ESPN credentials saved.'}{' '}
          These credentials are used only for your signed-in league requests. Shared reports stay
          public.
        </Text>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void update(() => api.saveEspnCredentials({ espnS2, swid }), 'ESPN credentials saved.');
          }}
        >
          <Stack gap={4}>
            <Field.Root required disabled={busy}>
              <Field.Label>espn_s2</Field.Label>
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={4096}
                value={espnS2}
                onChange={(event) => setEspnS2(event.target.value)}
              />
            </Field.Root>
            <Field.Root required disabled={busy}>
              <Field.Label>SWID</Field.Label>
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={38}
                value={swid}
                onChange={(event) => setSwid(event.target.value)}
              />
              <Field.HelperText>Copy the full value, including braces if present.</Field.HelperText>
            </Field.Root>
            <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
              <Button type="submit" colorPalette="green" disabled={busy}>
                {busy ? 'Saving…' : 'Save ESPN credentials'}
              </Button>
              {onboarding && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void update(api.skipEspnSetup, '')}
                >
                  Skip for now
                </Button>
              )}
              {status.configured && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void update(api.removeEspnCredentials, 'ESPN credentials removed.')
                  }
                >
                  Remove credentials
                </Button>
              )}
            </Flex>
          </Stack>
        </form>
        {error && <Text role="alert">{error}</Text>}
        {message && <Text as="output">{message}</Text>}
        {onboarding && <Text>You can add or replace these later in ESPN settings.</Text>}
      </Stack>
    </Box>
  );
}

// Mounted only after authentication. A stable API identity means ordinary route/tab
// changes do not recheck setup; a new authenticated subject gets a fresh boundary.
export function EspnSetup({
  api,
  children,
  settings = false,
}: {
  api: EspnCredentialsApi;
  children?: ReactNode;
  settings?: boolean;
}) {
  const [result, setResult] = useState<{
    api: EspnCredentialsApi;
    status?: EspnCredentialStatus;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void api.getEspnCredentialStatus().then(
      (status) => {
        if (!cancelled) setResult({ api, status });
      },
      (error) => {
        logClientError('EspnSetup.load', error);
        if (!cancelled) setResult({ api, error: errorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, retry]);
  const current = result?.api === api ? result : undefined;
  if (current?.error)
    return (
      <Box role="alert">
        {current.error}{' '}
        <Button
          onClick={() => {
            setResult(undefined);
            setRetry((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </Box>
    );
  if (!current?.status) return <Text as="output">Loading ESPN settings…</Text>;
  if (!settings && current.status.onboardingComplete) return children;
  return (
    <EspnCredentialForm
      key={settings ? 'settings' : 'onboarding'}
      api={api}
      status={current.status}
      onboarding={!settings}
      onSaved={(status) => setResult({ api, status })}
    />
  );
}
