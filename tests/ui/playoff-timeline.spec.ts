import { expect, test } from '@playwright/test';

test('week-by-week playoff chart shows both metrics without overflowing mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=playoffs');
  await page.getByRole('button', { name: 'Week-by-week chart' }).click();
  await expect(
    page.getByRole('img', { name: /Make playoffs probability by completed week/ }),
  ).toBeVisible();
  await expect(page.locator('.playoff-timeline-chart circle')).toHaveCount(16);
  await expect(page.locator('.playoff-timeline-chart circle').first()).toHaveCSS(
    'animation-name',
    'playoff-point-rise',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.getByRole('button', { name: 'Win championship' }).click();
  await expect(
    page.getByRole('img', { name: /Win championship probability by completed week/ }),
  ).toBeVisible();
  await page.getByText('Exact weekly percentages').click();
  await expect(
    page.getByRole('table', { name: 'Weekly win championship probabilities' }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.playoff-timeline-chart circle').first()).toHaveCSS(
    'animation-name',
    'none',
  );
});
