import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1280, 390]) {
  test(`trade selection and roster layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=trade');
    const one = page.getByRole('region', { name: 'Trade team 1' });
    const two = page.getByRole('region', { name: 'Trade team 2' });
    await expect(page.getByLabel('Send Home Quarterback', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByLabel(/Drop/)).toHaveCount(0);
    await one.getByLabel('Find a player').fill('QB');
    await page.getByLabel('Send Home Quarterback', { exact: true }).check();
    await two.getByLabel('Find a player').fill('QB');
    await page.getByLabel('Send Away Quarterback', { exact: true }).check();
    await expect(page.getByLabel('Fourth & Long lineup impact')).toContainText('+0.00');
    await one.getByLabel('Find a player').fill('WR');
    await expect(
      page.getByRole('button', { name: 'Remove Home Quarterback from trade' }),
    ).toBeVisible();
    await page.getByLabel('Send Home Wide Receiver', { exact: true }).check();
    await page.getByLabel('Available open roster slots for Sunday Stunners').fill('1');
    await page.getByLabel(/I confirm this roster space/).check();
    await expect(page.getByLabel('Sunday Stunners lineup impact')).toContainText(
      'Active roster: 13',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const bounds = await Promise.all([one.boundingBox(), two.boundingBox()]);
    if (width > 768) expect(bounds[0]!.y).toBe(bounds[1]!.y);
    else expect(bounds[1]!.y).toBeGreaterThan(bounds[0]!.y + bounds[0]!.height);
    await page.screenshot({ path: `test-results/trade-${width}.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).include('#root').analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('button', { name: 'Clear trade' }).click();
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Remove Home Quarterback from trade' }),
    ).toHaveCount(0);
  });
}

for (const width of [1280, 390]) {
  test(`trade discovery, inspection and scope clearing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=trade-suggestions');
    const first = page.getByRole('article', { name: 'Suggestion 1 with Sunday Stunners' });
    await expect(first).toBeVisible();
    await expect(first).toContainText('Send Home Depth RB · Receive Away Depth WR');
    await expect(first).toContainText('Fourth & Long: +12.00');
    await expect(first).toContainText('Sunday Stunners: +12.00');
    await expect(first).toContainText('Position coverage before: RB 2 · WR 1');
    await first.getByRole('button', { name: 'Inspect trade with Sunday Stunners' }).click();
    await expect(page.getByRole('heading', { name: 'Build your trade' })).toBeFocused();
    await expect(page.getByLabel('Send Home Depth RB', { exact: true })).toBeChecked();
    await expect(page.getByLabel('Send Away Depth WR', { exact: true })).toBeChecked();
    await expect(page.getByLabel('Fourth & Long lineup impact')).toContainText(
      'Before: 25.00 → After: 37.00',
    );
    const sources = page.getByText('Suggestion sources, coverage and eligibility limits', {
      exact: true,
    });
    await sources.click();
    await expect(
      page.getByText('Reported trade deadline: Week 10.', { exact: false }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: `test-results/trade-suggestions-${width}.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).include('#root').analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole('button', { name: 'Change my team' }).click();
    await page.getByLabel('My managed team').selectOption('2');
    await page.getByRole('button', { name: 'Save my team' }).click();
    await expect(
      page.getByRole('heading', { name: 'Suggested trades for Sunday Stunners' }),
    ).toBeVisible();
    await expect(page.getByLabel('Send Home Depth RB', { exact: true })).not.toBeChecked();
    await page.getByLabel('Trade season').selectOption('2025');
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByText(/unavailable for the selected season/)).toBeVisible();
    await page.getByLabel('Trade season').selectOption('2026');
    await expect(
      page.getByRole('article', { name: 'Suggestion 1 with Sunday Stunners' }),
    ).toBeVisible();
    await expect(page.getByLabel('Send Home Depth RB', { exact: true })).not.toBeChecked();
  });
}
