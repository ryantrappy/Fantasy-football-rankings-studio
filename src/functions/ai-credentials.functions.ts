import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute, operations } from '../server/operations.server';
import type { WritingProvider } from '../writing';

async function run<T>(operation: string, action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await execute(getRequestHeader('Authorization'), action, operation);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}

export const getAiCredentialStatus = createServerFn({ method: 'GET' }).handler(() =>
  run('aiCredentials.status', operations.getAiCredentialStatus),
);
export const saveAiCredential = createServerFn({ method: 'POST' })
  .validator((data: { provider: WritingProvider; apiKey: string }) => data)
  .handler(({ data }) =>
    run('aiCredentials.save', (owner) => operations.saveAiCredential(owner, data)),
  );
export const removeAiCredential = createServerFn({ method: 'POST' })
  .validator((data: { provider: WritingProvider }) => data)
  .handler(({ data }) =>
    run('aiCredentials.remove', (owner) => operations.removeAiCredential(owner, data)),
  );
