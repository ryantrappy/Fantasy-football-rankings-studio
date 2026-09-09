// @vitest-environment node
const loadEnv = vi.hoisted(() => vi.fn());
vi.mock('vite', () => ({ defineConfig: (config: unknown) => config, loadEnv }));
vi.mock('@vitejs/plugin-react', () => ({ default: () => ({ name: 'react' }) }));
vi.mock('@tanstack/react-start/plugin/vite', () => ({ tanstackStart: () => ({ name: 'start' }) }));
vi.mock('nitro/vite', () => ({ nitro: () => ({ name: 'nitro' }) }));
import config from '../../../vite.config';
afterEach(() => vi.unstubAllEnvs());
it('loads the server encryption key and preserves shell overrides without exposing client definitions', async () => {
  vi.stubEnv('ESPN_CREDENTIALS_KEY', undefined);
  loadEnv.mockReturnValue({ ESPN_CREDENTIALS_KEY: 'a'.repeat(64) });
  if (typeof config !== 'function') throw new Error('Expected config factory');
  const settings = await config({ command: 'serve', mode: 'development' });
  expect(process.env.ESPN_CREDENTIALS_KEY).toBe('a'.repeat(64));
  expect(loadEnv).toHaveBeenCalledWith('development', process.cwd(), '');
  expect(settings.define).toBeUndefined();
  expect(settings.envPrefix).toBeUndefined();
  vi.stubEnv('ESPN_CREDENTIALS_KEY', 'b'.repeat(64));
  await config({ command: 'serve', mode: 'development' });
  expect(process.env.ESPN_CREDENTIALS_KEY).toBe('b'.repeat(64));
});
