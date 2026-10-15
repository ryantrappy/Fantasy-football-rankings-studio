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
  await page
    .getByRole('combobox', { name: 'Explore a manager', exact: true })
    .selectOption('manager-1');
  await page.locator('.history-season-picker > summary').click();
  await page.getByRole('checkbox', { name: '2024', exact: true }).uncheck();
  await expect(page.locator('.history-explorer-profile')).toContainText('1 of 1 selected seasons');
  await expect(page.getByRole('heading', { name: 'Blair', exact: true })).toBeVisible();
  await page.locator('.history-season-picker > summary').click();
  await page.getByRole('tab', { name: 'Season history', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Manager season results' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Manager season history' })).not.toBeVisible();
  await page.getByText('Detailed season metrics', { exact: true }).click();
  await expect(page.getByRole('table', { name: 'Manager season history' })).toBeVisible();
  await page.getByRole('button', { name: 'Compare managers', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Manager comparison', exact: true })).toBeFocused();
  await page.locator('.history-explorer-library > summary').click();
  await page.locator('.history-explorer-library > summary').click();
  await page.getByRole('button', { name: /League overview/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Who keeps making the right moves?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Manager comparison/ }).click();
  await expect(page.getByRole('heading', { name: 'Compare two managers' })).toBeVisible();
  await noOverflow(page);
});

