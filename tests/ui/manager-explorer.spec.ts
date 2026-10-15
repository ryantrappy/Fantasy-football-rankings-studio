import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1440, 390]) {
  test(`focused rankings and writing preserve independent takes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=workspace-studio');
    await page.getByLabel('Commentary for Fourth & Long').fill('First independent take');
    await page.getByRole('button', { name: 'Sunday Stunners', exact: true }).click();
    const take = page.getByLabel('Commentary for Sunday Stunners');
    await take.fill('Second independent take');
    await page.getByRole('button', { name: 'Writing assistant & edition tools' }).click();
    await page.getByRole('button', { name: 'Inspect roster evidence' }).click();
    await expect(page.getByText('Starter: Current receiver · 18.0 projected')).toBeVisible();
    await expect(
      page.getByText(/Server-managed login is configured by the operator/),
    ).toBeVisible();
    await page.getByLabel('Model (optional)').fill('account-model');
    await page
      .getByRole('checkbox', { name: 'Approve sending team contexts to the selected assistant' })
      .click();
    await page.getByRole('button', { name: 'Generate AI summary', exact: true }).click();
    await page.getByLabel('AI suggestion for Sunday Stunners').fill('Edited suggestion');
    await expect(take).toHaveValue('Second independent take');
    await page.getByRole('button', { name: 'Apply suggestion to take' }).click();
    await expect(take).toHaveValue('Edited suggestion');
    await page.getByRole('button', { name: 'Revoke context-sharing approval' }).click();
    await expect(
      page.getByRole('button', { name: 'Generate AI summary', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Fourth & Long', exact: true }).click();
    await expect(page.getByLabel('Commentary for Fourth & Long')).toHaveValue(
      'First independent take',
    );
    await page.getByRole('button', { name: 'Preview & export', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Live ranking preview' })).toBeVisible();
    await expect(page.locator('.export-comments').first()).toHaveText('First independent take');
    await expect(page.locator('.export-comments').nth(1)).toHaveText('Edited suggestion');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({
      path: `test-results-integration/rankings-focused-${width}.png`,
      fullPage: true,
    });
  });
}

test('seven destinations, contextual tools and account dismissal work with a keyboard', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=workspace-overview');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link')).toHaveText([
    'Rankings studio',
    'Weekly overview',
    'Live matchups',
    'Season insights',
    'Playoff simulator',
    'League history',
    'Other tools',
  ]);
  // Without page context, returning to rankings must allow the account's remembered edition.
  await expect(nav.getByRole('link', { name: 'Rankings studio' })).toHaveAttribute('href', '/');
  const menu = page.getByLabel('Profile menu');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Create league', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('link', { name: 'Create league', exact: true })).toBeHidden();
  await menu.click();
  await page.locator('h1').click();
  await expect(page.getByRole('link', { name: 'Create league', exact: true })).toBeHidden();
  await nav.getByRole('link', { name: 'Other tools' }).click();
  await expect(page.getByRole('heading', { name: 'Other tools', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Players Search rosters/ }).click();
  await expect(nav.getByRole('link', { name: 'Other tools' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Other tools' }),
  ).toBeVisible();
});

test('profile views retain unsaved fields and expose real readiness and cookie controls', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=workspace-profile');
  await page.getByLabel('Nickname', { exact: true }).fill('Unsaved nickname');
  await page.getByRole('button', { name: 'Writing connections', exact: true }).click();
  await expect(page.getByText(/Server Codex login is ready/)).toBeVisible();
  await expect(page.getByLabel('OpenAI API key (Codex)')).toBeVisible();
  await expect(page.getByText(/shares|share the operator’s account and quota/)).toBeVisible();
  await page.getByRole('button', { name: 'ESPN settings', exact: true }).click();
  await expect(page.getByLabel('espn_s2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Profile details', exact: true }).click();
  await expect(page.getByLabel('Nickname', { exact: true })).toHaveValue('Unsaved nickname');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('private History navigation drops a single season context and keeps both bulk season actions', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=workspace-overview');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Season insights' }).click();
  await expect(page.getByRole('heading', { name: 'Who delivers every week?' })).toBeVisible();
  const history = nav.getByRole('link', { name: 'League history' });
  const href = await history.getAttribute('href');
  expect(new URL(href!, 'http://localhost').searchParams.has('years')).toBe(false);
  await history.click();
  await expect(page.getByRole('heading', { name: 'League history' })).toBeVisible();
  await page.getByText('Seasons to compare', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select all seasons', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Select all prior seasons', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Select all seasons', exact: true }).click();
  for (const checkbox of await page
    .getByRole('group', { name: 'Include seasons' })
    .getByRole('checkbox')
    .all())
    await expect(checkbox).toBeChecked();
});
