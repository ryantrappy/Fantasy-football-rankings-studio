// @vitest-environment node
import { EventEmitter } from 'node:events';
const mocks = vi.hoisted(() => ({ access: vi.fn(), credentials: vi.fn(), spawn: vi.fn() }));
vi.mock('node:fs/promises', async (load) => ({ ...(await load()), access: mocks.access }));
vi.mock('../ai-credentials.server', () => ({ getAiCredentials: mocks.credentials }));
vi.mock('node:child_process', () => ({ spawn: mocks.spawn }));
import { writingProviders } from '../writing-cli.server';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PATH', '/approved');
  vi.stubEnv('WRITING_AI_PROVIDERS', 'codex');
  vi.stubEnv('WRITING_AI_USERS', 'owner,private-other-owner');
  mocks.credentials.mockResolvedValue({});
  mocks.access.mockResolvedValue(undefined);
  mocks.spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), { kill: vi.fn() });
    queueMicrotask(() => child.emit('close', 0));
    return child;
  });
});
afterEach(() => vi.unstubAllEnvs());
it('exposes only readiness enums for the enabled server account without credentials or other identities', async () => {
  const result = await writingProviders('owner');
  expect(result[0]).toEqual({
    id: 'codex',
    installed: true,
    enabled: true,
    status: 'ready',
    serverStatus: 'ready',
    credentialSource: 'server-account',
  });
  expect(JSON.stringify(result)).not.toContain('private-other-owner');
  expect(mocks.spawn).toHaveBeenCalledTimes(1);
  expect(mocks.spawn.mock.calls[0][2].stdio).toBe('ignore');
});
it('does not probe or reveal server login readiness for users outside the allowlist', async () => {
  expect((await writingProviders('unapproved'))[0]).toMatchObject({
    enabled: false,
    status: 'not-enabled',
    serverStatus: 'not-enabled',
    credentialSource: 'none',
  });
  expect(mocks.spawn).not.toHaveBeenCalled();
});
it('distinguishes missing CLI and failed login checks', async () => {
  mocks.access.mockRejectedValue(new Error('missing'));
  expect((await writingProviders('owner'))[0].serverStatus).toBe('not-installed');
  mocks.access.mockResolvedValue(undefined);
  mocks.spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), { kill: vi.fn() });
    queueMicrotask(() => child.emit('close', 1));
    return child;
  });
  expect((await writingProviders('owner'))[0]).toMatchObject({
    status: 'login-check-failed',
    serverStatus: 'login-check-failed',
  });
});
it('keeps saved-key readiness independent of disabled server access and never returns the key', async () => {
  mocks.credentials.mockResolvedValue({ codex: 'sk-private-test' });
  const result = await writingProviders('unapproved');
  expect(result[0]).toMatchObject({
    status: 'ready',
    serverStatus: 'not-enabled',
    credentialSource: 'saved-key',
  });
  expect(JSON.stringify(result)).not.toContain('sk-private-test');
  expect(mocks.spawn).not.toHaveBeenCalled();
});
