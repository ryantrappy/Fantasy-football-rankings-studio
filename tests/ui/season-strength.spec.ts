import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('shows real stacked bars, heatmap values, sort controls and remaining opponents', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/ui/?mode=season-strength');
  await expect(
    page.getByRole('heading', { name: 'Roster projections', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.season-strength svg rect').first()).toBeVisible();
  const ranks = page.getByRole('table', { name: 'Position group rankings' });
  await expect(ranks.getByText('The Underdogs with a very long team name')).toBeVisible();
  await page.getByLabel('Sort roster charts by').selectOption('WR');
  await expect(ranks.locator('tbody tr').first()).toContainText('Fourth & Long');
  await page.getByText('Fourth & Long · Your team · week-by-week opponents').click();
  const opponents = page.getByRole('table', { name: 'Fourth & Long remaining opponents' });
  await expect(opponents.locator('tbody tr')).toHaveCount(6);
  await expect(opponents.locator('tbody tr').first()).toContainText('Sleeper weekly lineup');
  await page.screenshot({ path: 'test-results/season-strength-desktop.png', fullPage: true });
  const accessibility = await new AxeBuilder({ page })
    .include('.season-strength')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('keeps wide chart and tables inside scrollable panels on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=season-strength');
  await expect(page.getByRole('heading', { name: 'Remaining schedule strength' })).toBeVisible();
  await expect(page.locator('.season-strength svg rect').first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  await page.screenshot({ path: 'test-results/season-strength-mobile.png', fullPage: true });
});
