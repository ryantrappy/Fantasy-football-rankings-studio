// @vitest-environment node
import { logServerError } from '../logging.server';
import { execute, executePublic } from '../operations.server';
import { verifyAuthorization } from '../auth.server';
import { connectDatabase } from '../database.server';
import HttpException from '../exceptions/HttpException';
vi.mock('../auth.server', () => ({ verifyAuthorization: vi.fn() }));
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
let output: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetAllMocks();
  output = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(verifyAuthorization).mockResolvedValue('owner');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
test('logs a named private failure once with its stack but sanitizes the client response', async () => {
  const result = await execute(
    'Bearer test-token',
    async () => {
      throw new Error('Provider unexpectedly failed');
    },
    'getInsights',
  );
  expect(output).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(output.mock.calls[0][0]);
  expect(entry).toMatchObject({
    event: 'server_call_failed',
    operation: 'getInsights',
    status: 500,
    error: { name: 'Error', message: 'Provider unexpectedly failed', stack: expect.any(String) },
  });
  expect(result).toMatchObject({ ok: false, error: { status: 500 } });
  expect(JSON.stringify(result)).not.toContain('Provider unexpectedly failed');
});
test('logs authentication and database failures before the action runs', async () => {
  const action = vi.fn();
  vi.mocked(verifyAuthorization).mockRejectedValueOnce(
    new HttpException(401, 'Sign in', { cause: new Error('Token expired') }),
  );
  await execute(undefined, action, 'saveRanking');
  expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
    status: 401,
    error: { cause: { message: 'Token expired' } },
  });
  vi.mocked(connectDatabase).mockRejectedValueOnce(new Error('Database offline'));
  await execute('Bearer token', action, 'listLeagues');
  expect(output).toHaveBeenCalledTimes(2);
  expect(action).not.toHaveBeenCalled();
});
test.each([null, 'Unexpected string', { code: 11000 }, new Error('Public failure')])(
  'catches and logs nonstandard and public exceptions',
  async (failure) => {
    const result = await executePublic(async () => {
      throw failure;
    }, 'public.getInsights');
    expect(result.ok).toBe(false);
    expect(output).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0]).operation).toBe('public.getInsights');
  },
);
test('redacts credentials and excludes Axios request and response payloads', () => {
  vi.stubEnv('ESPN_S2', 'fake-espn-secret');
  vi.stubEnv('SWID', 'fake-swid-secret');
  vi.stubEnv('MONGODB_URI', 'mongodb://user:fake-db-secret@localhost/database');
  const cause = new Error(
    'Bearer fake-token\nCookie: session=other-secret\npassword=another-secret',
  );
  const error = Object.assign(
    new Error(`failed ${process.env.MONGODB_URI} ${process.env.ESPN_S2} ${process.env.SWID}`),
    {
      cause,
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
      config: { headers: { Cookie: 'raw-cookie' }, data: 'private-input' },
      request: { secret: 'private-request' },
      response: { status: 403, data: 'private-response' },
    },
  );
  logServerError('public.getInsights', error, 502);
  const text = output.mock.calls[0][0];
  for (const value of [
    'fake-espn-secret',
    'fake-swid-secret',
    'fake-db-secret',
    'fake-token',
    'other-secret',
    'another-secret',
    'raw-cookie',
    'private-input',
    'private-request',
    'private-response',
  ])
    expect(text).not.toContain(value);
  expect(JSON.parse(text)).toMatchObject({
    status: 502,
    error: { upstreamStatus: 403, code: 'ERR_BAD_RESPONSE', cause: { name: 'Error' } },
  });
});
test('handles cyclic causes without dropping the error log', () => {
  const error = new Error('Cycle');
  error.cause = error;
  logServerError('getInsights', error);
  expect(output).toHaveBeenCalledTimes(1);
  expect(output.mock.calls[0][0]).toContain('Further error causes omitted');
});
test('successful server calls do not produce error logs', async () => {
  await execute('Bearer token', async () => 'ok', 'getInsights');
  await executePublic(async () => 'ok', 'public.getInsights');
  expect(output).not.toHaveBeenCalled();
});
