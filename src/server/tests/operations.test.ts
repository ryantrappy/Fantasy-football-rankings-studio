// @vitest-environment node
import { execute } from '../operations.server';
import { verifyAuthorization } from '../auth.server';
import { connectDatabase } from '../database.server';
import HttpException from '../exceptions/HttpException';
vi.mock('../auth.server', () => ({ verifyAuthorization: vi.fn() }));
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyAuthorization).mockResolvedValue('verified-user');
});
test('rejects unauthorized calls before connecting or executing private operations', async () => {
  vi.mocked(verifyAuthorization).mockRejectedValue(new HttpException(401, 'Sign in to continue.'));
  const action = vi.fn();
  expect(await execute(undefined, action)).toMatchObject({ ok: false, error: { status: 401 } });
  expect(connectDatabase).not.toHaveBeenCalled();
  expect(action).not.toHaveBeenCalled();
});
test('passes the verified subject and returns a plain success envelope', async () => {
  const action = vi.fn().mockResolvedValue([{ leagueId: '123' }]);
  expect(await execute('Bearer token', action)).toEqual({ ok: true, data: [{ leagueId: '123' }] });
  expect(action).toHaveBeenCalledWith('verified-user');
});
test('sanitizes internal errors and maps duplicate keys to conflicts', async () => {
  const result = await execute('Bearer token', async () => {
    throw new Error('private connection string and cookie');
  });
  expect(JSON.stringify(result)).not.toContain('private connection');
  expect(result).toMatchObject({ ok: false, error: { status: 500 } });
  expect(
    await execute('Bearer token', async () => {
      throw { code: 11000 };
    }),
  ).toMatchObject({ ok: false, error: { status: 409 } });
});
