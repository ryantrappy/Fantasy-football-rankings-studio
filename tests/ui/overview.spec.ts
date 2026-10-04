import { expect, test } from '@playwright/test';
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
