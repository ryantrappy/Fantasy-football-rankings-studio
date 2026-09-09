import { expect, test } from '@playwright/test';

test('preview headers sort without changing ranks or trend values', async ({ page }) => {
  await page.goto('/tests/ui/');
  await page.getByRole('button', { name: 'Preview & export' }).click();
  const table = page.getByRole('table', { name: 'Weekly rankings' });
  await table.getByRole('button', { name: 'Team / Record' }).click();
  await expect(table.locator('.export-team-name').first()).toHaveText('End Zone Experts');
  await expect(table.locator('.export-rank-circle').first()).toHaveText('3');
  await expect(table.locator('.export-movement').first()).toHaveAttribute(
    'aria-label',
    'No change',
  );
  await table.getByRole('button', { name: 'Rank', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(table.locator('.export-team-name').first()).toHaveText('Fourth & Long');
  await expect(table.getByRole('columnheader', { name: 'Rank', exact: true })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
});

test('every preview header toggles sorting across the full header cell', async ({ page }) => {
  await page.goto('/tests/ui/');
  await page.getByRole('button', { name: 'Preview & export' }).click();
  const table = page.getByRole('table', { name: 'Weekly rankings' });
  for (const header of await table.getByRole('columnheader').all()) {
    await expect(header.getByRole('button')).toBeVisible();
    const initial = await header.getAttribute('aria-sort');
    await header.click({ position: { x: 2, y: 2 } });
    await expect(header).toHaveAttribute(
      'aria-sort',
      initial === 'ascending' ? 'descending' : 'ascending',
    );
    await header.click({ position: { x: 2, y: 2 } });
    await expect(header).toHaveAttribute(
      'aria-sort',
      initial === 'ascending' ? 'ascending' : 'descending',
    );
  }
});
