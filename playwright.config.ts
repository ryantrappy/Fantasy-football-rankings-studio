import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  testDir: './tests/ui',
  testMatch: '**/*.spec.ts',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:3107',
    browserName: 'chromium',
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite --config tests/ui/vite.config.ts --host 127.0.0.1',
    url: 'http://127.0.0.1:3107/tests/ui/',
    reuseExistingServer: !process.env.CI,
  },
});
