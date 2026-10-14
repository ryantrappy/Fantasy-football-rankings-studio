import { PageHeading } from './PageHeading';
import { LoadingSkeleton } from './LoadingSkeleton';
import { logClientError } from '../logging';
import { Box, Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { ProfileApi, UserProfile } from '../profile';
import type { AiCredentialStatus, AiCredentialsApi } from '../ai-credentials';
import type { WritingApi, WritingProvider } from '../writing';
import { CodexAccountSettings } from './CodexAccountSettings';
import { errorMessage } from '../api/client';

type AccountApi = ProfileApi & AiCredentialsApi & { writing?: Pick<WritingApi, 'providers'> };

export function ProfilePage({
  api,
  settings,
  recovery,
  initialView = 'details',
}: {
  api: AccountApi;
  settings?: ReactNode;
  recovery?: ReactNode;
  initialView?: 'details' | 'connections' | 'espn';
}) {
  const [view, setView] = useState(initialView);
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
    <section className="explorer-profile">
      <PageHeading
        title="Your profile"
        description="Your identity and the connections you use to write and play."
      />
      <div className="explorer-profile-workspace">
        {current?.profile && (
          <div className="explorer-account-identity">
            <div>
              <h2>{current.profile.name || current.profile.nickname}</h2>
              <p>{current.profile.email || 'Email not provided'}</p>
            </div>
          </div>
        )}
        <nav className="explorer-view-nav" aria-label="Profile views">
          <button
            type="button"
            aria-pressed={view === 'details'}
            onClick={() => setView('details')}
          >
            Profile details
          </button>
          <button
            type="button"
            aria-pressed={view === 'connections'}
            onClick={() => setView('connections')}
          >
            Writing connections
          </button>
          {settings && (
            <button type="button" aria-pressed={view === 'espn'} onClick={() => setView('espn')}>
              ESPN settings
            </button>
          )}
        </nav>
        {!current && (
          <div className="explorer-profile-pane">
            <LoadingSkeleton label="Loading your profile…" />
          </div>
        )}
        {current?.error && (
          <div className="explorer-profile-pane">
            <Text role="alert">{current.error}</Text>
            <Button
              onClick={() => {
                setResult(undefined);
                setRetry((n) => n + 1);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {(current?.profile || recovery) && (
          <div className="explorer-profile-pane" hidden={view !== 'details'}>
            <Stack gap={4}>
              {current?.profile && (
                <ProfileForm
                  key={current.profile.userId}
                  api={api}
                  profile={current.profile}
                  onSaved={(profile) => setResult({ api, profile })}
                />
              )}
              {recovery}
            </Stack>
          </div>
        )}
        {current?.profile && (
          <div className="explorer-profile-pane" hidden={view !== 'connections'}>
            <AiCredentialSettings key={current.profile.userId} api={api} />
          </div>
        )}

        {settings && (
          <div className="explorer-profile-pane" hidden={view !== 'espn'}>
            {settings}
          </div>
        )}
      </div>
    </section>
  );
}
function ProfileForm({
  api,
  profile,
  onSaved,
}: {
  api: ProfileApi;
  profile: UserProfile;
  onSaved: (profile: UserProfile) => void;
}) {
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
            onSaved(next);
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

function AiCredentialSettings({ api }: { api: AccountApi }) {
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
    <Stack gap={4}>
      <Heading as="h2" size="lg">
        Writing assistant connections
      </Heading>
      <Text>
        Optionally save your own OpenAI key for Codex or Anthropic key for Claude. Keys are
        encrypted and used only for your writing requests; saved values are never shown again.
      </Text>
      <CodexAccountSettings api={api.writing} revision={status?.codexConfigured} />
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
