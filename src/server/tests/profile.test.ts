// @vitest-environment node
import {
  getProfile,
  updateProfile,
  getWritingConsent,
  saveWritingConsent,
  getWritingInstructions,
  saveWritingInstructions,
} from '../profile.server';
import { MAX_WRITING_INSTRUCTIONS_LENGTH } from '../../writing';
const fetchMock = vi.fn();
const profile = {
  user_id: 'auth0|owner',
  name: 'Owner',
  nickname: 'owner',
  email: 'owner@example.com',
  email_verified: true,
  app_metadata: { role: 'admin' },
  user_metadata: { writing_instructions: 'Private account style.' },
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
it('rejects a Management API resource-server ID used as the M2M client ID', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_CLIENT_ID', '613b7c1a5ee51d004637b4c4');
  await expect(getProfile('auth0|owner')).rejects.toMatchObject({ status: 503 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it('derives the canonical Management API hostname from the configured Auth0 issuer', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_DOMAIN', '');
  vi.stubEnv('AUTH0_ISSUER_BASE_URL', 'https://tenant.auth0.com/');
  fetchMock.mockResolvedValueOnce(reply(profile));
  await expect(getProfile('auth0|owner')).resolves.toMatchObject({ userId: 'auth0|owner' });
  expect(fetchMock.mock.calls[0][0]).toBe('https://tenant.auth0.com/oauth/token');
});
it('rejects an invalid issuer fallback without making an upstream request', async () => {
  vi.stubEnv('AUTH0_MANAGEMENT_DOMAIN', '');
  vi.stubEnv('AUTH0_ISSUER_BASE_URL', 'https://attacker.example/');
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

it('reads approval from the account and defaults to unapproved', async () => {
  fetchMock.mockResolvedValueOnce(reply(profile));
  expect(await getWritingConsent('auth0|owner')).toEqual({ codex: false, claude: false });
  fetchMock.mockResolvedValueOnce(
    reply({
      ...profile,
      user_metadata: { writing_context_approval: { codex: true, claude: false } },
    }),
  );
  expect(await getWritingConsent('auth0|owner')).toEqual({ codex: true, claude: false });
});
it.each([true, false])(
  'persists approval %s while preserving other assistant choices',
  async (approved) => {
    const metadata = {
      writing_context_approval: { codex: !approved, claude: true },
      favorite: 'kept',
    };
    fetchMock
      .mockResolvedValueOnce(reply({ ...profile, user_metadata: metadata }))
      .mockResolvedValueOnce(reply(profile))
      .mockResolvedValueOnce(
        reply({
          ...profile,
          user_metadata: {
            ...metadata,
            writing_context_approval: { codex: approved, claude: true },
          },
        }),
      );
    expect(await saveWritingConsent('auth0|owner', { provider: 'codex', approved })).toEqual({
      codex: approved,
      claude: true,
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      user_metadata: { writing_context_approval: { codex: approved, claude: true } },
    });
  },
);
it('rejects invalid consent writes before calling Auth0', async () => {
  await expect(
    saveWritingConsent('auth0|owner', { provider: 'other', approved: true }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    saveWritingConsent('auth0|owner', { provider: 'codex', approved: true, user_id: 'other' }),
  ).rejects.toMatchObject({ status: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('persists and clears instructions independently for two accounts without changing profile metadata or consent', async () => {
  const users = new Map([
    [
      'auth0|owner',
      {
        ...profile,
        user_metadata: {
          favorite: 'kept',
          writing_context_approval: { codex: true, claude: false },
        },
      },
    ],
    [
      'auth0|other',
      {
        ...profile,
        user_id: 'auth0|other',
        user_metadata: {
          favorite: 'other',
          writing_context_approval: { codex: false, claude: true },
        },
      },
    ],
  ]);
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const owner = decodeURIComponent(url.split('/').at(-1)!);
    const user = users.get(owner)!;
    if (init.method === 'PATCH') {
      const update = JSON.parse(init.body as string);
      user.user_metadata = { ...user.user_metadata, ...update.user_metadata };
    }
    return reply(user);
  });

  expect(await getWritingInstructions('auth0|owner')).toEqual({ instructions: '' });
  expect(
    await saveWritingInstructions('auth0|owner', {
      instructions: '  My voice.\nKeep the jokes.  ',
    }),
  ).toEqual({ instructions: 'My voice.\nKeep the jokes.' });
  expect(await getWritingInstructions('auth0|owner')).toEqual({
    instructions: 'My voice.\nKeep the jokes.',
  });
  expect(await getWritingInstructions('auth0|other')).toEqual({ instructions: '' });
  expect(await getWritingConsent('auth0|owner')).toEqual({ codex: true, claude: false });
  await saveWritingConsent('auth0|owner', { provider: 'claude', approved: true });
  expect(await getWritingInstructions('auth0|owner')).toEqual({
    instructions: 'My voice.\nKeep the jokes.',
  });
  expect(
    await saveWritingInstructions('auth0|other', { instructions: 'A different style.' }),
  ).toEqual({ instructions: 'A different style.' });
  expect(await saveWritingInstructions('auth0|owner', { instructions: '   ' })).toEqual({
    instructions: '',
  });
  expect(await getWritingInstructions('auth0|other')).toEqual({
    instructions: 'A different style.',
  });
  expect(users.get('auth0|owner')?.user_metadata).toEqual({
    favorite: 'kept',
    writing_context_approval: { codex: true, claude: true },
    writing_instructions: '',
  });
  expect(users.get('auth0|other')?.user_metadata).toEqual({
    favorite: 'other',
    writing_context_approval: { codex: false, claude: true },
    writing_instructions: 'A different style.',
  });
  const firstWrite = fetchMock.mock.calls.find(([, init]) => init.method === 'PATCH');
  expect(firstWrite?.[0]).toBe('https://tenant.auth0.com/api/v2/users/auth0%7Cowner');
  expect(JSON.parse(firstWrite?.[1].body)).toEqual({
    user_metadata: { writing_instructions: 'My voice.\nKeep the jokes.' },
  });
});

it.each([
  null,
  { instructions: 123 },
  { instructions: 'A'.repeat(MAX_WRITING_INSTRUCTIONS_LENGTH + 1) },
  { instructions: 'Style', user_id: 'other' },
  { instructions: 'Style', app_metadata: { role: 'admin' } },
])('rejects invalid writing instructions before calling Auth0: %j', async (input) => {
  await expect(saveWritingInstructions('auth0|owner', input)).rejects.toMatchObject({
    status: 400,
  });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('accepts the instruction length boundary and rejects mismatched response identities', async () => {
  const instructions = 'A'.repeat(MAX_WRITING_INSTRUCTIONS_LENGTH);
  fetchMock.mockResolvedValueOnce(
    reply({ ...profile, user_metadata: { writing_instructions: instructions } }),
  );
  expect(await saveWritingInstructions('auth0|owner', { instructions })).toEqual({ instructions });
  fetchMock.mockResolvedValueOnce(
    reply({ ...profile, user_id: 'auth0|other', user_metadata: { writing_instructions: 'Other' } }),
  );
  await expect(getWritingInstructions('auth0|owner')).rejects.toMatchObject({ status: 502 });
});

it.each([undefined, 123, 'A'.repeat(MAX_WRITING_INSTRUCTIONS_LENGTH + 1)])(
  'defaults missing or invalid saved instructions to empty',
  async (saved) => {
    fetchMock.mockResolvedValueOnce(
      reply({ ...profile, user_metadata: { writing_instructions: saved } }),
    );
    expect(await getWritingInstructions('auth0|owner')).toEqual({ instructions: '' });
  },
);
