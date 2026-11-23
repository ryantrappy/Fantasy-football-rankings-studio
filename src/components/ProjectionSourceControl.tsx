import { Field, NativeSelect, Text } from '@chakra-ui/react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ProjectionSource } from '../projection-source';

const options = [
  { value: 'Combined', label: 'Combined' },
  { value: 'Sleeper', label: 'Sleeper only' },
  { value: 'ESPN', label: 'ESPN only' },
] as const;

const Context = createContext<{
  source: ProjectionSource;
  setSource: (source: ProjectionSource) => void;
}>({
  source: 'Combined',
  setSource: () => {},
});

function loadSource(key?: string): ProjectionSource {
  if (!key || typeof window === 'undefined') return 'Combined';
  try {
    const saved = window.localStorage.getItem(key);
    return options.find((option) => option.value === saved)?.value ?? 'Combined';
  } catch {
    return 'Combined';
  }
}

export function ProjectionSourceProvider({
  subject,
  children,
}: {
  subject?: string;
  children: ReactNode;
}) {
  const key = subject ? `projection-source:v1:${subject}` : undefined;
  const [source, saveSource] = useState<ProjectionSource>(() => loadSource(key));
  const setSource = (value: ProjectionSource) => {
    saveSource(value);
    if (!key) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Browser storage restrictions still allow an in-session selection.
    }
  };
  return <Context.Provider value={{ source, setSource }}>{children}</Context.Provider>;
}

export function useProjectionSource() {
  return useContext(Context).source;
}

export function ProjectionSourceControl() {
  const { source, setSource } = useContext(Context);
  return (
    <Field.Root px={3} py={2}>
      <Field.Label>Projection source</Field.Label>
      <NativeSelect.Root size="sm">
        <NativeSelect.Field
          value={source}
          onChange={(event) => {
            const chosen = options.find((option) => option.value === event.target.value);
            if (chosen) setSource(chosen.value);
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {source !== 'Combined' && (
        <Text fontSize="xs" color="fg.muted">
          Only complete estimates count toward lineup and matchup totals.
        </Text>
      )}
    </Field.Root>
  );
}
