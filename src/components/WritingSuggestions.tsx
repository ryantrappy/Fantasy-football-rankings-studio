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
import type {
  WritingApi,
  WritingConsent,
  WritingProvider,
  WritingProviderOption,
} from '../writing';
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
  onControllerChange: (controller: {
    generate: (teamId: string) => Promise<void>;
    ready: boolean;
  }) => void;
  onGenerationStateChange: (teamId: string | undefined) => void;
}) {
  const request = useRef<AbortController | undefined>(undefined);
  const [providers, setProviders] = useState<WritingProviderOption[]>([]);
  const [provider, setProvider] = useState<WritingProvider>('codex');
  const [model, setModel] = useState('');
  const [consent, setConsent] = useState<WritingConsent>({ codex: false, claude: false });
  const [consentLoading, setConsentLoading] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const approved = consent[provider];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const consentId = useId();
  const ready = providers.find((option) => option.id === provider)?.status === 'ready';
  useEffect(() => {
    let mounted = true;
    void api.consent().then(
      (saved) => {
        if (mounted) {
          setConsent(saved);
          setConsentLoading(false);
        }
      },
      () => {
        if (mounted)
          setError('Context-sharing preferences could not be loaded. Reload to try again.');
      },
    );
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
    return () => {
      mounted = false;
    };
  }, [api]);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  async function generateSummary(teamId: string) {
    if (busy || consentLoading || savingConsent || !approved || !ready) return;
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
  async function changeConsent(approved: boolean) {
    setSavingConsent(true);
    setError('');
    if (!approved) request.current?.abort();
    try {
      setConsent(await api.saveConsent({ provider, approved }));
    } catch (failure) {
      logClientError('writing.consent', failure);
      setError('Your context-sharing preference could not be saved. Please try again.');
    } finally {
      setSavingConsent(false);
    }
  }
  useEffect(() => {
    onControllerChange({
      generate: generateSummary,
      ready: approved && ready && !consentLoading && !savingConsent,
    });
  });
  return (
    <Box className="writing-settings">
      <Stack gap={4}>
        <Heading as="h3" size="md">
          AI ranking summaries
        </Heading>
        <Text>
          Generate one factual summary for each team. Summaries are reference material and do not
          change your ranking commentary.
        </Text>
        <Field.Root disabled={busy || savingConsent}>
          <Field.Label>Writing assistant</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as WritingProvider);
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
        <Field.Root disabled={busy || savingConsent}>
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
              <option key={suggestedModel} value={suggestedModel}>
                {suggestedModel}
              </option>
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
              aria-label="Approve sending team contexts to the selected assistant"
              width="auto"
              mr={2}
              checked={approved}
              disabled={busy || !ready || consentLoading || savingConsent}
              onChange={(e) => void changeConsent(e.target.checked)}
            />
            I approve sending team contexts to this assistant. Save this choice to my account.
          </label>
        )}
        {approved && (
          <Box>
            <Text>Context sharing is approved for this assistant and saved to your account.</Text>
            <Button
              type="button"
              variant="outline"
              disabled={savingConsent || consentLoading}
              onClick={() => void changeConsent(false)}
            >
              {savingConsent ? 'Saving…' : 'Revoke context-sharing approval'}
            </Button>
          </Box>
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
