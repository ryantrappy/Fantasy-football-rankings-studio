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
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [provider, setProvider] = useState<WritingProvider>('codex'),
    [model, setModel] = useState(''),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [suggestions, setSuggestions] = useState('');
  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.context({ leagueId, year, week, teamId }), api.providers()]).then(
      ([context, providers]) => {
        if (!cancelled) {
          setContext(context);
          setProviders(providers);
          setProvider(providers.find((p) => p.installed && p.enabled)?.id || 'codex');
        }
      },
      (failure) => {
        logClientError('writing.context', failure);
        if (!cancelled)
          setError(failure instanceof Error ? failure.message : 'Context unavailable.');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, week, teamId, retry]);
  const ready = providers.some((p) => p.id === provider && p.installed && p.enabled);
  return (
    <Stack gap={4}>
      {!context && !error && <Text as="output">Loading team context…</Text>}
      {error && <Text role="alert">{error}</Text>}
      {!context && error && (
        <Button
          onClick={() => {
            setError('');
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
                    {!p.installed ? ' · not installed' : !p.enabled ? ' · not enabled' : ' · ready'}
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
          {!ready && (
            <Text>
              AI generation needs an installed CLI and administrator enablement for your account.
              The factual context above is available without AI.
            </Text>
          )}
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
            colorPalette="green"
            onClick={async () => {
              if (busy || !approved) return;
              setBusy(true);
              setError('');
              setSuggestions('');
              try {
                setSuggestions(
                  await api.generate({ ...selection, provider, model, approved: true }),
                );
              } catch (failure) {
                logClientError('writing.generate', failure);
                setError(failure instanceof Error ? failure.message : 'Suggestions unavailable.');
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
