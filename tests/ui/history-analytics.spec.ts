import { expect, test } from '@playwright/test';

test('historical analytics groups work on mobile without page-wide overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/tests/ui/?mode=history');
  for (const name of ['Competition', 'Matchup stories', 'Manager profiles']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    const summaries = page.getByRole('tabpanel').locator('details > summary');
    for (const summary of await summaries.all()) {
      if (
        !(await summary.evaluate((element) => (element.parentElement as HTMLDetailsElement).open))
      ) {
        await summary.click();
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(failures).toEqual([]);
  await expect(page.getByRole('button', { name: /share.*wrapped/i })).toHaveCount(0);
});
