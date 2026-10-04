import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1280, 390]) {
  test(`player browsing and comparisons at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=players');
    await page.getByLabel('Compare Jordan Runner', { exact: true }).check();
    await page.getByLabel('Compare Alex Receiver', { exact: true }).check();
    await page.getByLabel('Last week').fill('4');
    const jordan = page.getByRole('region', { name: 'Jordan Runner profile' });
    const alex = page.getByRole('region', { name: 'Alex Receiver profile' });
    await expect(jordan).toContainText('Coverage: 4/4 weeks');
    await expect(alex).toContainText('Coverage: 3/4 weeks');
    await page.getByLabel('Search player name, position or provider ID').fill('Quarterback');
    await expect(page.getByLabel('Compare Jordan Runner', { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Remove Jordan Runner from comparison' }),
    ).toBeVisible();
    await jordan.getByText('Weekly scores', { exact: true }).click();
    await alex.getByText('Weekly scores', { exact: true }).click();
    await expect(alex.getByRole('row', { name: '3 Unavailable', exact: true })).toBeVisible();
    await jordan.getByText('Identity & data sources', { exact: true }).click();
    await expect(jordan.getByText(/ESPN: 22.00/)).toBeVisible();
    const bounds = await Promise.all([jordan.boundingBox(), alex.boundingBox()]);
    if (width > 768) expect(bounds[0]!.y).toBe(bounds[1]!.y);
    else expect(bounds[1]!.y).toBeGreaterThan(bounds[0]!.y + bounds[0]!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: `test-results/players-${width}.png`, fullPage: true });
    expect((await new AxeBuilder({ page }).include('#root').analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Remove Jordan Runner from comparison' }).click();
    await expect(jordan).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(page.getByRole('heading', { name: 'Start with a player' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await page.getByLabel('Position filter').selectOption('RB');
    await expect(page.getByLabel('Compare Jordan Runner', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Compare Alex Receiver', { exact: true })).toHaveCount(0);
  });
}
