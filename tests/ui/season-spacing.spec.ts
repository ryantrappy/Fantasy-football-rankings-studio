import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`season insight cards have consistent spacing at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=season-summary');

    const cards = page.locator('.insight-cards article');
    await expect(cards).toHaveCount(3);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const cardGap =
      width < 768 ? second!.y - (first!.y + first!.height) : second!.x - (first!.x + first!.width);
    expect(cardGap).toBeGreaterThanOrEqual(20);

    const luck = await page.locator('.panel:has(h3:text-is("Schedule luck index"))').boundingBox();
    const scorecard = await page
      .locator('.panel:has(h3:text-is("Manager scorecard"))')
      .boundingBox();
    expect(luck).not.toBeNull();
    expect(scorecard).not.toBeNull();
    expect(scorecard!.y - (luck!.y + luck!.height)).toBeGreaterThanOrEqual(20);
    await page.screenshot({
      path: testInfo.outputPath(`season-spacing-${width}.png`),
      fullPage: true,
    });
  });
}

for (const width of [390, 1440]) {
  test(`focused analytics retain scoring evidence and controls at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=analytics');
    const scoring = page.getByRole('table', { name: 'Team scoring' });
    await expect(scoring).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(1);
    await page.screenshot({ path: `test-results/analytics-default-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Weekly trends', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Weekly trends', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const weekly = page.getByRole('table', { name: 'Weekly scores' });
    await expect(weekly.locator('tbody tr')).toHaveCount(16);
    for (const name of [
      'Actual points',
      'Projected points',
      'Difference',
      'Best lineup',
      'Missed points',
      'Start accuracy',
    ])
      await expect(weekly.getByRole('columnheader', { name, exact: true })).toBeVisible();
    await expect(page.getByText(/Historical lineup coverage: 12 of 16/)).toBeVisible();
    await page.getByLabel('Team', { exact: true }).selectOption('1');
    await expect(weekly.locator('tbody tr')).toHaveCount(4);
    await expect(weekly.locator('tbody tr').first()).toContainText('83.33% (5 / 6)');
    await expect(weekly.locator('tbody tr').last()).toContainText('—');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Weekly scores CSV' }).click();
    const download = await downloaded;
    const { readFile } = await import('node:fs/promises');
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain('Analytics test league');
    expect(csv).toContain(
      'Actual points,Projected points,Difference,Best lineup,Missed points,Start accuracy,Coverage',
    );
    expect(csv).toContain('Unavailable');
    expect(csv).toContain('83.33% (5 / 6)');
    expect(csv).toContain('Projection unavailable; Legal lineup unavailable');
    expect(csv).toContain('Projection available; Legal lineup: 6 slots');
    expect(csv).not.toContain('Sunday Stunners');
    await page.screenshot({ path: `test-results/analytics-weekly-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Roster strength', exact: true }).click();
    await expect(page.getByRole('table', { name: 'Position group rankings' })).toBeVisible();
    await page.getByRole('button', { name: 'Projected remaining weeks' }).click();
    await page.getByLabel('Sort roster charts by').selectOption('WR');
    await expect(page.locator('.season-strength svg rect').first()).toBeVisible();
    await page.screenshot({ path: `test-results/analytics-roster-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Remaining schedule', exact: true }).click();
    await expect(page.getByLabel('Weekly opponents for')).toHaveValue('1');
    await expect(
      page.getByRole('table', { name: 'Fourth & Long remaining opponents' }).locator('tbody tr'),
    ).toHaveCount(6);
    await page.getByLabel('Weekly opponents for').selectOption('2');
    await expect(
      page.getByRole('table', { name: 'Sunday Stunners remaining opponents' }),
    ).toBeVisible();
    await page.screenshot({ path: `test-results/analytics-schedule-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Roster strength', exact: true }).click();
    await expect(page.getByLabel('Sort roster charts by')).toHaveValue('WR');
    await page.getByRole('button', { name: 'Manager report card', exact: true }).click();
    const scorecard = page.getByRole('table', { name: 'Manager scorecard' });
    await expect(scorecard.locator('tbody tr')).toHaveCount(3);
    await page.getByLabel('Include former managers in summary').check();
    await expect(scorecard.locator('tbody tr')).toHaveCount(4);
    await expect(page.getByRole('table', { name: 'Schedule luck' })).toBeVisible();
    await page.screenshot({ path: `test-results/analytics-managers-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Trades', exact: true }).click();
    await expect(page.getByRole('table', { name: 'Trade comparison' })).toBeVisible();
    await expect(page.getByText('Insufficient comparable data', { exact: true })).toBeVisible();
    await page.screenshot({ path: `test-results/analytics-trades-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Pickups', exact: true }).click();
    await expect(page.getByLabel('Filter pickups by team')).toHaveValue('2');
    await page.getByLabel('Filter pickups by team').selectOption('1');
    await expect(page.getByRole('table', { name: 'Free-agent pickups' })).toContainText(
      'Jayden Reed',
    );
    await page.screenshot({ path: `test-results/analytics-pickups-${width}.png`, fullPage: true });
    for (const view of [
      'Team scoring',
      'Weekly trends',
      'Roster strength',
      'Remaining schedule',
      'Manager report card',
      'Trades',
      'Pickups',
    ]) {
      await page.getByRole('button', { name: view, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      const accessibility = await new AxeBuilder({ page })
        .include('.analytics-explorer')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(accessibility.violations, view).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}
