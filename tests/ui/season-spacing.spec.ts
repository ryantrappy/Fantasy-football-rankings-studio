import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`season insight cards have consistent spacing at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/ui/?mode=season-summary');

    const cards = page.locator('.insight-cards article');
    await expect(cards).toHaveCount(3);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const cardGap =
      width < 768 ? second!.y - (first!.y + first!.height) : second!.x - (first!.x + first!.width);
    expect(cardGap).toBeGreaterThanOrEqual(20);

    const luck = await page.locator('.panel:has(h3:text-is("Schedule luck index"))').boundingBox();
    const scorecard = await page
      .locator('.panel:has(h3:text-is("Manager scorecard"))')
      .boundingBox();
    expect(luck).not.toBeNull();
    expect(scorecard).not.toBeNull();
    expect(scorecard!.y - (luck!.y + luck!.height)).toBeGreaterThanOrEqual(20);
    await page.screenshot({
      path: testInfo.outputPath(`season-spacing-${width}.png`),
      fullPage: true,
    });
  });
}
