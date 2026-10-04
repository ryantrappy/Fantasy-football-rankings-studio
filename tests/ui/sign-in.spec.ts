import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const [width, height] of [
  [1440, 1000],
  [390, 844],
] as const)
  test(`sign-in page has clear actions and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/sign-in.html');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('Know your team.');
    const primary = page.getByRole('button', { name: 'Sign in', exact: true });
    const recovery = page.getByRole('button', { name: 'Reset password through Auth0' });
    for (const button of [primary, recovery]) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      const style = await button.evaluate((node) => {
        const s = getComputedStyle(node);
        return { background: s.backgroundColor, border: s.borderStyle, borderColor: s.borderColor };
      });
      expect(
        style.background !== 'rgba(0, 0, 0, 0)' ||
          (style.border !== 'none' && style.borderColor !== 'rgba(0, 0, 0, 0)'),
      ).toBe(true);
    }
    await primary.focus();
    expect(await primary.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
    await primary.click();
    await expect(page).toHaveTitle('Sign-in requested');
    await recovery.click();
    await expect(page).toHaveTitle('Recovery requested');
    const intro = await page.locator('.landing-intro').boundingBox(),
      preview = await page.locator('.landing-preview').boundingBox();
    if (width === 390) expect(preview!.y - (intro!.y + intro!.height)).toBeGreaterThanOrEqual(32);
    else expect(preview!.x - (intro!.x + intro!.width)).toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(scan.violations).toEqual([]);
    await page.screenshot({ path: `/tmp/fantasy-sign-in-${width}.png`, fullPage: true });
  });
test('secondary actions and sort controls have visible button boundaries', async ({ page }) => {
  await page.goto('/tests/ui/?mode=palette');
  const back = page.getByRole('button', { name: 'Back to rankings' });
  await expect(back).toBeVisible();
  for (const button of [back, page.locator('.table-sort-button').first()]) {
    const style = await button.evaluate((node) => {
      const s = getComputedStyle(node);
      return {
        border: s.borderStyle,
        color: s.borderColor,
        height: node.getBoundingClientRect().height,
      };
    });
    expect(style.border).toBe('solid');
    expect(style.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.height).toBeGreaterThanOrEqual(44);
  }
});
test('managed-team controls fit a phone and retain a saved season/team after a full reload', async ({
  page,
}) => {
  const choices = new Map<number, string | null>();
  await page.route('**/tests/managed-team-api*', async (route) => {
    let year = Number(new URL(route.request().url()).searchParams.get('year'));
    if (route.request().method() === 'POST') {
      const data = JSON.parse(route.request().postData()!);
      year = data.year;
      choices.set(year, data.teamId);
    }
    await route.fulfill({
      json: {
        teams: [{ teamId: '1', teamName: 'My team', managerName: 'Manager' }],
        teamId: choices.get(year) ?? null,
        needsReselection: false,
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/managed-team.html');
  await page.getByLabel('My team season').fill('2026');
  await page.getByLabel('My managed team').selectOption('1');
  await page.getByRole('button', { name: 'Save my team' }).click();
  await expect(page.getByText('Your managed team was saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('My team season')).toHaveValue('2026');
  await expect(page.getByLabel('My managed team')).toHaveValue('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const select = await page.getByLabel('My managed team').boundingBox(),
    button = await page.getByRole('button', { name: 'Save my team' }).boundingBox();
  expect(button!.y - (select!.y + select!.height)).toBeGreaterThanOrEqual(12);
});
