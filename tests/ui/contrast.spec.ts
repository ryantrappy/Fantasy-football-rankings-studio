import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

async function contrast(locator: Locator, property = 'color', againstParent = false) {
  return locator.evaluate(
    (element, { property, againstParent }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      function rgba(color: string) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const pixel = [...ctx.getImageData(0, 0, 1, 1).data];
        return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
      }
      const blend = (fg: number[], bg: number[]) =>
        fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
      function background(node: Element | null): number[] {
        if (!node) return [255, 255, 255];
        return blend(rgba(getComputedStyle(node).backgroundColor), background(node.parentElement));
      }
      function luminance(rgb: number[]) {
        return rgb
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      }
      const bg = background(againstParent ? element.parentElement : element);
      const css =
        property === 'placeholder'
          ? getComputedStyle(element, '::placeholder')
          : getComputedStyle(element);
      const fg = rgba(css.getPropertyValue(property === 'placeholder' ? 'color' : property));
      if (property === 'placeholder') fg[3] *= Number(css.opacity);
      const a = luminance(blend(fg, bg)),
        b = luminance(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    },
    { property, againstParent },
  );
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`app contrast passes with ${colorScheme} system preference`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const mode of ['palette', 'create', 'chart', '']) {
      await page.goto(`/tests/ui/?mode=${mode}`);
      await page.locator('.chakra-container').waitFor();
      if (!mode) await page.getByLabel('Edition title').waitFor();
      const result = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .exclude('.export-canvas')
        .analyze();
      expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
    }
  });
}

test('primary links and buttons retain contrast in normal, hover, and focus states', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=palette');
  await page.addStyleTag({ content: '* { transition: none !important; }' });
  for (const control of [
    page.getByRole('link', { name: 'Create league', exact: true }),
    page.getByRole('button', { name: 'Create league', exact: true }),
  ]) {
    await expect(control).toBeVisible();
    expect(await contrast(control)).toBeGreaterThanOrEqual(4.5);
    await control.hover();
    expect(await contrast(control)).toBeGreaterThanOrEqual(4.5);
    await control.focus();
    expect(await contrast(control)).toBeGreaterThanOrEqual(4.5);
  }
  for (const input of [page.getByLabel(/League ID/), page.getByLabel(/Display name/)]) {
    expect(await contrast(input, 'border-top-color')).toBeGreaterThanOrEqual(3);
    expect(await contrast(input, 'placeholder')).toBeGreaterThanOrEqual(4.5);
  }
});

test('keyboard focus is visible against light content and the dark header', async ({ page }) => {
  await page.goto('/tests/ui/?mode=palette');
  await page.keyboard.press('Tab');
  const brand = page.getByRole('link', { name: 'POWER / RANK' });
  await expect(brand).toBeFocused();
  for (const target of [brand, page.getByRole('link', { name: 'Create league', exact: true })]) {
    if (target !== brand) await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS('outline-style', 'solid');
    await expect(target).toHaveCSS('outline-width', '3px');
    expect(await contrast(target, 'outline-color', true)).toBeGreaterThanOrEqual(3);
  }
});
