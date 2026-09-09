import '@tanstack/react-start/server-only';
import axios from 'axios';

function redact(value: string): string {
  let text = value;
  for (const key of [
    'MONGODB_URI',
    'ESPN_CREDENTIALS_KEY',
    'ESPN_S2',
    'SWID',
    'AUTH0_MANAGEMENT_CLIENT_SECRET',
  ]) {
    const secret = process.env[key];
    if (secret) text = text.split(secret).join('[REDACTED]');
  }
  return text
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_DATABASE_URI]')
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(/Bearer\s+[^\s"',;]+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_TOKEN]')
    .replace(/((?:cookie|authorization)\s*[:=]\s*)[^\r\n]+/gi, '$1[REDACTED]')
    .replace(
      /((?:espn_s2|swid|password|token|api_key|secret)\s*[=:]\s*)[^\s;&"']+/gi,
      '$1[REDACTED]',
    )
    .slice(0, 10000);
}
function describe(error: unknown, depth = 0): Record<string, unknown> {
  if (depth >= 4) return { message: 'Further error causes omitted' };
  if (error === null || typeof error !== 'object') {
    return { name: 'NonErrorThrow', message: redact(String(error)) };
  }
  // Never serialize Axios configs, request/response bodies, headers, or database documents.
  const details: Record<string, unknown> = {
    name: error instanceof Error ? redact(error.name) : 'NonErrorThrow',
    message:
      'message' in error && typeof error.message === 'string'
        ? redact(error.message)
        : 'An object was thrown',
  };
  if (error instanceof Error && error.stack) details.stack = redact(error.stack);
  if ('code' in error && (typeof error.code === 'string' || typeof error.code === 'number')) {
    details.code = redact(String(error.code));
  }
  if (axios.isAxiosError(error)) details.upstreamStatus = error.response?.status;
  if ('cause' in error && error.cause !== undefined)
    details.cause = describe(error.cause, depth + 1);
  return details;
}

export function logServerError(operation: string, error: unknown, status = 500) {
  try {
    console.error(
      JSON.stringify({
        event: 'server_call_failed',
        timestamp: new Date().toISOString(),
        operation,
        status,
        error: describe(error),
      }),
    );
  } catch {
    // An unusual thrown object must not prevent the original error response.
    try {
      console.error('server_call_failed: error details could not be serialized');
    } catch {
      /* The output sink may also be unavailable. */
    }
  }
}
