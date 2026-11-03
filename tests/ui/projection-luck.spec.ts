import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 320, height: 568 },
]) {
  test(`projection luck preserves filtered evidence and local table scrolling at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/tests/ui/?mode=analytics&projection-luck=1');
    await page.getByRole('table', { name: 'Team scoring', exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'Team', exact: true }).selectOption('1');
    await page.getByRole('button', { name: 'Projection luck', exact: true }).click();
    const teamTable = page.getByRole('table', { name: 'Projection luck by team', exact: true });
    await expect(teamTable.locator('tbody tr')).toHaveCount(1);
    await expect(teamTable).toContainText('Fourth & Long');
    await expect(
      page.getByText('Historical provider projections were retrieved after the week', {
        exact: false,
      }),
    ).toBeVisible();
    await page.getByRole('combobox', { name: 'Projection luck week' }).selectOption('3');
    const matchups = page.getByRole('table', { name: 'Projection matchup replays' });
    await expect(matchups.locator('tbody tr')).toHaveCount(1);
    await expect(matchups).toContainText('100 replays');
    const players = page.getByRole('table', { name: 'Player projection variance' });
    await expect(players.locator('tbody tr')).toHaveCount(6);
    await expect(players).toContainText('Breece Hall');
    await page.getByRole('button', { name: 'Weekly trends', exact: true }).click();
    await page.getByRole('button', { name: 'Projection luck', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Projection luck week' })).toHaveValue('3');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Player projection variance CSV' }).click();
    expect((await downloadPromise).suggestedFilename()).toContain('2026-projection-luck-1-3');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (viewport.width === 320) {
      const container = players.locator('..');
      expect(await container.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true,
      );
      await container.evaluate((element) => {
        element.scrollLeft = 100;
      });
      expect(await container.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`projection-luck-${viewport.width}.png`),
      fullPage: true,
    });
  });
}
