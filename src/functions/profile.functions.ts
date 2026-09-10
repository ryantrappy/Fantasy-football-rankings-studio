import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { executePublic } from '../server/operations.server';
import { verifyAuthorization } from '../server/auth.server';
import * as profile from '../server/profile.server';
import type { ProfileUpdate } from '../profile';

async function run<T>(name: string, action: (owner: string) => Promise<T>) {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await executePublic(
    async () => action(await verifyAuthorization(getRequestHeader('Authorization'))),
    name,
  );
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
}
export const getProfile = createServerFn({ method: 'GET' }).handler(() =>
  run('getProfile', profile.getProfile),
);
export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: ProfileUpdate) => data)
  .handler(({ data }) => run('updateProfile', (owner) => profile.updateProfile(owner, data)));
