import { expect, test } from '@playwright/test';

for (const [width, height] of [
  [1440, 900],
  [2048, 942],
  [1280, 720],
  [390, 844],
  [320, 568],
]) {
  test(`studio keeps selected commentary and compact controls at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=workspace-studio');
    const selected = page.getByRole('complementary', { name: 'Selected team take' });
    const take = selected.getByLabel('Commentary for Fourth & Long');
    await take.fill('Commentary stays with this team');
    await page.getByRole('button', { name: 'Move Fourth & Long down', exact: true }).click();
    await expect(take).toHaveValue('Commentary stays with this team');
    await take.fill('New commentary after reorder');
    await page.getByRole('button', { name: 'Undo move', exact: true }).click();
    await expect(take).toHaveValue('New commentary after reorder');
    await selected.getByRole('button', { name: 'Next', exact: false }).click();
    await expect(selected.getByRole('heading', { name: 'Sunday Stunners' })).toBeVisible();
    await selected.getByRole('button', { name: 'Prev', exact: false }).click();
    await expect(take).toHaveValue('New commentary after reorder');
    await page.getByRole('button', { name: 'Preview & export', exact: true }).click();
    await page.getByRole('button', { name: 'Compact preview (720px)' }).click();
    await expect(page.locator('.export-canvas')).toHaveClass(/compact-export/);
    await expect(page.locator('.export-comments').first()).toHaveText(
      'New commentary after reorder',
    );
    await page.getByRole('button', { name: 'Original preview (1304px)' }).click();
    await expect(page.locator('.export-canvas')).not.toHaveClass(/compact-export/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: `test-results-usability/studio-${width}.png`, fullPage: true });
  });
}
