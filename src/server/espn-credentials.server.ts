import '@tanstack/react-start/server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { EspnCredentials, EspnCredentialStatus } from '../espn-credentials';
import credentialModel from './models/espn-credentials.model';
import HttpException from './exceptions/HttpException';

// Cookie values only: reject separators/control characters to prevent header injection.
const schema = z.object({
  espnS2: z.string().trim().min(1).max(4096).regex(/^[\x21-\x7e]+$/).refine(v => !/[;,"\\]/.test(v)),
  swid: z.string().trim().regex(/^\{?[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\}?$/i)
    .refine(v => v.startsWith('{') === v.endsWith('}')),
}).strict();
function validate(input: unknown): EspnCredentials {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpException(400, 'Enter both ESPN cookie values: espn_s2 and a valid SWID.');
  return result.data;
}
function encryptionKey() {
  const value = process.env.ESPN_CREDENTIALS_KEY;
  if (!value || !/^[a-f\d]{64}$/i.test(value))
    throw new HttpException(503, 'ESPN credential storage is not configured. Contact the administrator.');
  return Buffer.from(value, 'hex');
}
export function encryptCredentials(owner: string, credentials: EspnCredentials): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`espn:v1:${owner}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(validate(credentials)), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}
export function decryptCredentials(owner: string, value: string): EspnCredentials {
  const key = encryptionKey();
  try {
    const [version, iv, tag, data, extra] = value.split('.');
    if (version !== 'v1' || !iv || !tag || !data || extra !== undefined) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAAD(Buffer.from(`espn:v1:${owner}`));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return validate(JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')));
  } catch {
    throw new HttpException(503, 'Saved ESPN credentials could not be read. Save them again in ESPN settings.');
  }
}
// Never propagate database errors that could embed submitted cookies or encrypted records.
async function storage<T>(action: () => Promise<T>): Promise<T> {
  try { return await action(); }
  catch { throw new HttpException(503, 'ESPN credential storage is unavailable. Please try again.'); }
}
export async function getEspnCredentialStatus(owner: string): Promise<EspnCredentialStatus> {
  const record = await storage(() => credentialModel.findById(owner).select('+encryptedCredentials').lean().exec());
  return { configured: !!record?.encryptedCredentials, onboardingComplete: !!record?.onboardingComplete };
}
export async function getEspnCredentials(owner: string): Promise<EspnCredentials | undefined> {
  const record = await storage(() => credentialModel.findById(owner).select('+encryptedCredentials').lean().exec());
  return record?.encryptedCredentials ? decryptCredentials(owner, record.encryptedCredentials) : undefined;
}
export async function saveEspnCredentials(owner: string, input: unknown): Promise<EspnCredentialStatus> {
  const encryptedCredentials = encryptCredentials(owner, validate(input));
  await storage(() => credentialModel.updateOne({ _id: owner }, { $set: { encryptedCredentials, onboardingComplete: true } }, { upsert: true }).exec());
  return { configured: true, onboardingComplete: true };
}
export async function removeEspnCredentials(owner: string): Promise<EspnCredentialStatus> {
  await storage(() => credentialModel.updateOne({ _id: owner }, { $unset: { encryptedCredentials: 1 }, $set: { onboardingComplete: true } }, { upsert: true }).exec());
  return { configured: false, onboardingComplete: true };
}
export async function skipEspnSetup(owner: string): Promise<EspnCredentialStatus> {
  await storage(() => credentialModel.updateOne({ _id: owner }, { $set: { onboardingComplete: true } }, { upsert: true }).exec());
  return getEspnCredentialStatus(owner);
}
