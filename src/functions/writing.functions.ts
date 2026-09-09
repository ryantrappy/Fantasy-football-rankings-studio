import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute } from '../server/operations.server';
import { getWritingContext, generateWriting, writingProviders } from '../server/writing.server';
import type { WritingSelection, WritingProvider } from '../writing';
async function run<T>(operation: string, action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await execute(getRequestHeader('Authorization'), action, operation);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
export const getContext = createServerFn({ method: 'GET' })
  .validator((data: WritingSelection) => data)
  .handler(({ data }) => run('writing.context', (owner) => getWritingContext(owner, data)));
export const getProviders = createServerFn({ method: 'GET' }).handler(() =>
  run('writing.providers', writingProviders),
);
export const generateSuggestions = createServerFn({ method: 'POST' })
  .validator(
    (data: WritingSelection & { provider: WritingProvider; model: string; approved: boolean }) =>
      data,
  )
  .handler(({ data }) => run('writing.generate', (owner) => generateWriting(owner, data)));
