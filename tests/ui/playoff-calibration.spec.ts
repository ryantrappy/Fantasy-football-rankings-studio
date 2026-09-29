import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`historical playoff calibration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/tests/ui/?mode=calibration');
    await expect(page.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
    await page.getByRole('button', { name: 'Run historical calibration' }).click();
    await expect(page.getByText('Backtest complete.')).toBeVisible();
    await expect(page.getByRole('img', { name: /Brier score by completed week/ })).toBeVisible();
    await expect(
      page.getByRole('table', { name: 'Weekly playoff forecast accuracy' }).locator('tbody tr'),
    ).toHaveCount(9);
    await expect(
      page.getByRole('table', { name: 'Playoff accuracy by season' }).locator('tbody tr'),
    ).toHaveCount(2);
    await expect(
      page.getByRole('heading', { name: 'Final-week seeding rules check' }),
    ).toBeVisible();
    await page.getByLabel('Calibration through week').selectOption('2');
    await expect(page.getByText(/Week 2: predicted probability/)).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export calibration JSON' }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('playoff-calibration-fixture-2026.json');
    const artifact = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(artifact.artifactType).toBe('fantasy-playoff-calibration');
    expect(artifact.schemaVersion).toBe(2);
    expect(artifact.seasonMetrics).toHaveLength(2);
    expect(artifact.finalWeekRulesChecks).toHaveLength(1);
    expect(
      artifact.observations.every(
        (r: { standingsProbability: number }) => typeof r.standingsProbability === 'number',
      ),
    ).toBe(true);
    expect(artifact.observations).toHaveLength(160);
    expect(artifact.weeklyMetrics).toHaveLength(10);
    expect(artifact.predictiveWeeklyMetrics).toHaveLength(9);
    expect(artifact.coverage.evaluatedSeasons).toEqual([2025, 2024]);
    expect(artifact.seasons[0].scores).toHaveLength(80);
    const firstWeek = artifact.observations.filter((r: { week: number }) => r.week === 1);
    const brier =
      firstWeek.reduce(
        (sum: number, r: { probability: number; qualified: boolean }) =>
          sum + (r.probability - Number(r.qualified)) ** 2,
        0,
      ) / firstWeek.length;
    expect(artifact.weeklyMetrics[0].brier).toBeCloseTo(brier, 12);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await page.screenshot({
      path: `test-results/playoff-calibration-${viewport.width}.png`,
      fullPage: true,
    });
  });
}
