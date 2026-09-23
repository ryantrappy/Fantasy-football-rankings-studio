import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  chakra,
} from '@chakra-ui/react';
import { useEffect, useId, useRef, useState } from 'react';
import type { WritingApi, WritingProvider, WritingProviderOption } from '../writing';
import { logClientError } from '../logging';
const modelSuggestions: Record<WritingProvider, string[]> = {
  codex: ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'],
  claude: ['sonnet', 'opus', 'haiku'],
};
export function WritingSuggestions({
  api,
  leagueId,
  year,
  week,
  onSummaryChange,
  onControllerChange,
  onGenerationStateChange,
}: {
  api: WritingApi;
  leagueId: string;
  year: number;
  week: number;
  onSummaryChange: (teamId: string, summary: string) => void;
  onControllerChange: (controller: { generate: (teamId: string) => Promise<void> }) => void;
  onGenerationStateChange: (teamId: string | undefined) => void;
}) {
  const request = useRef<AbortController | undefined>(undefined);
  const [providers, setProviders] = useState<WritingProviderOption[]>([]);
  const [provider, setProvider] = useState<WritingProvider>('codex');
  const [model, setModel] = useState('');
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const consentId = useId();
  const ready = providers.find((option) => option.id === provider)?.status === 'ready';
  useEffect(() => {
    void api.providers().then(
      (options) => {
        setProviders(options);
        setProvider(options.find((option) => option.status === 'ready')?.id || 'codex');
      },
      (failure) => {
        logClientError('writing.providers', failure);
        setError('AI configuration is unavailable.');
      },
    );
  }, [api]);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  async function generateSummary(teamId: string) {
    if (busy || !approved || !ready) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    onGenerationStateChange(teamId);
    setError('');
    try {
      const summary = await api.generate(
        { leagueId, year, week, teamId, provider, model, approved: true },
        controller.signal,
      );
      if (!controller.signal.aborted) onSummaryChange(teamId, summary);
    } catch (failure) {
      if (!controller.signal.aborted) {
        logClientError('writing.generate', failure);
        setError(
          'Generation failed. Ask the operator to verify the selected CLI login and model, then try again.',
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = undefined;
        setBusy(false);
        onGenerationStateChange(undefined);
      }
    }
  }
  useEffect(() => {
    onControllerChange({ generate: generateSummary });
  });
  return (
    <Box my={5} p={{ base: 4, md: 6 }} bg="bg" borderWidth="1px" rounded="lg">
      <Stack gap={4}>
        <Heading as="h3" size="md">
          AI ranking summaries
        </Heading>
        <Text>
          Generate one factual summary for each team. Summaries are reference material and do not
          change your ranking commentary.
        </Text>
        <Field.Root disabled={busy}>
          <Field.Label>Writing assistant</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as WritingProvider);
                setApproved(false);
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
            list={`${provider}-writing-models`}
            value={model}
            maxLength={100}
            placeholder="Use the CLI default or choose a model"
            onChange={(e) => {
              setModel(e.target.value);
            }}
          />
          <datalist id={`${provider}-writing-models`}>
            {modelSuggestions[provider].map((suggestedModel) => (
              <option key={suggestedModel} value={suggestedModel} />
            ))}
          </datalist>
          <Field.HelperText>
            Choose a suggestion or enter any model available to the selected CLI account. Lowest
            thinking/reasoning effort is always used.
          </Field.HelperText>
        </Field.Root>
        {!approved && (
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
            I approve sending these team contexts to the selected assistant.
          </label>
        )}
        {busy && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              request.current?.abort();
            }}
          >
            Cancel generation
          </Button>
        )}
        {error && <Text role="alert">{error}</Text>}
      </Stack>
    </Box>
  );
}
