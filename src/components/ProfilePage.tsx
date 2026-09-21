import { logClientError } from '../logging';
import { Box, Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { ProfileApi, UserProfile } from '../profile';
import type { AiCredentialStatus, AiCredentialsApi } from '../ai-credentials';
import type { WritingProvider } from '../writing';
import { errorMessage } from '../api/client';

type AccountApi = ProfileApi & AiCredentialsApi;

export function ProfilePage({ api }: { api: AccountApi }) {
  const [result, setResult] = useState<{
    api: ProfileApi;
    profile?: UserProfile;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void api.getProfile().then(
      (profile) => {
        if (!cancelled) setResult({ api, profile });
      },
      (error) => {
        logClientError('ProfilePage.load', error);
        if (!cancelled) setResult({ api, error: errorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, retry]);
  const current = result?.api === api ? result : undefined;
  return (
    <Box
      as="section"
      maxW="2xl"
      mx="auto"
      p={{ base: 4, md: 8 }}
      borderWidth="1px"
      rounded="lg"
      bg="bg"
    >
      <Stack gap={5}>
        <Heading as="h1" size="2xl">
          Your profile
        </Heading>
        {!current && <Text as="output">Loading your profile…</Text>}
        {current?.error && (
          <>
            <Text role="alert">{current.error}</Text>
            <Button
              onClick={() => {
                setResult(undefined);
                setRetry((n) => n + 1);
              }}
            >
              Retry
            </Button>
          </>
        )}
        {current?.profile && (
          <>
            <ProfileForm key={current.profile.userId} api={api} profile={current.profile} />
            <AiCredentialSettings api={api} />
          </>
        )}
      </Stack>
    </Box>
  );
}
function ProfileForm({ api, profile }: { api: ProfileApi; profile: UserProfile }) {
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Text>
        Email: {profile.email || 'Not provided'}
        {profile.email ? (profile.emailVerified ? ' (verified)' : ' (not verified)') : ''}
      </Text>
      <Text overflowWrap="anywhere">Account ID: {profile.userId}</Text>
      <Text>
        Edit your name and nickname below. Your email and sign-in details are managed through your
        identity provider. Social accounts may restore the provider’s name on your next sign-in.
      </Text>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          setSaved(false);
          try {
            const next = await api.updateProfile({ name: name.trim(), nickname: nickname.trim() });
            setName(next.name);
            setNickname(next.nickname);
            setSaved(true);
          } catch (failure) {
            logClientError('ProfilePage', failure);
            setError(errorMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Stack gap={4}>
          <Field.Root required disabled={busy}>
            <Field.Label>Name</Field.Label>
            <Input
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />
          </Field.Root>
          <Field.Root required disabled={busy}>
            <Field.Label>Nickname</Field.Label>
            <Input
              required
              maxLength={100}
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setSaved(false);
              }}
            />
          </Field.Root>
          <Button
            type="submit"
            colorPalette="indigo"
            disabled={busy || !name.trim() || !nickname.trim()}
          >
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
        </Stack>
      </form>
      {error && <Text role="alert">{error}</Text>}
      {saved && <Text as="output">Profile saved.</Text>}
    </>
  );
}

function AiCredentialSettings({ api }: { api: AiCredentialsApi }) {
  const [status, setStatus] = useState<AiCredentialStatus>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void api.getAiCredentialStatus().then(
      (next) => {
        if (!cancelled) setStatus(next);
      },
      (failure) => {
        logClientError('ProfilePage.aiCredentials.load', failure);
        if (!cancelled) setError(errorMessage(failure));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, retry]);
  return (
    <Stack gap={4} pt={5} borderTopWidth="1px">
      <Heading as="h2" size="lg">
        Writing assistant API keys
      </Heading>
      <Text>
        Optionally save your own OpenAI key for Codex or Anthropic key for Claude. Keys are
        encrypted and used only for your writing requests; saved values are never shown again.
      </Text>
      {!status && !error && <Text as="output">Loading AI key settings…</Text>}
      {error && (
        <>
          <Text role="alert">{error}</Text>
          <Button
            onClick={() => {
              setError('');
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </Button>
        </>
      )}
      {status && (
        <AiCredentialForm
          api={api}
          provider="codex"
          configured={status.codexConfigured}
          onSaved={setStatus}
        />
      )}
      {status && (
        <AiCredentialForm
          api={api}
          provider="claude"
          configured={status.claudeConfigured}
          onSaved={setStatus}
        />
      )}
    </Stack>
  );
}

function AiCredentialForm({
  api,
  provider,
  configured,
  onSaved,
}: {
  api: AiCredentialsApi;
  provider: WritingProvider;
  configured: boolean;
  onSaved: (status: AiCredentialStatus) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const label = provider === 'codex' ? 'OpenAI API key (Codex)' : 'Anthropic API key (Claude)';
  async function update(action: () => Promise<AiCredentialStatus>, nextMessage: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const status = await action();
      setApiKey('');
      onSaved(status);
      setMessage(nextMessage);
    } catch (failure) {
      logClientError('ProfilePage.aiCredentials', failure);
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box as="section" borderWidth="1px" borderColor="border" rounded="md" p={4}>
      <Stack gap={3}>
        <Heading as="h3" size="md">
          {label}
        </Heading>
        <Text>
          {configured ? 'A key is saved. Enter a new key to replace it.' : 'No key is saved.'}
        </Text>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void update(() => api.saveAiCredential({ provider, apiKey }), `${label} saved.`);
          }}
        >
          <Stack gap={3}>
            <Field.Root required disabled={busy}>
              <Field.Label>{label}</Field.Label>
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={1024}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </Field.Root>
            <Button type="submit" colorPalette="indigo" disabled={busy}>
              {busy ? 'Saving…' : `Save ${label}`}
            </Button>
          </Stack>
        </form>
        {configured && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void update(() => api.removeAiCredential(provider), `${label} removed.`)}
          >
            Remove {label}
          </Button>
        )}
        {error && <Text role="alert">{error}</Text>}
        {message && <Text as="output">{message}</Text>}
      </Stack>
    </Box>
  );
}
