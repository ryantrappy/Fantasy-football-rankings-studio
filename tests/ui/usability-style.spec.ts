import { expect, test } from '@playwright/test';

test('restored onboarding notice and provider remain readable on a narrow phone', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'fantasy-rankings:league-setup:studio-preview-owner',
      JSON.stringify({
        leagueId: '00123',
        leagueName: 'Restored private league',
        leagueType: 1,
        seasonId: 2025,
      }),
    );
  });
  await page.goto('/tests/ui/?mode=workspace-create');
  const notice = page.getByRole('status').filter({ hasText: 'league details were restored' });
  await expect(notice).toHaveCSS('display', 'block');
  const bounds = (await notice.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  await expect(page.getByRole('radio', { name: 'ESPN', exact: true })).toBeChecked();
  await expect(page.getByLabel('League ID', { exact: false })).toHaveValue('00123');
  await expect(page.getByLabel('Display name', { exact: false })).toHaveValue(
    'Restored private league',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath('restored-create-320.png'), fullPage: true });
});

for (const width of [1440, 320]) {
  test(`studio uses compact tabs and consistent controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=workspace-studio');
    const save = page.getByRole('button', { name: 'Save rankings', exact: true });
    const controlStyle = await save.evaluate((element) => ({
      font: getComputedStyle(element).fontFamily,
      workspaceFont: getComputedStyle(element.closest('.studio-surface')!).fontFamily,
      border: getComputedStyle(element).borderTopStyle,
    }));
    expect(controlStyle.font).toBe(controlStyle.workspaceFont);
    expect(controlStyle.border).toBe('solid');
    await expect(page.getByRole('button', { name: 'Draft & save status', exact: true })).toHaveCSS(
      'border-top-color',
      'rgb(220, 226, 238)',
    );
    await expect(page.getByLabel('Edition title')).toHaveCSS(
      'border-top-color',
      'rgb(137, 149, 167)',
    );
    const edit = page.getByRole('button', { name: 'Edit rankings', exact: true });
    await expect(edit).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(edit).toHaveCSS('border-bottom-color', 'rgb(57, 73, 171)');
    const tabs = page.locator('.ranking-view-tabs');
    if (width === 1440) {
      expect((await tabs.boundingBox())!.height).toBeLessThan(53);
      expect((await page.locator('.ranking-team-detail').boundingBox())!.width).toBe(340);
      const firstRow = (await page.locator('.team-editor').first().boundingBox())!;
      expect(firstRow.y + firstRow.height).toBeLessThan(900);
    }
    await edit.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Preview & export', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: 'Live ranking preview' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });

  test(`account panels follow the shared split layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=workspace-profile');
    await expect(page.getByLabel('Nickname', { exact: true })).toBeVisible();
    const access = page.getByRole('complementary', { name: 'Account access' });
    await expect(access).toBeVisible();
    if (width === 1440) expect((await access.boundingBox())!.width).toBe(340);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.goto('/tests/ui/?mode=workspace-manage');
    await expect(page.getByLabel('My managed team')).toBeVisible();
    const detail = page.locator('.explorer-league-detail:not([hidden])');
    if (width === 1440) expect((await detail.boundingBox())!.width).toBe(340);
    await expect(page.getByRole('button', { name: 'Delete league', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('report download uses a subtle border and retains keyboard focus', async ({ page }) => {
  await page.goto('/tests/ui/?mode=workspace-insights');
  const download = page.getByRole('button', { name: 'Download Team scoring CSV', exact: true });
  await expect(download).toHaveCSS('border-top-color', 'rgb(220, 226, 238)');
  await download.focus();
  await expect(download).toBeFocused();
  await expect(download).toHaveCSS('outline-style', 'solid');
  expect(
    await download.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth)),
  ).toBeGreaterThanOrEqual(2);
});
