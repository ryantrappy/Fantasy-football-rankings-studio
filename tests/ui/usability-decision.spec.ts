import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  [1440, 900],
  [2048, 942],
  [1280, 720],
  [390, 844],
  [320, 568],
];
for (const [width, height] of viewports) {
  test(`real overview gains and quick decisions remain reachable at ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=overview');
    const card = page.locator('.overview-card').first();
    await expect(card.getByText('1 upgrade', { exact: true })).toBeVisible();
    await expect(card.locator('summary').filter({ hasText: 'Lineup advisor' })).toContainText(
      '+8.00 pts',
    );
    await expect(card.locator('.overview-tug-bar')).toHaveAttribute(
      'aria-label',
      /uncalibrated win estimate/,
    );
    await card.getByText('Quick preview', { exact: true }).click();
    const preview = card.getByRole('table', { name: 'Quick lineup & waiver preview' });
    await expect(preview.getByRole('row', { name: /Waiver upgrade/ })).toContainText('+4.00 pts');
    await card.getByText('Lineup advisor', { exact: true }).click();
    await card.getByText('Inspect alternative scenarios', { exact: true }).click();
    await card.getByLabel('Exclude Bench Runner').check();
    await expect(card.getByText(/Submitted projection: 10.00/)).toContainText('Change: +0.00');
    await expect(card.locator('summary').filter({ hasText: 'Lineup advisor' })).toContainText(
      '+0.00 pts',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    if (width === 390)
      expect((await new AxeBuilder({ page }).include('#root').analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`overview-${width}.png`), fullPage: true });
  });

  test(`selected player matrix preserves real samples at ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=players');
    await page.getByLabel('Compare Jordan Runner', { exact: true }).check();
    await page.getByLabel('Compare Alex Receiver', { exact: true }).check();
    const matrix = page.getByRole('table', { name: /Side-by-side weekly comparison/ });
    await expect(matrix.getByRole('row', { name: 'Window total 60.00 47.00' })).toBeVisible();
    await expect(
      matrix.getByRole('row', { name: 'Sleeper projection 19.00 Unavailable' }),
    ).toBeVisible();
    await expect(
      matrix.getByRole('row', { name: 'ESPN projection 22.00 Unavailable' }),
    ).toBeVisible();
    await expect(
      matrix.getByRole('row', { name: 'Week 3 observed 16.00 Unavailable' }),
    ).toBeVisible();
    await page.getByLabel('Last week').fill('2');
    await expect(matrix.getByRole('row', { name: 'Window total 26.00 28.00' })).toBeVisible();
    await page.getByLabel('Search player name, position or provider ID').fill('Quarterback');
    await expect(matrix.getByRole('columnheader', { name: /Jordan Runner/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: testInfo.outputPath(`matrix-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(matrix).toHaveCount(0);
  });

  test(`mutual trade exchange and capacity remain inspectable at ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=trade-suggestions');
    await page.getByRole('button', { name: 'Find trade ideas' }).click();
    await page
      .getByRole('article', { name: 'Suggestion 1 with Sunday Stunners' })
      .getByRole('button', { name: 'Inspect trade with Sunday Stunners' })
      .click();
    const banner = page.getByLabel('Trade exchange summary');
    await expect(banner).toContainText('25.00 → 37.00 · +12.00 pts');
    await expect(banner).toContainText('28.00 → 40.00 · +12.00 pts');
    await expect(banner).toContainText('RB 2, WR 1 → RB 1, WR 2');
    await page.getByLabel('Send Home Lead RB', { exact: true }).check();
    await expect(banner).toContainText('Lineup impact awaiting selection / roster capacity');
    await page.getByLabel('Available open roster slots for Sunday Stunners').fill('1');
    await page.getByLabel(/I confirm this roster space/).check();
    await expect(page.getByLabel('Sunday Stunners lineup impact')).toContainText(
      'Active roster: 4',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: testInfo.outputPath(`exchange-${width}.png`), fullPage: true });
  });

  test(`managed Live board retains complete status and player links at ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/ui/?mode=live&managed=1');
    await expect(page.locator('.live-matchup-card')).toHaveCount(4);
    const sidebar = page.getByRole('complementary', { name: 'All league matchups' });
    await expect(sidebar.getByLabel('Managed team')).toHaveCount(4);
    const rosters = page.locator('.decision-explorer-live-roster');
    await expect(rosters).toHaveCount(8);
    const first = rosters.first();
    await expect(first.getByRole('link', { name: 'Player 18', exact: true })).toHaveAttribute(
      'href',
      /playerId/,
    );
    await expect(first.getByText('Bye', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    if (width >= 1440) {
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        height,
      );
      for (const roster of await rosters.all())
        expect(
          await roster.evaluate((node) => node.scrollHeight - node.clientHeight),
        ).toBeLessThanOrEqual(1);
    } else if (width < 768) await expect(first).toHaveCSS('overflow-y', 'visible');
    await page.screenshot({
      path: testInfo.outputPath(`live-${width}.png`),
      fullPage: width < 768,
    });
  });
}

test('a current league deep link pins that managed game and keeps three other league quarters', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=live&managed=1&leagueId=5&year=2026');
  await expect(page.getByRole('combobox', { name: 'League' })).toHaveValue('5');
  await expect(page.locator('.live-matchup-card').first()).toContainText('Home 14 vs Away 14');
  await expect(page.locator('.live-matchup-card')).toHaveCount(4);
});
