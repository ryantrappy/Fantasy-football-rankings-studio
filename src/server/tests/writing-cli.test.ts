// @vitest-environment node
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
const spawnMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: spawnMock }));
import { chat } from '@tanstack/ai';
import { WritingCliAdapter, checkWritingCliLogin, cliArguments } from '../writing-cli.server';
beforeEach(() => spawnMock.mockReset());
it('runs a no-shell CLI with a restricted environment and collects output through TanStack AI', async () => {
  let prompt = '';
  spawnMock.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new PassThrough(),
      kill: vi.fn(),
    });
    child.stdin.on('data', (chunk) => {
      prompt += chunk;
    });
    child.stdin.on('finish', () => {
      child.stdout.write('- One measured talking point.');
      child.emit('close', 0);
    });
    return child;
  });
  const text = await chat({
    adapter: new WritingCliAdapter('/approved/codex', 'codex', 'test-model'),
    messages: [{ role: 'user', content: 'Use only these stats.' }],
    stream: false,
  });
  expect(text).toBe('- One measured talking point.');
  expect(prompt).toContain('Use only these stats.');
  const [, args, options] = spawnMock.mock.calls[0];
  expect(args).toContain('read-only');
  expect(args).toContain('--ignore-user-config');
  expect(args).toContain('features.shell_tool=false');
  expect(options.shell).toBeUndefined();
  expect(options.env.MONGODB_URI).toBeUndefined();
  expect(options.env.ESPN_CREDENTIALS_KEY).toBeUndefined();
  expect(cliArguments('claude', '')).toContain('--no-session-persistence');
  expect(cliArguments('claude', '')).toContain('--tools');
});
it.each([
  ['codex' as const, ['login', 'status']],
  ['claude' as const, ['auth', 'status']],
])(
  'requires a successful %s login-status command before reporting readiness',
  async (provider, args) => {
    const child = Object.assign(new EventEmitter(), { kill: vi.fn() });
    spawnMock.mockReturnValue(child);
    const checked = checkWritingCliLogin(`/approved/${provider}`, provider);
    child.emit('close', provider === 'codex' ? 0 : 1);
    await expect(checked).resolves.toBe(provider === 'codex');
    expect(spawnMock).toHaveBeenCalledWith(
      `/approved/${provider}`,
      args,
      expect.objectContaining({ stdio: 'ignore' }),
    );
    const options = spawnMock.mock.calls[0][2];
    expect(options.env.MONGODB_URI).toBeUndefined();
    expect(options.env.ESPN_CREDENTIALS_KEY).toBeUndefined();
  },
);
