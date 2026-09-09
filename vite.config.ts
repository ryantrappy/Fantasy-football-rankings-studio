import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';

export default defineConfig(({ mode }) => {
  // Vite exposes VITE_* to the browser; these keys stay in the server process only.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['MONGODB_URI', 'AUTH0_ISSUER_BASE_URL', 'AUTH0_AUDIENCE', 'ESPN_S2', 'SWID']) {
    process.env[key] ??= env[key];
  }
  return {
    plugins: [
      tanstackStart(),
      nitro({
        preset: 'node-server',
        plugins: ['./server/plugins/database.ts'],
        routeRules: { '/_serverFn/**': { headers: { 'cache-control': 'no-store' } } },
      }),
      react(),
    ],
  };
});
