import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
  chakra,
} from '@chakra-ui/react';
import { useEffect, useId, useState } from 'react';
import type { Team } from '../types';
import type {
  WritingApi,
  WritingContext,
  WritingProvider,
  WritingProviderOption,
} from '../writing';
import { logClientError } from '../logging';
function providerStatus(option: WritingProviderOption | undefined) {
  if (!option || option.status === 'not-installed')
    return 'The CLI is not installed in the application server environment. Ask the operator to install it for the service.';
  if (option.status === 'not-enabled')
    return 'The CLI is installed, but your account is not enabled. Ask an administrator to enable this assistant for your account.';
  if (option.status === 'login-check-failed')
    return 'The CLI is installed and enabled, but its login check failed. Ask the operator to sign in and verify the CLI as the application service account.';
  return 'The CLI is installed and enabled, and its login check passed.';
}
export function WritingSuggestions({
  api,
  leagueId,
  year,
  week,
  teams,
}: {
  api: WritingApi;
  leagueId: string;
  year: number;
  week: number;
  teams: Team[];
}) {
  const [open, setOpen] = useState(false),
    [teamId, setTeamId] = useState(teams[0]?.teamId || '');
  return (
    <Box
      as="details"
      my={5}
      p={{ base: 4, md: 6 }}
      bg="bg"
      borderWidth="1px"
      rounded="lg"
      onToggle={(event) => setOpen((event.currentTarget as unknown as HTMLDetailsElement).open)}
    >
      <summary>Talking points for your rankings</summary>
      {open && (
        <Stack gap={4} mt={4}>
          <Field.Root>
            <Field.Label>Team context</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <TeamSuggestions
            key={`${leagueId}:${year}:${week}:${teamId}`}
            api={api}
            selection={{ leagueId, year, week, teamId }}
          />
        </Stack>
      )}
    </Box>
  );
}
function TeamSuggestions({
  api,
  selection,
}: {
  api: WritingApi;
  selection: { leagueId: string; year: number; week: number; teamId: string };
}) {
  const consentId = useId();
  const { leagueId, year, week, teamId } = selection;
  const [context, setContext] = useState<WritingContext>(),
    [providers, setProviders] = useState<WritingProviderOption[]>([]),
    [contextError, setContextError] = useState(''),
    [retry, setRetry] = useState(0);
  const [provider, setProvider] = useState<WritingProvider>('codex'),
    [model, setModel] = useState(''),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [generationError, setGenerationError] = useState(''),
    [suggestions, setSuggestions] = useState('');
  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.context({ leagueId, year, week, teamId }), api.providers()]).then(
      ([context, providers]) => {
        if (!cancelled) {
          setContext(context);
          setProviders(providers);
          setProvider(providers.find((p) => p.status === 'ready')?.id || 'codex');
        }
      },
      (failure) => {
        logClientError('writing.context', failure);
        if (!cancelled)
          setContextError(failure instanceof Error ? failure.message : 'Context unavailable.');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, week, teamId, retry]);
  const selectedProvider = providers.find((p) => p.id === provider);
  const ready = selectedProvider?.status === 'ready';
  return (
    <Stack gap={4}>
      {!context && !contextError && <Text as="output">Loading team context…</Text>}
      {contextError && <Text role="alert">{contextError}</Text>}
      {!context && contextError && (
        <Button
          onClick={() => {
            setContextError('');
            setRetry((v) => v + 1);
          }}
        >
          Retry context
        </Button>
      )}
      {context && (
        <>
          <Heading as="h4" size="md">
            {context.teamName} · through week {context.throughWeek}
          </Heading>
          <Box as="ul" pl={5}>
            {context.facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </Box>
          {!!context.depth.length && (
            <>
              <Text fontWeight="bold">Observed positional depth</Text>
              <Box as="ul" pl={5}>
                {context.depth.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </Box>
            </>
          )}
          <Text fontSize="sm">{context.notes.join(' ')}</Text>
          <Field.Root disabled={busy}>
            <Field.Label>Writing assistant</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as WritingProvider);
                  setApproved(false);
                  setSuggestions('');
                }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === 'codex' ? 'Codex CLI' : 'Claude Code CLI'}
                    {p.status === 'not-installed'
                      ? ' · not installed'
                      : p.status === 'not-enabled'
                        ? ' · not enabled'
                        : p.status === 'login-check-failed'
                          ? ' · login check failed'
                          : ' · ready'}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root disabled={busy}>
            <Field.Label>Model (optional)</Field.Label>
            <Input
              value={model}
              maxLength={100}
              placeholder="Use the CLI default"
              onChange={(e) => {
                setModel(e.target.value);
                setApproved(false);
                setSuggestions('');
              }}
            />
            <Field.HelperText>Use a model available to the selected CLI account.</Field.HelperText>
          </Field.Root>
          <Text>
            The assistant runs on the application server using its CLI login. Generation sends the
            displayed team context to that assistant’s provider. Your ranking text is changed only
            by you.
          </Text>
          <Text>{providerStatus(selectedProvider)}</Text>
          {!ready && <Text>The factual context above is available without AI.</Text>}
          {generationError && <Text role="alert">{generationError}</Text>}
          <label htmlFor={consentId}>
            <chakra.input
              id={consentId}
              type="checkbox"
              width="auto"
              mr={2}
              checked={approved}
              disabled={busy || !ready}
              onChange={(e) => setApproved(e.target.checked)}
            />
            I approve sending this team context to the selected assistant for this generation.
          </label>
          <Button
            disabled={busy || !ready || !approved}
            colorPalette="indigo"
            onClick={async () => {
              if (busy || !approved) return;
              setBusy(true);
              setGenerationError('');
              setSuggestions('');
              try {
                setSuggestions(
                  await api.generate({ ...selection, provider, model, approved: true }),
                );
              } catch (failure) {
                logClientError('writing.generate', failure);
                setGenerationError(
                  'Generation failed. Ask the operator to verify the selected CLI login and model as the application service account, then try again.',
                );
              } finally {
                setBusy(false);
                setApproved(false);
              }
            }}
          >
            {busy ? 'Generating…' : 'Suggest talking points'}
          </Button>
          {suggestions && (
            <Field.Root>
              <Field.Label>Suggested talking points</Field.Label>
              <Textarea
                rows={8}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
              />
              <Field.HelperText>
                Edit or copy these ideas into your commentary after checking the facts.
              </Field.HelperText>
            </Field.Root>
          )}
        </>
      )}
    </Stack>
  );
}
