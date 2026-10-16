import { defineConfig } from '@playwright/test';

const coldForecast = /\d+-team cold forecast yields to input with identical seeded results/;

// Whole files grouped by median duration from the first three sharded CI runs.
// Group four runs everything outside these lists, including new/renamed specs.
const browserGroups = [
  ['analytics-explorer', 'live-layout', 'contrast', 'reorder', 'manager-explorer', 'table-sorting'],
  [
    'forecast-responsiveness',
    'season-spacing',
    'insights-history-followup',
    'usability-style',
    'season-strength',
    'sign-in',
    'overview',
  ],
  [
    'history-analytics',
    'usability-decision',
    'loading-spacing',
    'usability-studio',
    'export-theme',
    'playoff-timeline',
    'writing-instructions',
  ],
].map((files) => files.map((name) => `**/${name}.spec.ts`));
const browserGroup = process.env.BROWSER_SHARD;
if (browserGroup !== undefined && !/^[1-4]$/.test(browserGroup)) {
  throw new Error('BROWSER_SHARD must be 1, 2, 3 or 4');
}
const browserSelection =
  browserGroup === undefined
    ? {}
    : browserGroup === '4'
      ? { testIgnore: browserGroups.flat() }
      : { testMatch: browserGroups[Number(browserGroup) - 1] };

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // PNG exports share one Vite server and can delay page startup on CI runners.
  // Keep local runs parallel; CI shards use separate runners with one worker each.
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: 'forecast-performance',
      testMatch: '**/forecast-responsiveness.spec.ts',
      grep: coldForecast,
      workers: 1,
    },
    {
      name: 'ui',
      grepInvert: coldForecast,
      ...browserSelection,
      // Timer latency is a wall-clock performance measurement: run it before
      // CPU-heavy PNG exports/calibration, then retain normal UI parallelism.
      dependencies: ['forecast-performance'],
    },
  ],
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
