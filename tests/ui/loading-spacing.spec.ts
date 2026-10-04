import { expect, test } from '@playwright/test';

const views = [
  'workspace-overview',
  'workspace-studio',
  'workspace-insights',
  'workspace-playoffs',
  'workspace-history',
  'workspace-profile',
  'workspace-manage',
  'workspace-espn',
  'players',
  'trade',
];

for (const width of [1280, 390]) {
  test(`loading cards keep workspace spacing and headings at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const view of views) {
      await page.goto(`/tests/ui/?mode=${view}&loading=1`);
      const skeleton = page.locator('.studio-loading').first();
      await expect(skeleton).toBeVisible();
      await expect(skeleton).toHaveCSS('display', 'block');
      const inset = view === 'workspace-profile' || view === 'workspace-espn';
      await expect(skeleton).toHaveCSS(
        'padding-left',
        inset ? '0px' : width === 390 ? '16px' : '24px',
      );
      await expect(skeleton.locator('.studio-skeleton-lines')).toHaveCSS('row-gap', '12px');
      await expect(skeleton.locator('.studio-skeleton-lines')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        view,
      ).toBeLessThanOrEqual(width);
      const heading = page.getByRole('heading', { level: 1 }).first();
      const before = await heading.boundingBox();
      const card = await skeleton.boundingBox();
      const parent = await skeleton.evaluate((element) =>
        element.parentElement!.getBoundingClientRect().toJSON(),
      );
      expect(card!.x, view).toBeGreaterThanOrEqual(parent.x);
      expect(card!.x + card!.width, view).toBeLessThanOrEqual(parent.right);
      if (view === 'workspace-studio' || view === 'workspace-profile')
        await page.screenshot({
          path: `test-results/loading-${view}-${width}.png`,
          fullPage: true,
        });
      await page.evaluate(() => document.dispatchEvent(new Event('preview-data-ready')));
      await expect(page.locator('.studio-loading')).toHaveCount(0);
      const after = await heading.boundingBox();
      // Refresh-button copy may change the available width; heading alignment stays fixed.
      expect(
        { x: after!.x, y: after!.y, height: after!.height },
        `${view} heading should stay in place`,
      ).toEqual({ x: before!.x, y: before!.y, height: before!.height });
    }
  });
}
