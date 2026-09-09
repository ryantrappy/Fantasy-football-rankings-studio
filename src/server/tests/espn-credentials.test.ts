// @vitest-environment node
import {
  encryptCredentials,
  decryptCredentials,
  saveEspnCredentials,
  getEspnCredentials,
  getEspnCredentialStatus,
  removeEspnCredentials,
  skipEspnSetup,
} from '../espn-credentials.server';
import credentialModel from '../models/espn-credentials.model';
import { execute, operations } from '../operations.server';
import { verifyAuthorization } from '../auth.server';
import HttpException from '../exceptions/HttpException';

vi.mock('../models/espn-credentials.model', () => ({
  default: { findById: vi.fn(), updateOne: vi.fn() },
}));
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../auth.server', () => ({ verifyAuthorization: vi.fn() }));
const credentials = {
  espnS2: 'private-cookie-value',
  swid: '{12345678-1234-1234-1234-123456789abc}',
};
const records = new Map<string, { encryptedCredentials?: string; onboardingComplete?: boolean }>();
beforeEach(() => {
  records.clear();
  vi.stubEnv('ESPN_CREDENTIALS_KEY', 'ab'.repeat(32));
  vi.mocked(verifyAuthorization).mockResolvedValue('owner-a');
  vi.mocked(credentialModel.findById).mockImplementation(
    (owner) =>
      ({
        select: () => ({ lean: () => ({ exec: async () => records.get(String(owner)) }) }),
      }) as never,
  );
  vi.mocked(credentialModel.updateOne).mockImplementation(
    (filter, update) =>
      ({
        exec: async () => {
          const id = String((filter as unknown as { _id: string })._id);
          const changes = update as { $set?: object; $unset?: object };
          const record = records.get(id) || {};
          Object.assign(record, changes.$set);
          if (changes.$unset) delete record.encryptedCredentials;
          records.set(id, record);
        },
      }) as never,
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it('encrypts with random nonces, authenticates contents, and binds records to their owner', () => {
  const first = encryptCredentials('owner-a', credentials);
  expect(first).not.toContain(credentials.espnS2);
  expect(encryptCredentials('owner-a', credentials)).not.toBe(first);
  expect(decryptCredentials('owner-a', first)).toEqual(credentials);
  expect(() => decryptCredentials('owner-b', first)).toThrow('could not be read');
  const parts = first.split('.');
  parts[3] = Buffer.from('tampered ciphertext').toString('base64');
  expect(() => decryptCredentials('owner-a', parts.join('.'))).toThrow('could not be read');
  vi.stubEnv('ESPN_CREDENTIALS_KEY', 'cd'.repeat(32));
  expect(() => decryptCredentials('owner-a', first)).toThrow('could not be read');
});
it('saves only ciphertext under the verified subject and returns only flags', async () => {
  const result = await execute('Bearer token', (owner) =>
    operations.saveEspnCredentials(owner, credentials),
  );
  expect(result).toEqual({ ok: true, data: { configured: true, onboardingComplete: true } });
  expect(records.has('owner-a')).toBe(true);
  expect(JSON.stringify([...records.values()])).not.toContain(credentials.espnS2);
  expect(await getEspnCredentialStatus('owner-a')).toEqual({
    configured: true,
    onboardingComplete: true,
  });
  expect(await getEspnCredentials('owner-a')).toEqual(credentials);
  expect(await getEspnCredentials('owner-b')).toBeUndefined();
});
it('removes only the current owner cookies; skipping does not overwrite saved credentials', async () => {
  await saveEspnCredentials('owner-a', credentials);
  await saveEspnCredentials('owner-b', { ...credentials, espnS2: 'second-secret' });
  await skipEspnSetup('owner-a');
  expect(await getEspnCredentials('owner-a')).toEqual(credentials);
  expect(await removeEspnCredentials('owner-a')).toEqual({
    configured: false,
    onboardingComplete: true,
  });
  expect(await getEspnCredentials('owner-a')).toBeUndefined();
  expect((await getEspnCredentials('owner-b'))?.espnS2).toBe('second-secret');
});
it.each([
  { ...credentials, espnS2: 'cookie; SWID=injected' },
  { ...credentials, espnS2: 'cookie\r\nInjected: yes' },
  { ...credentials, swid: '' },
  { ...credentials, swid: '{12345678-1234-1234-1234-123456789abc' },
  { ...credentials, ownerSubject: 'owner-b' },
])('rejects invalid values or supplied owners before storage', async (input) => {
  await expect(saveEspnCredentials('owner-a', input)).rejects.toMatchObject({ status: 400 });
  expect(credentialModel.updateOne).not.toHaveBeenCalled();
});
it('rejects unauthenticated credential operations before accessing records', async () => {
  vi.mocked(verifyAuthorization).mockRejectedValue(new HttpException(401, 'Sign in to continue.'));
  for (const action of [
    operations.getEspnCredentialStatus,
    operations.removeEspnCredentials,
    operations.skipEspnSetup,
    (owner: string) => operations.saveEspnCredentials(owner, credentials),
  ]) {
    expect(await execute(undefined, action)).toMatchObject({ ok: false, error: { status: 401 } });
  }
  expect(credentialModel.findById).not.toHaveBeenCalled();
  expect(credentialModel.updateOne).not.toHaveBeenCalled();
});
it('requires a valid key for saving, but permits skipping without one', async () => {
  vi.stubEnv('ESPN_CREDENTIALS_KEY', '');
  await expect(saveEspnCredentials('owner-a', credentials)).rejects.toMatchObject({ status: 503 });
  expect(await skipEspnSetup('owner-a')).toEqual({ configured: false, onboardingComplete: true });
});
it('does not log or return database error details that might contain credentials', async () => {
  vi.mocked(credentialModel.updateOne).mockImplementationOnce(() => {
    throw new Error(credentials.espnS2);
  });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const result = await execute('Bearer token', (owner) =>
    operations.saveEspnCredentials(owner, credentials),
  );
  expect(result).toMatchObject({ ok: false, error: { status: 503 } });
  expect(JSON.stringify([result, log.mock.calls])).not.toContain(credentials.espnS2);
  log.mockRestore();
});
