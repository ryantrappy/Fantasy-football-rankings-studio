import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

// Chrome color conversion can vary by one channel level; geometry and visible changes still fail.
for (const width of [1440, 390]) {
  test(
    `download keeps the original appearance at ${width}px`,
    { tag: '@png-baseline' },
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/tests/ui/');
      await page.getByLabel('Edition title').waitFor();
      await page.getByRole('button', { name: 'Preview & export' }).click();
      await page.getByRole('button', { name: 'Compact preview (720px)' }).click();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download PNG' }).click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toBe('power-rankings-2026-week-2.png');
      const png = await readFile((await download.path())!);
      await writeFile(testInfo.outputPath('original-export.png'), png);
      await testInfo.attach('original-export', { body: png, contentType: 'image/png' });
      expect(png).toMatchSnapshot('rankings-original.png', { maxDiffPixels: 0, threshold: 0.01 });
    },
  );
}

test(
  'compact download keeps every team and long commentary readable without clipping',
  { tag: '@png-baseline' },
  async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto('/tests/ui/');
    await page
      .getByLabel('Edition title')
      .fill('A compact ranking with a deliberately long headline');
    await page
      .getByLabel('Commentary for Fourth & Long')
      .fill(
        'This deliberately long mobile commentary preserves every word, including SupercalifragilisticexpialidociousWithoutBreaks, on a compact image without clipping.',
      );
    await page.getByRole('button', { name: 'Preview & export' }).click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compact PNG' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('power-rankings-2026-week-2-compact.png');
    const png = await readFile((await download.path())!);
    await writeFile(testInfo.outputPath('compact-export.png'), png);
    await testInfo.attach('compact-export', { body: png, contentType: 'image/png' });
    expect(png).toMatchSnapshot('rankings-compact.png', { maxDiffPixels: 0, threshold: 0.01 });
  },
);

test('editing, keyboard reorder, undo, and save still work', async ({ page }) => {
  await page.goto('/tests/ui/');
  await page.getByLabel('Edition title').fill('Updated edition');
  await expect(page.locator('.export-title')).toHaveText('Updated edition');
  await page.getByRole('button', { name: 'Move Sunday Stunners up' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.export-team-name').first()).toHaveText('Sunday Stunners');
  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('.export-team-name').first()).toHaveText('Fourth & Long');
  await page.getByLabel('Commentary for Fourth & Long').fill('A new take.');
  await expect(page.locator('.export-comments').first()).toHaveText('A new take.');
  await expect(page.getByText('All changes saved')).toBeVisible();
});

test('league creation retains labels, platform selection, and submission', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=create');
  const espnOption = page.locator('label[for="provider-espn"]');
  const espnRadio = page.getByRole('radio', { name: 'ESPN', exact: true });
  await espnOption.click();
  await expect(espnOption).toHaveClass(/selected/);
  await expect(espnRadio).toBeChecked();
  await page.getByLabel(/League ID/).fill('123456');
  await page.getByLabel(/Display name/).fill('Sunday League');
  await page.getByRole('button', { name: 'Connect league', exact: true }).click();
  await expect(page).toHaveTitle('League created');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('TanStack scoring chart renders inside the Chakra provider', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/ui/?mode=chart');
  await expect(page.getByLabel(/Weekly actual fantasy points/)).toBeVisible();
  await page.locator('.ts-chart__dot').last().locator('circle').first().hover();
  await expect(page.locator('.ts-chart-tooltip')).toContainText('Fourth & Long');
  await expect(page.locator('.ts-chart-tooltip')).toContainText('Week 1');
  await expect(page.locator('.ts-chart-tooltip')).toContainText('Actual: 105.0 points');
  await expect(page.locator('.ts-chart-tooltip')).toContainText('Lineup projection: 105.0 points');
  expect(errors).toEqual([]);
});
