import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('weekly overview cards and actions fit a phone and preserve report context', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=overview');
  await expect(page.getByRole('heading', { name: 'My team', exact: true })).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Refresh overview' })).toBeEnabled();
  const link = page.getByRole('link', { name: 'Season insights' }).first();
  const destination = new URL((await link.getAttribute('href'))!, 'http://localhost');
  expect(destination.pathname).toBe('/insights');
  expect(JSON.parse(destination.searchParams.get('leagueId')!)).toBe('1');
  expect(destination.searchParams.get('year')).toBe('2026');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

for (const width of [1440, 390]) {
  test(`all-league overview keeps complete lineup and waiver decisions at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=overview');
    await expect(page.getByRole('heading', { name: 'My team', exact: true })).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Opponent 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Opponent 2', exact: true })).toBeVisible();
    const card = page.locator('.overview-card').first();
    await card.getByText('Lineup advisor', { exact: true }).click();
    await expect(card.getByRole('region', { name: /^Complete proposed lineup/ })).toContainText(
      'Bench Runner',
    );
    await expect(card.getByText(/Submitted projection: 10.00/)).toContainText('Change: +8.00');
    await card.getByText('Inspect alternative scenarios', { exact: true }).click();
    await card.getByLabel('Exclude Bench Runner').check();
    await expect(card.getByText(/Submitted projection: 10.00/)).toContainText('Change: +0.00');
    await card.getByText('Waiver advisor', { exact: true }).click();
    await card.getByRole('button', { name: 'Load / refresh available players' }).click();
    await card.getByLabel('Available-player position').selectOption('RB');
    await card.getByLabel('Unowned candidate').selectOption('candidate');
    await card.getByLabel('Hypothetical roster drop').selectOption('bench');
    await expect(card.getByText(/Optimized current-week lineup change/)).toContainText(
      '+4.00 points',
    );
    await expect(card.getByText(/Ownership checked/)).toContainText('Rosters 2/2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect((await new AxeBuilder({ page }).include('#root').analyze()).violations).toEqual([]);
    await page.screenshot({ fullPage: true, path: testInfo.outputPath(`overview-${width}.png`) });
  });
}
