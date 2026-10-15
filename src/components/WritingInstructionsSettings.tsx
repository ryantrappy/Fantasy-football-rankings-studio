import { Box, Button, Field, Heading, Stack, Text, Textarea } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { logClientError } from '../logging';
import { MAX_WRITING_INSTRUCTIONS_LENGTH, type WritingApi } from '../writing';

type InstructionsApi = Pick<WritingApi, 'instructions' | 'saveInstructions'>;
interface SettingsState {
  api: InstructionsApi;
  instructions?: string;
  draft?: string;
  error?: string;
  busy?: boolean;
  saved?: boolean;
}

export function WritingInstructionsSettings({ api }: { api: InstructionsApi }) {
  const [result, setResult] = useState<SettingsState>();
  const [retry, setRetry] = useState(0);
  const active = useRef<object | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const request = {};
    active.current = request;
    void api.instructions().then(
      ({ instructions }) => {
        if (!cancelled) setResult({ api, instructions, draft: instructions });
      },
      (failure) => {
        logClientError('WritingInstructionsSettings.load', failure);
        if (!cancelled) setResult({ api, error: errorMessage(failure) });
      },
    );
    return () => {
      cancelled = true;
      active.current = undefined;
    };
  }, [api, retry]);
  const current = result?.api === api ? result : undefined;
  const loaded = current?.instructions !== undefined;
  const unsaved = loaded && current.draft !== current.instructions;
  async function save(instructions: string) {
    if (!current || !loaded || current.busy) return;
    const request = active.current;
    const pending = { ...current, busy: true, saved: false, error: undefined };
    setResult(pending);
    try {
      const next = await api.saveInstructions({ instructions });
      if (active.current === request)
        setResult({ api, instructions: next.instructions, draft: next.instructions, saved: true });
    } catch (failure) {
      logClientError('WritingInstructionsSettings.save', failure);
      if (active.current === request)
        setResult({ ...pending, busy: false, error: errorMessage(failure) });
    }
  }
  return (
    <Box as="section" borderWidth="1px" rounded="md" p={4}>
      <Stack gap={3}>
        <Heading as="h3" size="md">
          Your writing instructions
        </Heading>
        <Text>
          Save your writing style for this account only. These instructions are sent to the selected
          assistant with your writing requests. Leave this blank to use the default writing
          guidance.
        </Text>
        {!current && <Text as="output">Loading writing instructions…</Text>}
        {current?.error && <Text role="alert">{current.error}</Text>}
        {current && !loaded && (
          <Button
            variant="outline"
            onClick={() => {
              setResult(undefined);
              setRetry((value) => value + 1);
            }}
          >
            Retry writing instructions
          </Button>
        )}
        {loaded && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save(current.draft || '');
            }}
          >
            <Stack gap={3}>
              <Field.Root disabled={current.busy}>
                <Field.Label>Writing instructions</Field.Label>
                <Textarea
                  value={current.draft}
                  maxLength={MAX_WRITING_INSTRUCTIONS_LENGTH}
                  minHeight="12rem"
                  onChange={(event) =>
                    setResult({
                      ...current,
                      draft: event.target.value,
                      saved: false,
                      error: undefined,
                    })
                  }
                />
                <Field.HelperText>
                  {(current.draft || '').length.toLocaleString()} /{' '}
                  {MAX_WRITING_INSTRUCTIONS_LENGTH.toLocaleString()} characters
                </Field.HelperText>
              </Field.Root>
              <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
                <Button type="submit" colorPalette="indigo" disabled={current.busy || !unsaved}>
                  {current.busy ? 'Saving writing instructions…' : 'Save writing instructions'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={current.busy || (!current.draft && !current.instructions)}
                  onClick={() => void save('')}
                >
                  Clear writing instructions
                </Button>
              </Stack>
              {unsaved && !current.busy && <Text as="output">Unsaved writing instructions.</Text>}
              {current.saved && <Text as="output">Writing instructions saved.</Text>}
            </Stack>
          </form>
        )}
      </Stack>
    </Box>
  );
}