test('History shares focused year, retains all-season evidence and provides accessible definitions', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/tests/ui/?mode=history');
  await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
  await page.getByRole('combobox', { name: 'Schedule season', exact: true }).selectOption('2025');
  await page.getByRole('button', { name: 'Expected wins method', exact: true }).focus();
  await expect(page.getByRole('tooltip')).toContainText('all-play scoring percentiles');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Matchup stories', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Moments season', exact: true })).toHaveValue(
    '2025',
  );
  await page.getByRole('tab', { name: 'Manager profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Wrapped', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Wrapped season', exact: true })).toHaveValue(
    '2025',
  );
  await page.getByRole('combobox', { name: 'Recap scope', exact: true }).selectOption('league');
  await expect(page.getByRole('article', { name: 'Wrapped share preview' })).toContainText(
    'league',
  );
  await page.getByRole('combobox', { name: 'Wrapped season', exact: true }).selectOption('2024');
  await page.getByRole('tab', { name: 'Competition', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Schedule season', exact: true })).toHaveValue(
    '2024',
  );
  await expect(page.locator('.history-explorer-stats')).toContainText('8–0–0');
  await page.getByRole('button', { name: 'Rivalries', exact: true }).click();
  await noOverflow(page);
  await expect(page.locator('.history-explorer-stats dt').first()).toHaveCSS(
    'text-transform',
    'none',
  );
  await expect(page.locator('.history-explorer-subnav').first()).toHaveCSS('padding-top', '12px');
  await page.screenshot({ path: testInfo.outputPath('history-1440.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'Manager profiles', exact: true }).click();
  await page.getByRole('combobox', { name: 'Recap scope', exact: true }).selectOption('personal');
  await expect(
    page.getByRole('heading', { name: "Alex's 2024 Fantasy Wrapped", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('history-wrapped-390.png'), fullPage: true });
  const accessibility = await new AxeBuilder({ page }).include('.history-explorer').analyze();
  expect(accessibility.violations).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 2048, height: 942 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`History real default evidence and Wrapped fit ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/tests/ui/?mode=history');
    await expect(page.getByRole('complementary', { name: 'Selected rivalry' })).toContainText(
      '8 verified meetings',
    );
    await noOverflow(page);
    await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Record evidence' })).toContainText(
      'actual wins against',
    );
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`history-evidence-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole('tab', { name: 'Manager profiles', exact: true }).click();
    await page.getByRole('button', { name: 'Wrapped', exact: true }).click();
    await expect(page.locator('.history-wrapped-story')).toHaveCount(4);
    await expect(page.getByRole('article', { name: 'Wrapped share preview' })).toHaveCSS(
      'background-color',
      'rgb(23, 34, 59)',
    );
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`history-wrapped-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole('combobox', { name: 'Recap scope', exact: true }).selectOption('league');
    await expect(page.locator('.history-wrapped-story')).toHaveCount(4);
    await noOverflow(page);
    const accessibility = await new AxeBuilder({ page }).include('.history-explorer').analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test('Wrapped publishes the exact consented scope and exposes actual revocation controls', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=history&owner=true');
  await page.getByRole('tab', { name: 'Manager profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Wrapped', exact: true }).click();
  const publish = page.getByRole('button', { name: 'Create public Wrapped snapshot', exact: true });
  const consent = page.getByRole('checkbox', {
    name: 'Publish this preview to anyone with its link',
  });
  await expect(publish).toBeDisabled();
  await consent.check();
  await publish.click();
  await expect(page.getByRole('textbox', { name: 'Wrapped share link' })).toHaveValue(
    /personal-2024$/,
  );
  const personal = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('history-preview-snapshot')!),
  );
  expect(personal.records).toEqual([]);
  expect(personal.activeManagerKeys).toEqual([]);
  expect(personal.wrapped.scope).toBe('personal');
  await page.getByRole('combobox', { name: 'Recap scope', exact: true }).selectOption('league');
  await expect(consent).not.toBeChecked();
  await expect(publish).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Wrapped share link' })).toHaveCount(0);
  await consent.check();
  await publish.click();
  await expect(page.getByRole('textbox', { name: 'Wrapped share link' })).toHaveValue(
    /league-2024$/,
  );
  await page.getByRole('button', { name: 'Disable public reports', exact: true }).click();
  await expect(
    page.getByText('Public season and history reports are disabled.', { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('history-preview-sharing'))).toBe(
    'disabled',
  );
});

test('history archive JSON and season metrics CSV downloads retain real source data', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=history');
  await page.getByRole('tab', { name: 'Matchup stories', exact: true }).click();
  await page.getByRole('button', { name: 'Archive tools', exact: true }).click();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive', exact: true }).click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toBe('preview-2024-archive.json');
  const jsonStream = await json.createReadStream();
  const chunks = [];
  for await (const chunk of jsonStream!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        source: 'Demonstration archive',
        week: 1,
        teamId: '1',
        snapshots: expect.any(Array),
      }),
    ]),
  );
  await page.goto('/tests/ui/?mode=history-page');
  await page.getByRole('tab', { name: 'Season history', exact: true }).click();
  await page.getByRole('button', { name: 'Detailed season metrics', exact: true }).click();
  const csvDownload = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download Manager season history CSV', exact: true })
    .click();
  const csv = await csvDownload;
  const csvStream = await csv.createReadStream();
  const csvChunks = [];
  for await (const chunk of csvStream!) csvChunks.push(chunk);
  const text = Buffer.concat(csvChunks).toString();
  expect(text).toContain('Alex');
  expect(text).toContain('2025');
  expect(text).toContain('Regular-season placement');
  expect(text).toContain('Final placement');
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
]) {
  test(`compact history toolbar exposes the first rivalry at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/tests/ui/?mode=history-page');
    const table = page.getByRole('table', { name: 'All-time head-to-head', exact: true });
    await expect(table).toBeVisible();
    for (const name of ['Search opponents', 'Minimum rivalry games'])
      await expect(
        page.getByRole(name === 'Search opponents' ? 'searchbox' : 'spinbutton', {
          name,
          exact: true,
        }),
      ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Download All-time head-to-head CSV', exact: true }),
    ).toBeVisible();
    const firstRow = await table.getByRole('row').nth(1).boundingBox();
    expect(firstRow!.y + firstRow!.height).toBeLessThanOrEqual(viewport.height);
    const inspector = page.getByRole('complementary', { name: 'Selected rivalry' });
    expect((await inspector.boundingBox())!.width).toBe(340);
    await expect(inspector.getByRole('button', { name: /Closest rival.*Blair/ })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Include former managers', exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`history-compact-toolbar-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test('matchup heatmap keyboard inspection preserves directional evidence and the focused season', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/ui/?mode=history-page');
  await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
  await page.getByRole('combobox', { name: 'Schedule season', exact: true }).selectOption('2024');
  await page.getByRole('button', { name: 'Rivalries', exact: true }).click();
  await page.getByRole('button', { name: 'Matchup heatmap', exact: true }).click();
  const table = page.getByRole('table', { name: 'All-manager matchup heatmap', exact: true });
  const positive = table.getByRole('button', {
    name: /Inspect Alex versus Blair: 8-0-0, 8 games, 100%/,
  });
  await expect(positive).toHaveClass(/history-heatmap-win/);
  await expect(
    table.getByRole('button', { name: /Inspect Blair versus Alex: 0-8-0, 8 games, 0%/ }),
  ).toHaveClass(/history-heatmap-loss/);
  await expect(
    table.getByRole('button', { name: 'Inspect Alex versus Casey: no verified games' }),
  ).toHaveClass(/history-heatmap-unavailable/);
  await expect(table.getByText('Same manager', { exact: true })).toHaveCount(4);
  await positive.focus();
  await page.keyboard.press('ArrowDown');
  await expect(
    table.getByRole('button', { name: 'Inspect Casey versus Blair: no verified games' }),
  ).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  const reverse = table.getByRole('button', { name: /Inspect Blair versus Alex: 0-8-0/ });
  await expect(reverse).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(reverse).toBeFocused();
  await expect(reverse).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Blair', exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Selected rivalry' })).toContainText(
    'Blair vs. Alex',
  );
  await page.getByRole('button', { name: 'League matrix', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'League rivalry matrix', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Matchup heatmap', exact: true }).click();
  await expect(reverse).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Schedule & luck', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Schedule season', exact: true })).toHaveValue(
    '2024',
  );
});

