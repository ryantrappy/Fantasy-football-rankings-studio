import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1440, 390]) {
  test(`profile saves and clears personal writing instructions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=workspace-profile');
    await page.getByRole('button', { name: 'Writing connections', exact: true }).click();
    const input = page.getByLabel('Writing instructions', { exact: true });
    const save = page.getByRole('button', { name: 'Save writing instructions', exact: true });
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('maxlength', '20000');
    await expect(save).toBeDisabled();
    await expect(page.getByText(/Save your writing style for this account only/)).toBeVisible();
    const instructions =
      '# My Power Rankings voice\n' +
      'Use specific league facts, personal banter, and self-roasts.\n'.repeat(120);
    await input.fill(instructions);
    await expect(page.getByText('Unsaved writing instructions.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Profile details', exact: true }).click();
    await page.getByRole('button', { name: 'Writing connections', exact: true }).click();
    await expect(input).toHaveValue(instructions);
    await save.click();
    await expect(page.getByText('Writing instructions saved.', { exact: true })).toBeVisible();
    await expect(save).toBeDisabled();
    await page.getByRole('button', { name: 'Clear writing instructions', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(page.getByText('Writing instructions saved.', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
