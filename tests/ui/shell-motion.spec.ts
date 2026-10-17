import { expect, test } from '@playwright/test';

for (const width of [320, 390]) {
  test(`Live header and selectors do not overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/tests/ui/?mode=live&managed=1');
    await expect(page.locator('.app-shell-live')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live matchups', exact: true })).toBeVisible();
    const league = page.getByRole('combobox', { name: 'League', exact: true });
    await expect(league).toBeVisible();
    expect((await league.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const liveControls = page.locator('.decision-explorer-live-controls');
    expect((await league.boundingBox())!.width).toBeGreaterThan(
      (await liveControls.boundingBox())!.width - 2,
    );
    const toolbar = page.locator('.workspace-toolbar');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    const toolbarBox = (await toolbar.boundingBox())!;
    const navBox = (await nav.boundingBox())!;
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(toolbarBox.y + toolbarBox.height + 1);
    for (const link of await nav.getByRole('link').all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`profile closes safely and reopens with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/tests/ui/?mode=workspace-insights');
    const trigger = page.getByRole('button', { name: 'Profile menu' });
    const panel = page.locator('.profile-menu-items');
    await trigger.click();
    await expect(page.getByRole('link', { name: 'Connect league' })).toBeVisible();
    await trigger.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Edit profile' })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Edit profile' })).toHaveCSS(
      'outline-color',
      'rgb(57, 73, 171)',
    );
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveAttribute('inert', '');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    if (reducedMotion === 'reduce') await expect(panel).toBeHidden();
    await trigger.click();
    await trigger.click();
    await trigger.click();
    await expect(panel).not.toHaveAttribute('inert');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveCSS('outline-color', 'rgb(241, 189, 129)');
  });
}

test('share privacy remains visible, and focus on white uses indigo immediately', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=workspace-insights');
  const trigger = page.getByRole('button', { name: 'Share report', exact: true });
  await trigger.click();
  await expect(
    page.getByText('Anyone with the link can view this report while public sharing is enabled.'),
  ).toBeVisible();
  const copy = page.getByRole('button', { name: 'Copy share link' });
  await trigger.focus();
  await page.keyboard.press('Tab');
  await expect(copy).toBeFocused();
  await expect(copy).toHaveCSS('outline-color', 'rgb(57, 73, 171)');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.locator('.share-report-menu-content')).toHaveAttribute('inert', '');
});

test('profile dismisses after keyboard navigation and same-route account actions', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=workspace-insights');
  const trigger = page.getByRole('button', { name: 'Profile menu' });
  await trigger.click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Other tools', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Other tools', exact: true })).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.getByRole('link', { name: 'Edit profile' }).focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.getByRole('link', { name: 'Edit profile' }).focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
