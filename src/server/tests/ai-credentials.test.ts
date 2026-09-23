// @vitest-environment node
import {
  decryptAiCredentials,
  encryptAiCredentials,
  getAiCredentialStatus,
  getAiCredentials,
  removeAiCredential,
  saveAiCredential,
} from '../ai-credentials.server';
import credentialModel from '../models/ai-credentials.model';
import { execute, operations } from '../operations.server';
import { verifyAuthorization } from '../auth.server';
import HttpException from '../exceptions/HttpException';

vi.mock('../models/ai-credentials.model', () => ({
  default: { findById: vi.fn(), updateOne: vi.fn() },
}));
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../auth.server', () => ({ verifyAuthorization: vi.fn() }));

const records = new Map<string, { encryptedCredentials?: string }>();
const credentials = { codex: 'sk-test-key', claude: 'sk-ant-test-key' };

beforeEach(() => {
  records.clear();
  vi.stubEnv('AI_CREDENTIALS_KEY', 'ab'.repeat(32));
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
          const record = records.get(id) || {};
          const changes = update as { $set?: typeof record; $unset?: object };
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

it('encrypts keys with a fresh nonce and binds ciphertext to its owner', () => {
  const first = encryptAiCredentials('owner-a', credentials);
  expect(first).not.toContain(credentials.codex);
  expect(encryptAiCredentials('owner-a', credentials)).not.toBe(first);
  expect(decryptAiCredentials('owner-a', first)).toEqual(credentials);
  expect(() => decryptAiCredentials('owner-b', first)).toThrow('could not be read');
});

it('stores only ciphertext, returns status flags, and isolates owners', async () => {
  await saveAiCredential('owner-a', { provider: 'codex', apiKey: credentials.codex });
  await saveAiCredential('owner-b', { provider: 'claude', apiKey: credentials.claude });
  expect(JSON.stringify([...records.values()])).not.toContain(credentials.codex);
  expect(await getAiCredentialStatus('owner-a')).toEqual({
    codexConfigured: true,
    claudeConfigured: false,
  });
  expect(await getAiCredentials('owner-a')).toEqual({ codex: credentials.codex });
  expect(await getAiCredentials('owner-b')).toEqual({ claude: credentials.claude });
  await expect(
    saveAiCredential('owner-a', { provider: 'codex', apiKey: ' bad key ' }),
  ).rejects.toMatchObject({ status: 400 });
});

it('removes only the requested provider and requires authentication before storage access', async () => {
  await saveAiCredential('owner-a', { provider: 'codex', apiKey: credentials.codex });
  await saveAiCredential('owner-a', { provider: 'claude', apiKey: credentials.claude });
  expect(await removeAiCredential('owner-a', { provider: 'codex' })).toEqual({
    codexConfigured: false,
    claudeConfigured: true,
  });
  expect(await getAiCredentials('owner-a')).toEqual({ claude: credentials.claude });
  vi.mocked(credentialModel.findById).mockClear();
  vi.mocked(verifyAuthorization).mockRejectedValue(new HttpException(401, 'Sign in to continue.'));
  await expect(execute(undefined, operations.getAiCredentialStatus)).resolves.toMatchObject({
    ok: false,
    error: { status: 401 },
  });
  expect(credentialModel.findById).not.toHaveBeenCalled();
});
