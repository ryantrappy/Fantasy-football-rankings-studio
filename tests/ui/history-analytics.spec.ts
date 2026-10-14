import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const noOverflow = async (page: import('@playwright/test').Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};

test('manager explorer keeps context and real rivalry evidence beside the desktop view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/tests/ui/?mode=history');
  await page
    .getByRole('group', { name: 'Explore a manager', exact: true })
    .getByRole('button', { name: 'Blair', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Blair', exact: true })).toBeVisible();
  await expect(page.locator('.history-explorer-stats')).toContainText('0–8–0');
  const inspector = page.getByRole('complementary', { name: 'Selected rivalry' });
  await expect(inspector).toContainText('Blair vs. Alex');
  await expect(inspector).toContainText('Loss');
  await expect(inspector.getByRole('link').first()).toHaveAttribute(
    'href',
    /\/shared\/insights\?leagueId=preview&year=2025/,
  );
  expect(await inspector.boundingBox()).not.toBeNull();
  const main = await page.locator('.history-rivalry-main').boundingBox();
  const side = await inspector.boundingBox();
  expect(side!.x).toBeGreaterThan(main!.x + main!.width - 1);
  await page.getByRole('tab', { name: 'Competition', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Season history', exact: true })).toBeFocused();
  await expect(page.getByRole('table', { name: 'Manager season results' })).toContainText('0–4–0');
  await noOverflow(page);
  const accessibility = await new AxeBuilder({ page }).include('.history-explorer').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('all focused archive views work on phones without page-wide overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/tests/ui/?mode=history');
  await page
    .getByRole('combobox', { name: 'Explore a manager', exact: true })
    .selectOption('manager-1');
  await expect(page.getByRole('heading', { name: 'Blair', exact: true })).toBeVisible();
  for (const name of ['Competition', 'Season history', 'Matchup stories', 'Manager profiles']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    const buttons = page.getByRole('tabpanel').locator('.history-explorer-subnav > button');
    for (let index = 0; index < (await buttons.count()); index++) {
      await buttons.nth(index).click();
      await expect(buttons.nth(index)).toHaveAttribute('aria-pressed', 'true');
      await noOverflow(page);
    }
    await noOverflow(page);
  }
  await expect(page.getByRole('button', { name: /share.*wrapped/i })).toHaveCount(0);
  await page.locator('.history-explorer-library > summary').click();
  const archiveButtons = page
    .getByRole('group', { name: 'League archive views' })
    .getByRole('button');
  for (let index = 0; index < (await archiveButtons.count()); index++) {
    await archiveButtons.nth(index).click();
    await expect(archiveButtons.nth(index)).toHaveAttribute('aria-pressed', 'true');
    await noOverflow(page);
  }
  expect(failures).toEqual([]);
});

test('the explorer fits narrow phones and preserves schedule controls between views', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/tests/ui/?mode=history');
  await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
  await page.getByRole('combobox', { name: 'Schedule season', exact: true }).selectOption('2024');
  await page.getByRole('combobox', { name: 'Schedule owner', exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Playoffs', exact: true }).click();
  await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Schedule season', exact: true })).toHaveValue(
    '2024',
  );
  await expect(page.getByRole('combobox', { name: 'Schedule owner', exact: true })).toHaveValue(
    '3',
  );
  await noOverflow(page);
  await page.getByRole('tab', { name: 'Manager profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Wrapped', exact: true }).click();
  await noOverflow(page);
});

test('the complete history page keeps season controls compact and league reports reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=history-page');
  await expect(page.getByRole('region', { name: 'Manager explorer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh selected seasons' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '2024', exact: true })).not.toBeVisible();
  await page.locator('.history-season-picker > summary').click();
  await page.getByRole('checkbox', { name: '2024', exact: true }).uncheck();
  await expect(page.locator('.history-explorer-profile')).toContainText('1 of 1 selected seasons');
  await page.locator('.history-season-picker > summary').click();
  await page.getByRole('tab', { name: 'Season history', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Manager season results' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Manager season history' })).not.toBeVisible();
  await page.getByText('Detailed season metrics', { exact: true }).click();
  await expect(page.getByRole('table', { name: 'Manager season history' })).toBeVisible();
  await page.locator('.history-explorer-library > summary').click();
  await page.getByRole('button', { name: /League overview/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Who keeps making the right moves?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Manager comparison/ }).click();
  await expect(page.getByRole('heading', { name: 'Compare two managers' })).toBeVisible();
  await noOverflow(page);
});
