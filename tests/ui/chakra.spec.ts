import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const width of [1440, 390]) {
  test(`download keeps the original appearance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tests/ui/');
    await page.getByLabel('Edition title').waitFor();
    await page.getByRole('button', { name: 'Preview & export' }).click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('power-rankings-2026-week-2.png');
    const png = await readFile((await download.path())!);
    expect(png).toMatchSnapshot('rankings-original.png', { maxDiffPixels: 0, threshold: 0 });
  });
}

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
  await page.getByLabel('ESPN', { exact: true }).check();
  await page.getByLabel(/League ID/).fill('123456');
  await page.getByLabel(/Display name/).fill('Sunday League');
  await page.getByRole('button', { name: 'Create league', exact: true }).click();
  await expect(page).toHaveTitle('League created');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('TanStack scoring chart renders inside the Chakra provider', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/ui/?mode=chart');
  await expect(page.getByLabel(/Weekly actual fantasy points/)).toBeVisible();
  expect(errors).toEqual([]);
});
