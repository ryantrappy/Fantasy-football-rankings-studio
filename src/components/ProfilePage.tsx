import { logClientError } from '../logging';
import { Box, Button, Field, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { ProfileApi, UserProfile } from '../profile';
import { errorMessage } from '../api/client';

export function ProfilePage({ api }: { api: ProfileApi }) {
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
          <ProfileForm key={current.profile.userId} api={api} profile={current.profile} />
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
            colorPalette="green"
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
