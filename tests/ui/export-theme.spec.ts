import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const width of [1440, 390]) {
  test(`export themes preserve content and produce both PNG sizes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tests/ui/?mode=theme');
    await page.getByLabel('Edition title').waitFor();
    await page.getByRole('button', { name: 'Preview & export' }).click();
    const preview = page.getByRole('region', { name: 'Live ranking preview' });
    await expect(page.getByRole('button', { name: 'Classic export theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const before = await preview.locator('.export-table').innerText();
    const chooseNew = page.getByRole('button', { name: 'New export theme' });
    await chooseNew.focus();
    await page.keyboard.press('Enter');
    await expect(chooseNew).toHaveCSS('background-color', 'rgb(57, 73, 171)');
    await expect(preview.locator('.export-title')).toHaveCSS('background-color', 'rgb(23, 43, 76)');
    expect(await preview.locator('.export-table').innerText()).toBe(before);
    for (const compact of [false, true]) {
      const downloaded = page.waitForEvent('download');
      await page
        .getByRole('button', {
          name: compact ? 'Download compact PNG' : 'Download PNG',
          exact: true,
        })
        .click();
      const png = await readFile((await (await downloaded).path())!);
      const result = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return { width: image.width, color: Array.from(context.getImageData(4, 4, 1, 1).data) };
      }, png.toString('base64'));
      expect(result.width).toBe(compact ? 720 : 1304);
      expect(result.color).toEqual([23, 43, 76, 255]);
    }
    await page.getByRole('button', { name: 'Compact preview (720px)' }).click();
    await expect(preview.locator('.export-title')).toHaveCSS('background-color', 'rgb(23, 43, 76)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.reload();
    await page.getByRole('button', { name: 'Preview & export' }).click();
    await expect(chooseNew).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/tests/ui/?mode=theme&owner=other-owner');
    await page.getByRole('button', { name: 'Preview & export' }).click();
    await expect(page.getByRole('button', { name: 'Classic export theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('publication preview uses the selected theme without publishing or changing the edition', async ({
  page,
}) => {
  await page.goto('/tests/ui/?mode=theme');
  await page.getByRole('button', { name: 'New export theme' }).click();
  await page.locator('.editor-tools > summary').click();
  await page.getByText('Preview publication appearance', { exact: true }).click();
  const publication = page.getByRole('region', { name: 'Publication' });
  await expect(publication.locator('.export-title')).toHaveCSS(
    'background-color',
    'rgb(23, 43, 76)',
  );
  await expect(publication.locator('.export-team-name')).toHaveText([
    'Fourth & Long',
    'Sunday Stunners',
    'End Zone Experts',
    'The Underdogs',
  ]);
  await expect(page.getByText('Private draft', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Published edition link')).toHaveCount(0);
});
