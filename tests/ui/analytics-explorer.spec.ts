import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const sizes = [
  { width: 1440, height: 900 },
  { width: 2048, height: 942 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];
const noOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};

for (const size of sizes) {
  test(`season team evidence persists across all seven views at ${size.width}x${size.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto('/tests/ui/?mode=analytics');
    const scoring = page.getByRole('table', { name: 'Team scoring', exact: true });
    await scoring.getByRole('button', { name: 'End Zone Experts', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Team scoring', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const inspector = page.getByRole('complementary', { name: 'Selected team inspector' });
    for (const name of [
      'Team scoring',
      'Weekly trends',
      'Roster strength',
      'Remaining schedule',
      'Manager report card',
      'Trades',
      'Pickups',
    ]) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(inspector).toContainText('End Zone Experts');
      await expect(inspector).toContainText('Manager 3');
      await noOverflow(page);
    }
    await inspector.getByRole('button', { name: 'Open in Weekly trends' }).click();
    await expect(page.getByRole('button', { name: 'Weekly trends', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page.getByRole('table', { name: 'Weekly scores', exact: true }).locator('tbody tr'),
    ).toHaveCount(4);
    await page.getByRole('button', { name: 'Roster strength', exact: true }).click();
    await page.getByRole('button', { name: 'Projected remaining weeks' }).click();
    await page.getByLabel('Sort roster charts by').selectOption('WR');
    const ranks = page.getByRole('table', { name: 'Position group rankings' });
    await expect(ranks.locator('.tier-1').first()).toHaveCSS(
      'background-color',
      'rgb(219, 234, 254)',
    );
    await expect(ranks.locator('.tier-2').first()).toHaveCSS(
      'background-color',
      'rgb(209, 250, 229)',
    );
    const chartAxis = page.locator('.season-strength .ts-chart').first();
    await expect(chartAxis).toContainText('1000');
    await expect(chartAxis).not.toContainText('2200');
    await page.getByRole('button', { name: 'Completed weeks only' }).click();
    await expect(chartAxis).toContainText('400');
    await expect(chartAxis).not.toContainText('1000');
    await page.getByRole('button', { name: 'Projected remaining weeks' }).click();
    await page.getByLabel('Sort roster charts by').selectOption('WR');
    await expect(chartAxis).toContainText('1000');
    if (size.width >= 1280) {
      const main = await page
        .locator('.season-insights-split > .analytics-explorer-content')
        .boundingBox();
      const side = await inspector.boundingBox();
      expect(side!.x).toBeGreaterThanOrEqual(main!.x + main!.width - 1);
    }
    await page.getByRole('button', { name: 'Remaining schedule', exact: true }).click();
    await expect(page.getByLabel('Weekly opponents for')).toHaveValue('3');
    await expect(
      page.getByRole('table', { name: 'End Zone Experts remaining opponents' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Roster strength', exact: true }).click();
    await expect(page.getByLabel('Sort roster charts by')).toHaveValue('WR');
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`season-${size.width}.png`),
      fullPage: true,
    });
  });

  test(`forecast modes retain exact odds and team path at ${size.width}x${size.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto('/tests/ui/?mode=analytics');
    await page.getByRole('button', { name: 'Open playoff preview' }).click();
    const table = page.getByRole('table', { name: 'Playoff probabilities', exact: true });
    await expect(table).toBeVisible();
    for (const name of ['Make playoffs', 'Earn bye', 'Reach semifinal', 'Reach final', 'Win title'])
      await expect(table.getByRole('columnheader', { name, exact: true })).toBeVisible();
    const orderedTeams = (await table.locator('tbody tr th').allTextContents()).map((name) =>
      name.trim(),
    );
    await table.getByRole('button', { name: 'Sunday Stunners', exact: true }).click();
    const inspector = page.getByRole('complementary', { name: 'Selected team path' });
    await expect(inspector).toContainText('Sunday Stunners');
    await expect(inspector).toContainText('head-to-head record, then points scored');
    await expect(inspector).toContainText('weeks 12–13');
    await page.getByRole('button', { name: 'Histogram mode' }).click();
    await expect(table).not.toBeVisible();
    await expect(page.locator('.forecast-histogram-grid')).toBeVisible();
    await page
      .getByText('Exact win and seed frequencies for Sunday Stunners', { exact: true })
      .click();
    await expect(
      page.getByRole('table', { name: 'Sunday Stunners win distribution', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('table', { name: 'Sunday Stunners playoff seed distribution', exact: true }),
    ).toContainText('Did not qualify');
    const cards = page.locator('.forecast-histogram-grid > article');
    expect(
      (await cards.locator(':scope > button').allTextContents()).map((name) => name.trim()),
    ).toEqual(orderedTeams);
    if (size.width === 1440) {
      const expanded = await cards.first().boundingBox();
      const laterCards = await Promise.all(
        [3, 4, 5].map((index) => cards.nth(index).boundingBox()),
      );
      expect(laterCards.some((card) => card!.y < expanded!.y + expanded!.height - 100)).toBe(true);
    }
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`forecast-histogram-${size.width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Week-by-week chart' }).click();
    await expect(
      page.getByRole('img', { name: /Make playoffs probability by completed week/ }),
    ).toBeVisible();
    await expect(inspector).toContainText('Sunday Stunners');
    await page.getByRole('button', { name: 'Advanced', exact: true }).click();
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText('Sunday Stunners');
    await expect(page.getByRole('button', { name: 'Run historical calibration' })).toBeVisible();
    await noOverflow(page);
    await page.getByRole('button', { name: 'Forecast table', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Histogram mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Table view' }).click();
    await expect(table).toBeVisible();
  });
}

test('downloads active weekly evidence, exact histogram counts and complete Advanced replay evidence', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/tests/ui/?mode=analytics');
  await page.getByRole('button', { name: 'Weekly trends', exact: true }).click();
  await page.getByRole('combobox', { name: 'Team', exact: true }).selectOption('1');
  const weeklyDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Weekly scores CSV', exact: true }).click();
  const weekly = await weeklyDownload;
  const csv = await readFile((await weekly.path())!, 'utf8');
  expect(csv).toContain('Fourth & Long');
  expect(csv).toContain('Best lineup');
  expect(csv).toContain('Unavailable');
  expect(csv).not.toContain('Sunday Stunners');
  await page.getByRole('button', { name: 'Open playoff preview' }).click();
  await expect(
    page.getByRole('table', { name: 'Playoff probabilities', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Histogram mode' }).click();
  await page
    .getByText('Exact win and seed frequencies for Sunday Stunners', { exact: true })
    .click();
  const countDownload = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download Sunday Stunners win distribution CSV', exact: true })
    .click();
  const countFile = await countDownload;
  const distribution = await readFile((await countFile.path())!, 'utf8');
  expect(distribution).toContain('Simulation count');
  const lines = distribution.trim().split(/\r?\n/);
  const header = lines.findIndex((line) => line.includes('Final wins'));
  const counts = lines
    .slice(header + 1)
    .map((line) => Number(line.split(',')[1].replaceAll('"', '')));
  expect(counts.reduce((sum, count) => sum + count, 0)).toBe(20000);
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await page.getByRole('button', { name: 'Run historical calibration' }).click();
  await expect(page.getByText('Backtest complete.', { exact: true })).toBeVisible({
    timeout: 60000,
  });
  const tables: Record<string, string | undefined> = {
    Convergence: undefined,
    'Weekly diagnostics': 'Weekly playoff forecast accuracy',
    'Season comparisons': 'Playoff accuracy by season',
    Reliability: 'Season-level playoff reliability',
    'Final seeding': undefined,
  };
  for (const [name, label] of Object.entries(tables)) {
    await page.getByRole('button', { name, exact: true }).click();
    if (label) await expect(page.getByRole('table', { name: label, exact: true })).toBeVisible();
    await noOverflow(page);
  }
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calibration JSON' }).click();
  const json = await jsonDownload;
  const replay = JSON.parse(await readFile((await json.path())!, 'utf8'));
  expect(replay).toHaveProperty('seasons');
  expect(JSON.stringify(replay)).toContain('tiebreakers');
  expect(JSON.stringify(replay)).toContain('roundWeeks');
  expect(JSON.stringify(replay)).not.toMatch(/password|cookie|apiKey/i);
});

test('leaving Advanced cancels an in-flight evaluation and ignores late history', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=analytics');
  await page.getByRole('button', { name: 'Open playoff preview' }).click();
  await page
    .getByRole('checkbox', { name: 'Delay calibration history for cancellation check' })
    .check();
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await page.getByRole('button', { name: 'Run historical calibration' }).click();
  await expect(page.getByRole('button', { name: 'Cancel calibration' })).toBeVisible();
  await page.getByRole('button', { name: 'Forecast table', exact: true }).click();
  await page.getByRole('button', { name: 'Release delayed history' }).click();
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await expect(page.getByText(/Calibration canceled/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Rerun historical calibration' })).toBeEnabled();
});

test('season and forecast controls have accessible labels and keyboard focus', async ({ page }) => {
  await page.goto('/tests/ui/?mode=analytics');
  await page
    .getByRole('table', { name: 'Team scoring' })
    .getByRole('button', { name: 'Fourth & Long', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Selected team inspector' })).toContainText(
    'Fourth & Long',
  );
  expect(
    (await new AxeBuilder({ page }).include('.analytics-explorer').analyze()).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Open playoff preview' }).click();
  await expect(page.getByRole('table', { name: 'Playoff probabilities' })).toBeVisible();
  await page.getByRole('button', { name: 'Histogram mode' }).click();
  expect(
    (await new AxeBuilder({ page }).include('.analytics-explorer-forecast').analyze()).violations,
  ).toEqual([]);
});
