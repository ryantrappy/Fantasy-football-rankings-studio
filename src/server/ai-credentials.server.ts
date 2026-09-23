import '@tanstack/react-start/server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { AiCredentialStatus } from '../ai-credentials';
import type { WritingProvider } from '../writing';
import HttpException from './exceptions/HttpException';
import credentialModel from './models/ai-credentials.model';

type AiCredentials = Partial<Record<WritingProvider, string>>;

const credentialSchema = z
  .string()
  .trim()
  .min(1)
  .max(1024)
  .regex(/^[\x21-\x7e]+$/);

function encryptionKey() {
  const value = process.env.AI_CREDENTIALS_KEY;
  if (!value || !/^[a-f\d]{64}$/i.test(value))
    throw new HttpException(
      503,
      'AI credential storage is not configured. Contact the administrator.',
    );
  return Buffer.from(value, 'hex');
}
function validate(input: unknown): AiCredentials {
  const result = z
    .object({ codex: credentialSchema.optional(), claude: credentialSchema.optional() })
    .strict()
    .safeParse(input);
  if (!result.success || (!result.data.codex && !result.data.claude))
    throw new HttpException(400, 'Enter a valid API key.');
  return result.data;
}
function status(credentials: AiCredentials): AiCredentialStatus {
  return { codexConfigured: !!credentials.codex, claudeConfigured: !!credentials.claude };
}
export function encryptAiCredentials(owner: string, credentials: AiCredentials): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`ai:v1:${owner}`));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(validate(credentials)), 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}
export function decryptAiCredentials(owner: string, value: string): AiCredentials {
  try {
    const [version, iv, tag, data, extra] = value.split('.');
    if (version !== 'v1' || !iv || !tag || !data || extra !== undefined) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAAD(Buffer.from(`ai:v1:${owner}`));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return validate(
      JSON.parse(
        Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
          'utf8',
        ),
      ),
    );
  } catch {
    throw new HttpException(
      503,
      'Saved AI credentials could not be read. Save them again in your profile.',
    );
  }
}
async function storage<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch {
    throw new HttpException(503, 'AI credential storage is unavailable. Please try again.');
  }
}
export async function getAiCredentials(owner: string): Promise<AiCredentials> {
  const record = await storage(() =>
    credentialModel.findById(owner).select('+encryptedCredentials').lean().exec(),
  );
  return record?.encryptedCredentials
    ? decryptAiCredentials(owner, record.encryptedCredentials)
    : {};
}
export async function getAiCredentialStatus(owner: string): Promise<AiCredentialStatus> {
  return status(await getAiCredentials(owner));
}
export async function saveAiCredential(owner: string, input: unknown): Promise<AiCredentialStatus> {
  const data = z
    .object({ provider: z.enum(['codex', 'claude']), apiKey: credentialSchema })
    .strict()
    .safeParse(input);
  if (!data.success) throw new HttpException(400, 'Enter a valid API key.');
  const credentials = {
    ...(await getAiCredentials(owner)),
    [data.data.provider]: data.data.apiKey,
  };
  await storage(() =>
    credentialModel
      .updateOne(
        { _id: owner },
        { $set: { encryptedCredentials: encryptAiCredentials(owner, credentials) } },
        { upsert: true },
      )
      .exec(),
  );
  return status(credentials);
}
export async function removeAiCredential(
  owner: string,
  input: unknown,
): Promise<AiCredentialStatus> {
  const parsed = z
    .object({ provider: z.enum(['codex', 'claude']) })
    .strict()
    .safeParse(input);
  if (!parsed.success) throw new HttpException(400, 'Select a supported AI provider.');
  const provider = parsed.data.provider as WritingProvider;
  const credentials = await getAiCredentials(owner);
  delete credentials[provider];
  if (credentials.codex || credentials.claude) {
    await storage(() =>
      credentialModel
        .updateOne(
          { _id: owner },
          { $set: { encryptedCredentials: encryptAiCredentials(owner, credentials) } },
          { upsert: true },
        )
        .exec(),
    );
  } else {
    await storage(() =>
      credentialModel.updateOne({ _id: owner }, { $unset: { encryptedCredentials: 1 } }).exec(),
    );
  }
  return status(credentials);
}
