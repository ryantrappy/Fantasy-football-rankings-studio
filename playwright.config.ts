import { defineConfig } from '@playwright/test';
export default defineConfig({
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  testDir: './tests/ui',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://127.0.0.1:3107', browserName: 'chromium', channel: 'chrome' },
  webServer: {
    command: 'npx vite --config tests/ui/vite.config.ts --host 127.0.0.1',
    url: 'http://127.0.0.1:3107/tests/ui/',
    reuseExistingServer: !process.env.CI,
  },
});
