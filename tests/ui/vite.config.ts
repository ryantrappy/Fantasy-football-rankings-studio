import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '../api/client',
        replacement: fileURLToPath(new URL('./api-client.ts', import.meta.url)),
      },
    ],
  },
  optimizeDeps: { entries: ['tests/ui/index.html'] },
  server: { port: 3107 },
});
