import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
