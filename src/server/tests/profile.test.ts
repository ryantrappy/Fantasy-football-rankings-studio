// @vitest-environment node
import { getProfile, updateProfile } from '../profile.server';
const fetchMock = vi.fn();
const profile = {
  user_id: 'auth0|owner',
  name: 'Owner',
  nickname: 'owner',
  email: 'owner@example.com',
  email_verified: true,
  app_metadata: { role: 'admin' },
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.stubEnv('AUTH0_MANAGEMENT_DOMAIN', 'tenant.auth0.com');
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_ID', crypto.randomUUID());
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_SECRET', 'test-secret');
  fetchMock.mockResolvedValueOnce(reply({ access_token: 'management-token', expires_in: 3600 }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('reads only the owner profile, projects safe fields, and reuses the management token', async () => {
  fetchMock
    .mockResolvedValueOnce(reply(profile))
    .mockResolvedValueOnce(reply({ ...profile, name: 'New name' }));
  const result = await getProfile('auth0|owner');
  expect(result).toEqual({
    userId: 'auth0|owner',
    name: 'Owner',
    nickname: 'owner',
    email: 'owner@example.com',
    emailVerified: true,
  });
  expect(fetchMock.mock.calls[1][0]).toBe('https://tenant.auth0.com/api/v2/users/auth0%7Cowner');
  expect(
    await updateProfile('auth0|owner', { name: ' New name ', nickname: 'owner' }),
  ).toMatchObject({ name: 'New name' });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
    name: 'New name',
    nickname: 'owner',
  });
});
it('rejects arbitrary user IDs, privileged fields, blank and oversized values before any upstream request', async () => {
  for (const data of [
    { name: 'A', nickname: 'B', user_id: 'other' },
    { name: 'A', nickname: 'B', app_metadata: {} },
    { name: ' ', nickname: 'B' },
    { name: 'A'.repeat(101), nickname: 'B' },
  ]) {
    expect(() => updateProfile('auth0|owner', data)).toThrow();
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects a mismatched returned identity', async () => {
  fetchMock.mockResolvedValueOnce(reply({ ...profile, user_id: 'other' }));
  await expect(getProfile('auth0|owner')).rejects.toMatchObject({ status: 502 });
});
it('reports missing configuration without calling Auth0', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_SECRET', '');
  await expect(getProfile('auth0|owner')).rejects.toMatchObject({ status: 503 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it('sanitizes upstream failures and rate limits', async () => {
  fetchMock.mockResolvedValueOnce(reply({ message: 'sensitive provider body' }, 429));
  await expect(getProfile('auth0|owner')).rejects.toMatchObject({ status: 429 });
  fetchMock.mockResolvedValueOnce(reply({ message: 'sensitive provider body' }, 403));
  await expect(getProfile('auth0|owner')).rejects.toMatchObject({
    status: 502,
    message: expect.not.stringContaining('sensitive'),
  });
});
