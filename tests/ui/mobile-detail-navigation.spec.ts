import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768]) {
  test(`ranking mobile detail round trip retains draft, order and selected focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const name = 'Fourth & Long: The Unreasonably Long Championship Contenders';
    await page.route(/\/tests\/ui\/fixture\.ts(?:\?|$)/, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replaceAll('Fourth & Long', name),
      });
    });
    await page.goto('/tests/ui/?mode=workspace-studio');
    const edit = page.getByRole('button', { name: `Edit take for ${name}`, exact: true });
    await edit.click();
    const detail = page.getByRole('complementary', { name: 'Selected team take' });
    await expect(detail).toBeFocused();
    const take = detail.getByLabel(`Commentary for ${name}`);
    await take.fill('A complete mobile take retained through navigation.');
    await detail.getByRole('button', { name: 'Return to team list' }).click();
    const selected = page.getByRole('button', { name, exact: true });
    await expect(selected).toBeFocused();
    await page.getByRole('button', { name: `Move ${name} down`, exact: true }).click();
    await edit.click();
    await expect(take).toHaveValue('A complete mobile take retained through navigation.');
    await expect(detail).toContainText('Writing for rank 2');
    await detail.getByRole('button', { name: 'Return to team list' }).click();
    await expect(selected).toBeFocused();
    const identity = selected.locator('..');
    expect((await identity.boundingBox())!.width).toBeGreaterThan(width * 0.5);
    const controls = identity.locator('..').locator('.reorder-controls');
    await expect(selected.locator('strong')).toHaveCSS('overflow-wrap', 'anywhere');
    expect((await controls.boundingBox())!.y).toBeGreaterThan((await identity.boundingBox())!.y);
  });
}

test('season detail round trip retains team, active view, table scroll and page position', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=analytics');
  await page
    .getByRole('table', { name: 'Team scoring', exact: true })
    .getByRole('button', { name: 'End Zone Experts', exact: true })
    .click();
  await page.getByRole('button', { name: 'Weekly trends', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'View selected team details', exact: true });
  await trigger.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await trigger.click();
  const detail = page.getByRole('complementary', { name: 'Selected team inspector' });
  await expect(detail).toBeFocused();
  await expect(detail).toContainText('End Zone Experts');
  await detail.getByRole('button', { name: 'Return to season view' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('button', { name: 'Weekly trends', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(before, 0);
  const table = page.getByRole('table', { name: 'Weekly scores', exact: true });
  const viewport = table.locator('..');
  if (await viewport.evaluate((el) => el.scrollWidth > el.clientWidth + 1)) {
    await expect(viewport.getByText('Scroll horizontally to see all columns')).toBeVisible();
    await viewport.evaluate((el) => {
      el.scrollLeft = 70;
    });
    const scroll = await viewport.evaluate((el) => el.scrollLeft);
    await trigger.click();
    await detail.getByRole('button', { name: 'Return to season view' }).click();
    expect(await viewport.evaluate((el) => el.scrollLeft)).toBe(scroll);
  }
});

test('playoff inline details retain display mode, selected team and cutoff', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=playoffs');
  const trigger = page.getByRole('button', { name: 'View selected team details', exact: true });
  await expect(trigger).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Histogram mode', exact: true }).click();
  await page.getByLabel('Forecast through week').selectOption('2');
  await trigger.click();
  const detail = page.getByRole('complementary', { name: 'Selected team path' });
  await expect(detail).toBeFocused();
  await detail.getByLabel('Inspect playoff team').selectOption({ index: 2 });
  const team = await detail.getByRole('heading').innerText();
  await detail.getByRole('button', { name: 'Return to forecast view' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('button', { name: 'Histogram mode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Forecast through week')).toHaveValue('2');
  await trigger.click();
  await expect(detail.getByRole('heading')).toHaveText(team);
});

test('overflow cues follow actual table width and retain sticky identity and numeric alignment', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/ui/?mode=analytics');
  const table = page.getByRole('table', { name: 'Team scoring', exact: true });
  const viewport = table.locator('..');
  const cue = viewport.getByText('Scroll horizontally to see all columns');
  const headers = await table.locator('thead th').allTextContents();
  await expect(cue).toBeVisible();
  await expect(table.locator('tbody th').first()).toHaveCSS('position', 'sticky');
  await expect(table.locator('td.table-numeric').first()).toHaveCSS('text-align', 'right');
  const identityLeft = (await table.locator('tbody th').first().boundingBox())!.x;
  await viewport.evaluate((el) => {
    el.scrollLeft = 140;
  });
  expect((await table.locator('tbody th').first().boundingBox())!.x).toBeCloseTo(identityLeft, 0);
  await expect(cue).toBeVisible();
  await page.setViewportSize({ width: 2048, height: 942 });
  await expect(cue).toHaveCount(0);
  expect(await table.locator('thead th').allTextContents()).toEqual(headers);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`forecast assumptions retain inline state with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/tests/ui/?mode=playoffs');
    const trigger = page.getByRole('button', {
      name: 'Forecast assumptions and projection coverage',
      exact: true,
    });
    await expect(trigger).toBeVisible({ timeout: 30000 });
    const content = page.locator('.forecast-method > div');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await trigger.click();
    await expect(content).toBeVisible();
    await expect(content).toContainText('All percentages are unconditional chances');
    // Unlike menus, this inline evidence stays open when another report control is used.
    await page.getByRole('button', { name: 'Histogram mode', exact: true }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await content.locator('summary').click();
    const coverage = content.getByRole('table', { name: 'Weekly lineup projection coverage' });
    await expect(coverage).toBeVisible();
    const text = await content.textContent();
    await trigger.click();
    await expect(content).toHaveAttribute('inert', '');
    await expect(content).toHaveAttribute('aria-hidden', 'true');
    if (reducedMotion === 'reduce') await expect(content).toBeHidden();
    await trigger.click();
    await expect(content).not.toHaveAttribute('inert');
    await expect(content).toHaveText(text!);
    await expect(coverage).toBeVisible();
    await expect(page.getByRole('button', { name: 'Histogram mode', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`ranking, season and Live remain contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ['workspace-studio', 'analytics', 'live&managed=1']) {
      await page.goto(`/tests/ui/?mode=${mode}`);
      const heading =
        mode === 'workspace-studio'
          ? page.getByRole('complementary', { name: 'Selected team take' })
          : page.getByRole('heading', {
              name: mode === 'analytics' ? 'Season insights' : 'Live matchups',
              exact: true,
            });
      await expect(heading).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      if (mode === 'workspace-studio') {
        const detail = page.getByRole('complementary', { name: 'Selected team take' });
        await expect(detail.getByLabel('Commentary for Fourth & Long')).toBeVisible();
      } else if (mode === 'analytics') {
        const table = page.getByRole('table', { name: 'Team scoring', exact: true });
        await expect(table).toBeVisible();
        expect(await table.locator('thead th').count()).toBeGreaterThan(5);
      } else {
        const league = page.getByRole('combobox', { name: 'League', exact: true });
        await expect(league).toBeVisible();
        const box = (await league.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        const toolbar = (await page.locator('.workspace-toolbar').boundingBox())!;
        const nav = (await page
          .getByRole('navigation', { name: 'Main navigation' })
          .boundingBox())!;
        expect(nav.y + nav.height).toBeLessThanOrEqual(toolbar.y + toolbar.height + 1);
      }
    }
  });
}

test('200 percent zoom equivalent reflows ranking, season and Live without losing controls', async ({
  browser,
  baseURL,
}) => {
  // Browser page zoom halves the CSS viewport. This models a 1280x900 display at 200%
  // using 640x450 CSS pixels and DPR 2; it does not manipulate Chrome toolbar zoom.
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 640, height: 450 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  try {
    await page.goto('/tests/ui/?mode=workspace-studio');
    const detail = page.getByRole('complementary', { name: 'Selected team take' });
    await page.getByRole('button', { name: 'Edit take for Fourth & Long', exact: true }).click();
    await expect(detail).toBeFocused();
    await detail.getByLabel('Commentary for Fourth & Long').fill('Retained at enlarged text scale');
    await detail.getByRole('button', { name: 'Return to team list' }).click();
    await expect(page.getByRole('button', { name: 'Fourth & Long', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Edit take for Fourth & Long', exact: true }).click();
    await expect(detail.getByLabel('Commentary for Fourth & Long')).toHaveValue(
      'Retained at enlarged text scale',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      640,
    );
    await page.goto('/tests/ui/?mode=analytics');
    const trigger = page.getByRole('button', { name: 'View selected team details', exact: true });
    await trigger.click();
    const inspector = page.getByRole('complementary', { name: 'Selected team inspector' });
    await expect(inspector).toBeFocused();
    await inspector.getByRole('button', { name: 'Return to season view' }).click();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      640,
    );
    await page.goto('/tests/ui/?mode=live&managed=1');
    await expect(page.getByRole('combobox', { name: 'League', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live matchups', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      640,
    );
  } finally {
    await context.close();
  }
});
