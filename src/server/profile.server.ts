import '@tanstack/react-start/server-only';
import { z } from 'zod';
import type { UserProfile } from '../profile';
import HttpException from './exceptions/HttpException';

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    nickname: z.string().trim().min(1).max(100),
  })
  .strict();
let cached: { key: string; token: string; expires: number } | undefined;
let pending: { key: string; value: Promise<string> } | undefined;
function configuration() {
  const domain = process.env.AUTH0_MANAGEMENT_DOMAIN;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret || !/^[a-zA-Z0-9.-]+$/.test(domain))
    throw new HttpException(
      503,
      'Profile editing is not configured. Contact the site administrator.',
    );
  return { base: `https://${domain}/`, clientId, clientSecret };
}
async function request(url: string, init: RequestInit) {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      if (response.status === 429)
        throw new HttpException(429, 'Too many profile requests. Please try again shortly.');
      throw new HttpException(
        502,
        'Auth0 could not complete the profile request. Please try again or contact the site administrator.',
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof HttpException) throw error;
    // Never propagate upstream bodies, tokens, credentials or request details into logs.
    throw new HttpException(502, 'Auth0 could not be reached. Please try again.');
  }
}
async function managementToken(config: ReturnType<typeof configuration>) {
  const key = JSON.stringify(config);
  if (cached?.key === key && cached.expires > Date.now()) return cached.token;
  if (pending?.key === key) return pending.value;
  const value = (async () => {
    const data = await request(`${config.base}oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        audience: `${config.base}api/v2/`,
        scope: 'read:users update:users',
      }),
    });
    if (
      typeof data.access_token !== 'string' ||
      !data.access_token ||
      typeof data.expires_in !== 'number' ||
      !Number.isFinite(data.expires_in) ||
      data.expires_in <= 0
    )
      throw new HttpException(502, 'Auth0 returned an invalid profile authorization response.');
    cached = {
      key,
      token: data.access_token,
      expires: Date.now() + Math.max(0, data.expires_in - 60) * 1000,
    };
    return data.access_token as string;
  })();
  pending = { key, value };
  try {
    return await value;
  } finally {
    if (pending?.value === value) pending = undefined;
  }
}
async function profileRequest(
  owner: string,
  update?: z.infer<typeof updateSchema>,
): Promise<UserProfile> {
  const config = configuration();
  const token = await managementToken(config);
  const data = await request(`${config.base}api/v2/users/${encodeURIComponent(owner)}`, {
    method: update ? 'PATCH' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(update ? { body: JSON.stringify(update) } : {}),
  });
  if (data.user_id !== owner)
    throw new HttpException(502, 'Auth0 returned an invalid profile response.');
  return {
    userId: owner,
    name: typeof data.name === 'string' ? data.name : '',
    nickname: typeof data.nickname === 'string' ? data.nickname : '',
    email: typeof data.email === 'string' ? data.email : null,
    emailVerified: data.email_verified === true,
  };
}
export const getProfile = (owner: string) => profileRequest(owner);
export function updateProfile(owner: string, input: unknown) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success)
    throw new HttpException(
      400,
      'Enter a name and nickname of 1–100 characters. Only these fields can be edited.',
    );
  return profileRequest(owner, parsed.data);
}
