import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute, executePublic } from '../server/operations.server';
import { publishing } from '../server/publishing.server';
async function privateRun<T>(name: string, action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await execute(getRequestHeader('Authorization'), action, name);
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
export const publicationStatus = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(({ data }) =>
    privateRun('publication.status', (owner) => publishing.status(owner, data)),
  );
export const publishEdition = createServerFn({ method: 'POST' })
  .validator((data: { id: string; revision: number }) => data)
  .handler(({ data }) =>
    privateRun('publication.publish', (owner) => publishing.publish(owner, data)),
  );
export const unpublishEdition = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(({ data }) =>
    privateRun('publication.unpublish', (owner) => publishing.unpublish(owner, data)),
  );
export const readEdition = createServerFn({ method: 'GET' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const result = await executePublic(() => publishing.read(data), 'publication.read');
    if (!result.ok) setResponseStatus(result.error.status);
    return result;
  });
