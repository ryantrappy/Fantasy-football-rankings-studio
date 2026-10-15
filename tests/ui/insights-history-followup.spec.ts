import { expect, test } from '@playwright/test';

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
  [390, 844],
  [320, 568],
]) {
  test(`History header controls align and wrap at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=workspace-history');
    await expect(page.getByRole('region', { name: 'Manager explorer' })).toBeVisible();
    const league = page.getByRole('combobox', { name: 'League', exact: true });
    const insights = page.getByRole('link', { name: 'Current season insights', exact: true });
    const sharing = page.locator('.share-report-menu > summary');
    const controls = await Promise.all(
      [league, insights, sharing].map((item) => item.boundingBox()),
    );
    for (const bounds of controls) {
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    if (width >= 1280) {
      const bottoms = controls.map((bounds) => bounds!.y + bounds!.height);
      expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
      expect(controls[2]!.x - (controls[1]!.x + controls[1]!.width)).toBeGreaterThanOrEqual(11);
    } else {
      expect(controls[1]!.height).toBeGreaterThanOrEqual(44);
      expect(controls[2]!.height).toBeGreaterThanOrEqual(44);
    }
    await sharing.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.share-report-menu')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(sharing).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({
      path: testInfo.outputPath(`history-header-${width}.png`),
      fullPage: false,
    });
  });

  test(`Codex operator guidance is local and keyboard accessible at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=workspace-profile');
    await page.getByRole('button', { name: 'Writing connections', exact: true }).click();
    const summary = page.locator('.codex-setup-guide > summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.codex-setup-guide')).toHaveAttribute('open', '');
    await expect(page.getByText(/login --device-auth/, { exact: false })).toBeVisible();
    await expect(page.locator('a[href*="github.com"][href*="README"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.keyboard.press('Enter');
    await expect(page.locator('.codex-setup-guide')).not.toHaveAttribute('open');
    await page.screenshot({
      path: testInfo.outputPath(`codex-guide-${width}.png`),
      fullPage: false,
    });
  });
}
