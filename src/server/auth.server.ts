import '@tanstack/react-start/server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import HttpException from './exceptions/HttpException';

let keys: ReturnType<typeof createRemoteJWKSet> | undefined;
let keyIssuer: string | undefined;
export async function verifyAuthorization(header: string | undefined) {
  if (!header?.startsWith('Bearer ')) throw new HttpException(401, 'Sign in to continue.');
  const issuer = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, '') + '/';
  const audience = process.env.AUTH0_AUDIENCE;
  if (!process.env.AUTH0_ISSUER_BASE_URL || !audience)
    throw new Error('Auth0 server configuration is required.');
  if (!keys || issuer !== keyIssuer) {
    keys = createRemoteJWKSet(new URL('.well-known/jwks.json', issuer));
    keyIssuer = issuer;
  }
  try {
    const { payload } = await jwtVerify(header.slice(7), keys, {
      issuer,
      audience,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new Error('Missing subject');
    return payload.sub;
  } catch (cause) {
    throw new HttpException(401, 'Your session could not be verified. Sign in again.', { cause });
  }
}
