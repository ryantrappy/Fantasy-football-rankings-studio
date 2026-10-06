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
