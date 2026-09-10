import { installBrowserErrorLogging, logClientError } from './logging';
afterEach(() => vi.restoreAllMocks());
it('logs diagnostic fields once while redacting secrets and excluding payloads', () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(
    new Error('Bearer private-token\nCookie: secret-cookie\npassword=secret-pass'),
    { config: { data: 'private-body' } },
  );
  logClientError('save', error);
  logClientError('rethrow', error);
  expect(output).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(output.mock.calls[0][0]);
  expect(entry).toMatchObject({
    event: 'client_error',
    operation: 'save',
    error: { name: 'Error', stack: expect.any(String) },
  });
  for (const secret of ['private-token', 'secret-cookie', 'secret-pass', 'private-body'])
    expect(output.mock.calls[0][0]).not.toContain(secret);
});
it('captures browser errors and unhandled rejections and removes listeners on cleanup', () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => {});
  const remove = installBrowserErrorLogging(window);
  window.dispatchEvent(new ErrorEvent('error', { error: new Error('Browser failed') }));
  const rejection = new Event('unhandledrejection');
  Object.defineProperty(rejection, 'reason', { value: new Error('Promise failed') });
  window.dispatchEvent(rejection);
  expect(output.mock.calls.map((call) => JSON.parse(call[0]).operation)).toEqual([
    'window.error',
    'window.unhandledrejection',
  ]);
  remove();
  window.dispatchEvent(new ErrorEvent('error', { message: 'After cleanup' }));
  expect(output).toHaveBeenCalledTimes(2);
});
it('cannot break recovery if logging itself fails', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {
    throw new Error('Sink closed');
  });
  expect(() => logClientError('save', new Error('Failed'))).not.toThrow();
});
