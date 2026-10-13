import { expect, test } from '@playwright/test';

test('historical analytics groups work on mobile without page-wide overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/tests/ui/?mode=history');
  for (const name of ['Competition', 'Matchup stories', 'Manager profiles']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveCSS(
      'background-color',
      'rgb(23, 34, 59)',
    );
    await expect(page.getByRole('tab', { name, exact: true })).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    const summaries = page.getByRole('tabpanel').locator('details > summary');
    for (const summary of await summaries.all()) {
      if (
        !(await summary.evaluate((element) => (element.parentElement as HTMLDetailsElement).open))
      ) {
        await summary.click();
      }
    }
    if (name === 'Matchup stories') {
      for (const action of ['Import archive', 'Export archive']) {
        await expect(page.getByRole('button', { name: action, exact: true })).toHaveCSS(
          'min-height',
          '44px',
        );
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(failures).toEqual([]);
  await expect(page.getByRole('button', { name: /share.*wrapped/i })).toHaveCount(0);
});
