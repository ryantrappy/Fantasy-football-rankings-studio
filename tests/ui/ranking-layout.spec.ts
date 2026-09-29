import { expect, test } from '@playwright/test';

test('team entries scroll independently while the preview stays in place', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto('/tests/ui/');
  const entries = page.getByRole('region', { name: 'Scrollable team entries' });
  const preview = page.getByRole('region', { name: 'Live ranking preview' });
  await entries.waitFor();
  const workspace = page.locator('.editor-layout');
  expect((await workspace.boundingBox())!.height).toBe(800);
  await workspace.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  const pageScroll = await page.evaluate(() => window.scrollY);
  expect(pageScroll).toBeGreaterThan(0);
  const before = await preview.boundingBox();
  await entries.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await entries.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await preview.boundingBox()).toEqual(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
  expect(await page.locator('.editor-tools').getAttribute('open')).toBeNull();
  await page.locator('.editor-tools > summary').click();
  await expect(page.getByText('Keyboard shortcuts', { exact: true })).toBeVisible();
  await page.locator('.editor-tools > summary').click();
  await entries.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: 'test-results/ranking-studio-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile editor keeps help available and switches to preview without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/');
  await page.getByLabel('Edition title').waitFor();
  expect((await page.locator('.editor-layout').boundingBox())!.height).toBe(844);
  await expect(page.getByRole('region', { name: 'Live ranking preview' })).toBeHidden();
  await page.getByRole('button', { name: 'Preview & export' }).click();
  await expect(page.getByRole('region', { name: 'Live ranking preview' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

for (const width of [1440, 390]) {
  test(`editor fits below the measured header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/tests/ui/?mode=editor-header');
    const workspace = page.locator('.editor-layout');
    await expect(workspace).toHaveCSS('height', '672px');
    await workspace.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    expect((await workspace.boundingBox())!.y).toBe(128);
    expect((await workspace.boundingBox())!.y + (await workspace.boundingBox())!.height).toBe(800);
    await page.locator('.workspace-header').evaluate((element) => {
      element.style.height = '96px';
    });
    await expect(workspace).toHaveCSS('height', '704px');
    await expect(workspace).toHaveCSS('scroll-margin-top', '96px');
  });
}
