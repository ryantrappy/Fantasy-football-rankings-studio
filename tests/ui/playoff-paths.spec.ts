import { expect, test, type Page } from '@playwright/test';

const sizes = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const remainingWeeks = [5, 6, 7, 8, 9, 10];
const noOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};
const chancePanel = (page: Page) => page.locator('section.analytics-explorer-forecast');
const parseChances = async (page: Page) => {
  const text = (await chancePanel(page).textContent()) ?? '';
  const current = text.match(/(\d+\.\d)%/)?.[1];
  const base = text.match(/Was (\d+\.\d)%/)?.[1];
  return { current: current ? Number(current) : undefined, base: base ? Number(base) : undefined };
};

for (const size of sizes) {
  test(`path to the playoffs simulator works at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/tests/ui/?mode=playoff-paths');
    await expect(page.getByRole('heading', { name: 'Path to the playoffs' })).toBeVisible();
    // The managed team (Fourth & Long) is the default; the base forecast runs first.
    // The 20,000-simulation worker run takes several seconds in this harness.
    await expect(page.getByLabel('Team', { exact: true })).toHaveValue('1');
    await expect(chancePanel(page)).toContainText(/Projected \d+\.\d wins/, { timeout: 30000 });
    await expect(page.getByText('Nothing is prefilled automatically')).toBeVisible();
    // Nothing is prefilled on load.
    await expect(page.getByText('Picked:')).toHaveCount(0);
    // Remaining games are grouped by week with both teams pickable.
    const remainingGames = page.locator('section', {
      has: page.getByRole('heading', { name: 'Remaining games' }),
    });
    await expect(remainingGames.getByRole('heading', { name: 'Week 5' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pick Fourth & Long to win week 5' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pick Sunday Stunners to win week 5' }),
    ).toBeVisible();
    const gameImpact = page.getByRole('region', { name: 'What matters most' });
    await expect(gameImpact.getByRole('heading', { level: 3 })).toHaveText(
      remainingWeeks.map((week) => `Week ${week}`),
    );
    await expect(gameImpact.getByRole('listitem')).toHaveCount(12);
    const weekFiveImpact = gameImpact.getByRole('list', { name: 'Week 5', exact: true });
    const firstMatchup = weekFiveImpact.getByRole('listitem').first();
    await expect(firstMatchup).toContainText(/If .* wins: \d+\.\d% · If .* wins: \d+\.\d%/);
    const managedTeamImpact = await firstMatchup.textContent();
    await page.getByLabel('Team', { exact: true }).selectOption('2');
    await expect(gameImpact).toContainText(
      'Sunday Stunners · biggest playoff impact first each week',
    );
    expect(await firstMatchup.textContent()).not.toBe(managedTeamImpact);
    await page.getByLabel('Team', { exact: true }).selectOption('1');
    await noOverflow(page);

    // Prefill fills every remaining game from projections: week 5 has Sunday
    // Stunners over Fourth & Long and the Underdogs over End Zone Experts.
    await page.getByRole('button', { name: 'Prefill from projections' }).click();
    await expect(page.getByText('Picked: Sunday Stunners').first()).toBeVisible();
    await expect(
      page.getByText('Picked: The Underdogs with a very long team name').first(),
    ).toBeVisible();
    await expect(chancePanel(page)).toContainText(/Was \d+\.\d% with no picks/, { timeout: 30000 });
    await expect(gameImpact).toContainText('Every remaining game is picked');
    await noOverflow(page);

    // Clear restores the base forecast.
    await page.getByRole('button', { name: 'Clear picks' }).click();
    await expect(page.getByText('Picked:')).toHaveCount(0);
    await expect(chancePanel(page)).not.toContainText('with no picks');
    await expect(weekFiveImpact.getByRole('listitem')).toHaveCount(2);

    // Picking the managed team to win all of its remaining games raises its chance.
    const before = await parseChances(page);
    expect(before.current).toBeDefined();
    for (const week of remainingWeeks) {
      await page.getByRole('button', { name: `Pick Fourth & Long to win week ${week}` }).click();
    }
    await expect(chancePanel(page)).toContainText(/Was \d+\.\d% with no picks/, { timeout: 30000 });
    await expect(weekFiveImpact.getByRole('listitem')).toHaveCount(1);
    await expect(weekFiveImpact).not.toContainText('Fourth & Long');
    const after = await parseChances(page);
    expect(after.current).toBeDefined();
    expect(after.base).toBe(before.current);
    expect(after.current!).toBeGreaterThan(after.base!);
    await noOverflow(page);
  });
}
