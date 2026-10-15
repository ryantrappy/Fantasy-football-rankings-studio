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
  WritingContext,
  WritingProvider,
  WritingProviderOption,
} from '../writing';
import { logClientError } from '../logging';
import { CodexSetupGuide } from './CodexSetupGuide';
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
  teams = [],
  selectedTeamId,
}: {
  api: WritingApi;
  teams?: { teamId: string; teamName: string }[];
  selectedTeamId?: string;
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
  const [providerResult, setProviders] = useState<{
    api: WritingApi;
    options: WritingProviderOption[];
  }>();
  const providers = providerResult?.api === api ? providerResult.options : [];
  const [provider, setProvider] = useState<WritingProvider>('codex');
  const [model, setModel] = useState('');
  const [consentResult, setConsent] = useState<{ api: WritingApi; values: WritingConsent }>();
  const consentLoading = consentResult?.api !== api;
  const consent =
    consentResult?.api === api ? consentResult.values : { codex: false, claude: false };
  const [savingConsent, setSavingConsent] = useState(false);
  const approved = consent[provider];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readinessRevision, setReadinessRevision] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [evidenceTeam, setEvidenceTeam] = useState('');
  const [evidence, setEvidence] = useState<{
    scope: string;
    api: WritingApi;
    context?: WritingContext;
    error?: string;
    loading?: boolean;
  }>();
  const evidenceRequest = useRef(0);
  const contextTeam = selectedTeamId || evidenceTeam || teams[0]?.teamId;
  const contextScope = `${leagueId}:${year}:${week}:${contextTeam}`;
  const visibleEvidence =
    evidence?.scope === contextScope && evidence.api === api ? evidence : undefined;
  const providerOption = providers.find((option) => option.id === provider);
  async function inspectContext() {
    if (!contextTeam) return;
    const requestId = ++evidenceRequest.current;
    setEvidence({ api, scope: contextScope, loading: true });
    try {
      const context = await api.context({ leagueId, year, week, teamId: contextTeam });
      if (requestId === evidenceRequest.current) setEvidence({ api, scope: contextScope, context });
    } catch (failure) {
      logClientError('writing.context', failure);
      if (requestId === evidenceRequest.current)
        setEvidence({
          api,
          scope: contextScope,
          error: 'Roster evidence could not be loaded. Retry before relying on depth suggestions.',
        });
    }
  }
  const consentId = useId();
  const ready = providers.find((option) => option.id === provider)?.status === 'ready';
  useEffect(() => {
    let mounted = true;
    void api.consent().then(
      (saved) => {
        if (mounted) {
          setConsent({ api, values: saved });
        }
      },
      () => {
        if (mounted)
          setError('Context-sharing preferences could not be loaded. Reload to try again.');
      },
    );
    return () => {
      mounted = false;
    };
  }, [api]);
  useEffect(() => {
    let mounted = true;
    void api.providers().then(
      (options) => {
        if (mounted) {
          setProviders({ api, options });
          if (!readinessRevision)
            setProvider(options.find((option) => option.status === 'ready')?.id || 'codex');
        }
      },
      (failure) => {
        logClientError('writing.providers', failure);
        if (mounted)
          setError(
            'AI configuration is unavailable. Ask the operator to check setup, then refresh readiness.',
          );
      },
    );
    return () => {
      mounted = false;
    };
  }, [api, readinessRevision]);
  useEffect(
    () => () => {
      request.current?.abort();
      evidenceRequest.current += 1;
    },
    [api, leagueId, year, week],
  );
  async function generateSummary(teamId: string) {
    if (busy || consentLoading || savingConsent || !approved || !ready) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setCancelled(false);
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
      setConsent({ api, values: await api.saveConsent({ provider, approved }) });
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
              setCancelled(true);
            }}
          >
            Cancel generation
          </Button>
        )}
        {cancelled && (
          <Text as="output">Generation cancelled. Your ranking take is unchanged.</Text>
        )}
        <Box borderWidth="1px" rounded="md" p={3}>
          <Text fontWeight="semibold">{provider === 'codex' ? 'Codex' : 'Claude'} readiness</Text>
          <Text>
            {!providerOption
              ? 'Checking provider setup…'
              : providerOption.status === 'not-enabled'
                ? 'Disabled for this application account. Ask the operator to enable writing access.'
                : providerOption.status === 'not-installed'
                  ? 'The server CLI is missing. Ask the operator to install it in the application runtime.'
                  : providerOption.status === 'login-check-failed'
                    ? 'Login check failed. Ask the operator to sign in again on the server.'
                    : 'Ready. Generation still depends on model access and available quota.'}
          </Text>
          <Text>
            {providerOption?.credentialSource === 'saved-key'
              ? 'Your saved personal key takes precedence over the server login.'
              : 'Server-managed login is configured by the operator and shares the operator’s account and quota. An optional personal key takes precedence.'}
          </Text>
          {provider === 'codex' && <CodexSetupGuide />}
          <Button
            type="button"
            variant="outline"
            mt={3}
            disabled={busy}
            onClick={() => setReadinessRevision((value) => value + 1)}
          >
            Refresh writing readiness
          </Button>
        </Box>
        {teams.length > 0 && (
          <section aria-label="Writing source evidence">
            <Heading as="h4" size="sm">
              Current-roster evidence
            </Heading>
            {!selectedTeamId && (
              <Field.Root>
                <Field.Label>Evidence team</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={contextTeam}
                    onChange={(event) => setEvidenceTeam(event.target.value)}
                  >
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            )}
            <Text fontSize="sm">
              Inspect the actual team context before sharing it. Historical editions keep unknown
              historical ownership unavailable.
            </Text>
            <Button
              type="button"
              variant="outline"
              mt={2}
              disabled={visibleEvidence?.loading}
              onClick={() => void inspectContext()}
            >
              {visibleEvidence?.loading ? 'Loading roster evidence…' : 'Inspect roster evidence'}
            </Button>
            {visibleEvidence?.error && <Text role="alert">{visibleEvidence.error}</Text>}
            {visibleEvidence?.context && (
              <Box mt={3}>
                <Text fontWeight="semibold">
                  {visibleEvidence.context.teamName} · Through week{' '}
                  {visibleEvidence.context.throughWeek}
                </Text>
                <Text>{visibleEvidence.context.depthNote}</Text>
                {visibleEvidence.context.depthSnapshotAt && (
                  <Text>
                    Roster captured:{' '}
                    {new Date(visibleEvidence.context.depthSnapshotAt).toLocaleString()}
                  </Text>
                )}
                <ul>
                  {visibleEvidence.context.depth.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
                <details>
                  <summary>Scoring, transaction and coverage evidence</summary>
                  <ul>
                    {[...visibleEvidence.context.facts, ...visibleEvidence.context.notes].map(
                      (line, index) => (
                        <li key={index}>{line}</li>
                      ),
                    )}
                  </ul>
                </details>
              </Box>
            )}
          </section>
        )}
        {error && <Text role="alert">{error}</Text>}
      </Stack>
    </Box>
  );
}