test('heatmap and original filtered rivalry CSVs retain exact values, missing states and report context', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=history-page');
  await page.getByRole('button', { name: 'Matchup heatmap', exact: true }).click();
  const table = page.getByRole('table', { name: 'All-manager matchup heatmap', exact: true });
  await table.getByRole('button', { name: /Row manager \/ opponent/ }).click();
  const heatmapDownload = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download All-manager matchup heatmap CSV', exact: true })
    .click();
  const heatmap = await heatmapDownload;
  const stream = await heatmap.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString();
  expect(text).toContain('Selected seasons');
  expect(text).toContain('Selected seasons,"2025, 2024"');
  expect(text).toContain('8-0-0; 8 games; 100%');
  expect(text).toContain('0-8-0; 8 games; 0%');
  expect(text).toContain('Not applicable: same manager');
  expect(text).toContain('Unavailable; 0 verified games');
  expect(text.indexOf('\r\nDevon,')).toBeLessThan(text.indexOf('\r\nAlex,'));
  expect(text).not.toContain('manager-0');
  await page.getByRole('button', { name: 'Opponent records', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search opponents', exact: true }).fill('Blair');
  const originalDownload = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download All-time head-to-head CSV', exact: true })
    .click();
  const original = await originalDownload;
  const originalStream = await original.createReadStream();
  const originalChunks = [];
  for await (const chunk of originalStream!) originalChunks.push(chunk);
  const originalText = Buffer.concat(originalChunks).toString();
  expect(originalText).toContain('Blair,8-0-0,8');
  expect(originalText).not.toContain('\r\nCasey,');
  expect(originalText).not.toContain('\r\nDevon,');
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 2048, height: 942 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`matchup heatmap keeps all identities and local scrolling at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/tests/ui/?mode=history-page');
    await page.getByRole('button', { name: 'Matchup heatmap', exact: true }).click();
    const table = page.getByRole('table', { name: 'All-manager matchup heatmap', exact: true });
    await expect(table.getByRole('rowheader')).toHaveCount(4);
    const pair = table.getByRole('button', { name: /Inspect Blair versus Alex: 0-8-0/ });
    await pair.focus();
    await page.keyboard.press('Enter');
    await expect(pair).toBeFocused();
    await expect(page.getByRole('complementary', { name: 'Selected rivalry' })).toContainText(
      'Blair vs. Alex',
    );
    const scroll = page.getByRole('region', { name: 'Scrollable matchup heatmap', exact: true });
    await scroll.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    if (viewport.width <= 390) {
      expect(
        await scroll.evaluate(
          (element) => element.scrollWidth > element.clientWidth && element.scrollLeft > 0,
        ),
      ).toBe(true);
      const rowHeader = table.getByRole('rowheader', { name: 'Blair', exact: true });
      await expect(rowHeader).toHaveCSS('position', 'sticky');
      expect((await rowHeader.boundingBox())!.x).toBeGreaterThanOrEqual(
        (await scroll.boundingBox())!.x - 1,
      );
    }
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`history-matchup-heatmap-${viewport.width}.png`),
      fullPage: true,
    });
    const accessibility = await new AxeBuilder({ page }).include('.history-explorer').analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
