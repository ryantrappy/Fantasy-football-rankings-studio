// @vitest-environment node
import { createServer } from 'node:http';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { verifyAuthorization } from '../auth.server';

let server: ReturnType<typeof createServer>;
let issuer: string;
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
beforeAll(async () => {
  const keys = await generateKeyPair('RS256');
  privateKey = keys.privateKey;
  const jwk = { ...(await exportJWK(keys.publicKey)), kid: 'test', alg: 'RS256', use: 'sig' };
  server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test address');
  issuer = `http://127.0.0.1:${address.port}/`;
  vi.stubEnv('AUTH0_ISSUER_BASE_URL', issuer);
  vi.stubEnv('AUTH0_AUDIENCE', 'test-api');
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
async function token(
  audience = 'test-api',
  expiration = '5m',
  tokenIssuer?: string,
  subject = 'user-1',
) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(tokenIssuer || issuer)
    .setAudience(audience)
    .setSubject(subject)
    .setExpirationTime(expiration)
    .sign(privateKey);
}
test('accepts a signed token only for the configured issuer and audience', async () => {
  expect(await verifyAuthorization(`Bearer ${await token()}`)).toBe('user-1');
});
test('rejects missing, malformed, expired, wrong-audience, wrong-issuer and subjectless tokens', async () => {
  for (const value of [
    undefined,
    'Bearer junk',
    `Bearer ${await token('other-api')}`,
    `Bearer ${await token('test-api', '-1s')}`,
    `Bearer ${await token('test-api', '5m', 'https://other.example/')}`,
    `Bearer ${await token('test-api', '5m', undefined, '')}`,
  ]) {
    await expect(verifyAuthorization(value)).rejects.toMatchObject({ status: 401 });
  }
});
