import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const views = [
  ['overview', 'My weekly overview'],
  ['studio', 'Rankings studio'],
  ['insights', 'Did the moves pay off?'],
  ['history', 'League history'],
  ['playoffs', 'Playoff simulation'],
  ['profile', 'Your profile'],
  ['manage', 'Manage leagues'],
  ['create', 'Create a league.'],
  ['espn', 'ESPN settings'],
];
for (const width of [1280, 390]) {
  test(`workspace screens keep their hierarchy and fit at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    for (const [view, title] of views) {
      await page.goto(`/tests/ui/?mode=workspace-${view}`);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      const heading = page.locator('.studio-heading, .page-heading').first();
      await expect(heading).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
      const activeTab = page.locator('.app-nav a[data-status="active"]');
      if (width === 390 && (await activeTab.count())) {
        await expect
          .poll(async () => {
            const tab = await activeTab.boundingBox();
            return !!tab && tab.x >= 0 && tab.x + tab.width <= width;
          })
          .toBe(true);
      }
      if (view === 'overview')
        await expect(
          page.getByRole('heading', { name: 'Fourth & Long', exact: true }),
        ).toBeVisible();
      if (view === 'insights')
        await expect(page.getByRole('table', { name: 'Manager scorecard' })).toBeVisible();
      if (view === 'profile')
        await expect(page.getByLabel('Nickname', { exact: true })).toBeVisible();
      if (view === 'playoffs') {
        await page
          .getByText('Forecast assumptions and projection coverage', { exact: true })
          .click();
        await expect(page.getByText(/Projection mode:/)).toBeVisible();
        await page
          .getByText('Forecast assumptions and projection coverage', { exact: true })
          .click();
        await page.getByLabel('Forecast through week').selectOption('2');
        await expect(page.getByRole('note')).toBeVisible();
        await page.getByLabel('Forecast through week').selectOption('4');
      }
      if (view === 'manage') await expect(page.getByLabel('My team season')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        view,
      ).toBeLessThanOrEqual(width);
      const result = await new AxeBuilder({ page })
        .withRules([
          'color-contrast',
          'aria-valid-attr',
          'aria-allowed-attr',
          'aria-prohibited-attr',
          'label',
        ])
        .exclude('.export-canvas')
        .analyze();
      expect(result.violations, `${view}: ${JSON.stringify(result.violations)}`).toEqual([]);
      await page.screenshot({ path: `test-results/studio-${view}-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('keyboard access and branded navigation remain usable', async ({ page }) => {
  await page.goto('/tests/ui/?mode=workspace-overview');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace-content')).toBeFocused();
  await page.getByRole('link', { name: 'League history', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'League history', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'League history', exact: true })).toHaveAttribute(
    'data-status',
    'active',
  );
  await page.getByLabel('Profile menu').click();
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await expect(page.getByRole('heading', { name: 'Your profile', exact: true })).toBeVisible();
});

test('fantasy football browser and app icons are available', async ({ request }) => {
  const svg = await request.get('/studio-icon.svg');
  expect(svg.ok()).toBe(true);
  expect(await svg.text()).toContain('viewBox="0 0 64 64"');
  for (const path of ['/favicon.ico', '/logo192.png', '/logo512.png', '/apple-touch-icon.png'])
    expect((await request.get(path)).ok(), path).toBe(true);
  const manifest = await (await request.get('/manifest.json')).json();
  expect(manifest.name).toBe('Trapp Fantasy Studio');
  expect(manifest.theme_color).toBe('#172b4c');
});
