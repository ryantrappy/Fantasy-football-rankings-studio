import { expect, test } from '@playwright/test';

for (const count of [12, 32]) {
  test(`${count}-team cold forecast yields to input with identical seeded results`, async ({
    page,
  }) => {
    await page.goto('/tests/ui/?mode=playoffs');
    await expect(page.getByRole('table', { name: 'Playoff probabilities' })).toBeVisible();
    const measurement = await page.evaluate(async (size) => {
      const { forecastPlayoffs, forecastPlayoffsAsync } = await import('/src/playoff-forecast.ts');
      const data = {
        completedWeek: 6,
        teams: Array.from({ length: size }, (_, index) => ({
          teamId: String(index),
          teamName: `Team ${index}`,
        })),
        scores: Array.from({ length: 6 }, (_, index) => index + 1).flatMap((week) =>
          Array.from({ length: size }, (_, index) => ({
            teamId: String(index),
            opponentTeamId: String(index ^ 1),
            week,
            actual: 90 + ((index * 13 + week * 7) % 60),
          })),
        ),
      };
      const settings = { regularSeasonEnd: 14, playoffTeams: 4 };
      const longTasks: number[] = [];
      const observer = new PerformanceObserver((list) =>
        longTasks.push(...list.getEntries().map((entry) => entry.duration)),
      );
      observer.observe({ type: 'longtask' });
      let probes = 0,
        longestGap = 0,
        previous = performance.now();
      const timer = setInterval(() => {
        const now = performance.now();
        longestGap = Math.max(longestGap, now - previous);
        previous = now;
        probes++;
      }, 10);
      const start = performance.now();
      const result = await forecastPlayoffsAsync(data, settings, 6);
      const elapsed = performance.now() - start;
      clearInterval(timer);
      observer.disconnect();
      const parity = JSON.stringify(result) === JSON.stringify(forecastPlayoffs(data, settings, 6));
      return { elapsed, longestGap, probes, longTasks, parity, simulations: result.simulations };
    }, count);
    console.log(`${count}-team forecast: ${JSON.stringify(measurement)}`);
    expect(measurement.parity).toBe(true);
    expect(measurement.simulations).toBe(20000);
    expect(measurement.probes).toBeGreaterThan(10);
    expect(measurement.longTasks).toEqual([]);
    expect(measurement.longestGap).toBeLessThan(50);
  });
}

for (const width of [390, 1440]) {
  test(`forecast keeps all round odds, weekly values and Advanced evaluation at ${width}px`, async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=analytics');
    await page.getByRole('button', { name: 'Open playoff preview' }).click();
    const table = page.getByRole('table', { name: 'Playoff probabilities' });
    await expect(table.locator('tbody tr')).toHaveCount(8);
    for (const name of [
      'Projected record',
      'Make playoffs',
      'Earn bye',
      'Reach semifinal',
      'Reach final',
      'Win title',
    ])
      await expect(table.getByRole('columnheader', { name, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run historical calibration' })).toHaveCount(0);
    await page.screenshot({ path: `test-results/analytics-forecast-${width}.png`, fullPage: true });
    await page.getByLabel('Forecast through week').selectOption('2');
    await expect(page.getByRole('note')).toBeVisible();
    await page.getByRole('button', { name: 'Week-by-week chart' }).click();
    await page.getByText('Exact weekly percentages', { exact: true }).click();
    const weekly = page.getByRole('table', { name: 'Weekly make playoffs probabilities' });
    await expect(weekly.locator('tbody tr')).toHaveCount(4);
    await expect(weekly.locator('thead th')).toHaveCount(9);
    await page.getByRole('button', { name: 'Win championship', exact: true }).click();
    await expect(
      page.getByRole('table', { name: 'Weekly win championship probabilities' }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/analytics-forecast-weekly-${width}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Advanced', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Export calibration JSON' })).toBeDisabled();
    await page.getByRole('button', { name: 'Run historical calibration' }).click();
    await expect(page.getByText('Backtest complete.')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Weekly diagnostics' }).click();
    await expect(
      page.getByRole('table', { name: 'Weekly playoff forecast accuracy' }).locator('tbody tr'),
    ).toHaveCount(9);
    await page.screenshot({ path: `test-results/analytics-advanced-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Forecast table', exact: true }).click();
    await expect(page.getByLabel('Forecast through week')).toHaveValue('2');
    await page.getByRole('button', { name: 'Advanced', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Weekly diagnostics' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Export calibration JSON' })).toBeEnabled();
    const downloaded = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download Weekly playoff forecast accuracy CSV' })
      .click();
    const { readFile } = await import('node:fs/promises');
    const csv = await readFile((await (await downloaded).path())!, 'utf8');
    expect(csv).toContain(
      'Standings Brier,Equal-chance Brier,Model log loss,Standings log loss,Equal-chance log loss',
    );
    expect(csv).toContain('Accuracy at 50% threshold');
    for (const view of [
      'Convergence',
      'Weekly diagnostics',
      'Season comparisons',
      'Reliability',
      'Final seeding',
    ]) {
      await page.getByRole('button', { name: view, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });
}
