import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function pngSize(png: Buffer) {
  expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

for (const width of [1440, 390]) {
  test(`season insights table downloads a full-width PNG at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=analytics');
    const table = page.getByRole('table', { name: 'Team scoring' });
    await expect(table).toBeVisible();
    const fullWidth = await table.evaluate((element) => element.scrollWidth);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Team scoring PNG' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('fantasy-rankings-team-scoring-fixture-2026.png');
    const png = await readFile((await download.path())!);
    const size = pngSize(png);
    // The image covers the table's full scroll width, not just the visible slice.
    expect(size.width).toBeGreaterThanOrEqual(fullWidth - 2);
    expect(size.width).toBeLessThanOrEqual(fullWidth + 2);
    expect(size.height).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(errors).toEqual([]);
  });

  test(`league history table downloads a full-width PNG at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=history-page');
    // The manager picker is a select on mobile and a button fieldset on desktop.
    if (width < 768) {
      await page
        .getByRole('combobox', { name: 'Explore a manager', exact: true })
        .selectOption('manager-1');
    } else {
      await page
        .getByRole('group', { name: 'Explore a manager' })
        .getByRole('button', { name: 'Alex' })
        .click();
    }
    await page.getByRole('tab', { name: 'Season history', exact: true }).click();
    await page.getByText('Detailed season metrics', { exact: true }).click();
    const table = page.getByRole('table', { name: 'Manager season history' });
    await expect(table).toBeVisible();
    const fullWidth = await table.evaluate((element) => element.scrollWidth);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Manager season history PNG' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(
      'fantasy-rankings-manager-season-history-123-2025-2024.png',
    );
    const png = await readFile((await download.path())!);
    const size = pngSize(png);
    expect(size.width).toBeGreaterThanOrEqual(fullWidth - 2);
    expect(size.width).toBeLessThanOrEqual(fullWidth + 2);
    expect(size.height).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(errors).toEqual([]);
  });
}
