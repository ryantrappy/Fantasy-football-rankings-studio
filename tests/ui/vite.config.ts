import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react({ compiler: { target: '19' } })],
  resolve: {
    alias: [
      {
        find: '../api/public-insights',
        replacement: fileURLToPath(new URL('./public-insights-api.ts', import.meta.url)),
      },
      {
        find: '../api/client',
        replacement: fileURLToPath(new URL('./api-client.ts', import.meta.url)),
      },
    ],
  },
  optimizeDeps: { entries: ['tests/ui/index.html'] },
  server: { port: 3107 },
});
