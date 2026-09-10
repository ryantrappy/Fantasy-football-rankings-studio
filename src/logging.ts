// Log diagnostic fields only, never entire errors with request bodies or user input.
const seen = new WeakSet<object>();
function redact(value: string) {
  return value
    .replace(/Bearer\s+[^\s"',;]+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_TOKEN]')
    .replace(/((?:cookie|authorization)\s*[:=]\s*)[^\r\n]+/gi, '$1[REDACTED]')
    .replace(
      /((?:espn_s2|swid|password|token|api_key|client_secret|secret)\s*[=:]\s*)[^\s;&"']+/gi,
      '$1[REDACTED]',
    )
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .slice(0, 10000);
}
export function logClientError(operation: string, error: unknown) {
  try {
    if (error && typeof error === 'object') {
      if (seen.has(error)) return;
      seen.add(error);
    }
    console.error(
      JSON.stringify({
        event: 'client_error',
        timestamp: new Date().toISOString(),
        operation,
        error:
          error instanceof Error
            ? {
                name: redact(error.name),
                message: redact(error.message),
                stack: error.stack ? redact(error.stack) : undefined,
              }
            : { message: typeof error === 'string' ? redact(error) : 'Non-Error failure' },
      }),
    );
  } catch {
    // Logging failures must not replace the original error or interrupt recovery.
  }
}
export function installBrowserErrorLogging(target: Window) {
  const onError = (event: ErrorEvent) =>
    logClientError('window.error', event.error || event.message);
  const onRejection = (event: PromiseRejectionEvent) =>
    logClientError('window.unhandledrejection', event.reason);
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
