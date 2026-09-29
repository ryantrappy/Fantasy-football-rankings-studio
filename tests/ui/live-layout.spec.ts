import { expect, test } from '@playwright/test';

test('the header owns selectors and the live grid fills the viewport for two and four selections', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/ui/?mode=live');
  await expect(page.locator('header').getByLabel('League')).toBeVisible();
  await expect(page.locator('header').getByRole('navigation')).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'All league matchups' });
  await sidebar.getByRole('button', { name: 'Highlight Home 1 versus Away 1' }).click();
  await sidebar.getByRole('button', { name: 'Highlight Home 2 versus Away 2' }).click();
  const board = page.getByRole('region', { name: 'Highlighted matchups' });
  await expect(board).toHaveAttribute('data-count', '2');
  const boardBox = (await board.boundingBox())!;
  for (const card of await page.locator('.live-matchup-card').all()) {
    const box = (await card.boundingBox())!;
    expect(box.height).toBeGreaterThan(boardBox.height - 30);
  }
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('two-matchups.png') });
  await sidebar.getByRole('button', { name: 'Highlight Home 3 versus Away 3' }).click();
  await sidebar.getByRole('button', { name: 'Highlight Home 4 versus Away 4' }).click();
  await expect(board).toHaveAttribute('data-count', '4');
  expect(await page.locator('.live-matchup-card').count()).toBe(4);
  for (const name of [
    'Home 1 versus Away 1',
    'Home 2 versus Away 2',
    'Home 3 versus Away 3',
    'Home 4 versus Away 4',
  ]) {
    const button = sidebar.getByRole('button', { name: `Remove ${name}`, exact: true });
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toBeEnabled();
  }
  const geometry = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    bottom: document.querySelector('.live-sidebar')!.getBoundingClientRect().bottom,
  }));
  expect(geometry.height).toBeLessThanOrEqual(900);
  expect(geometry.width).toBeLessThanOrEqual(1440);
  expect(geometry.bottom).toBeCloseTo(900, 0);
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('four-matchups.png') });
  await page.getByRole('combobox', { name: 'League' }).selectOption('2');
  await expect(sidebar.getByText('Sunday League')).toHaveCount(0);
  await expect(page.locator('.live-matchup-card')).toHaveCount(4);
  await page.getByLabel('Profile menu').click();
  await expect(page.getByRole('link', { name: 'Edit profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveTitle('Signed out');
});

test('the sidebar and selection board remain on screen on a phone', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=live');
  await page.getByRole('button', { name: 'Highlight Home 1 versus Away 1' }).click();
  await page.getByRole('button', { name: 'Highlight Home 2 versus Away 2' }).click();
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  expect(size.width).toBeLessThanOrEqual(390);
  expect(size.height).toBeLessThanOrEqual(844);
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile.png') });
});
