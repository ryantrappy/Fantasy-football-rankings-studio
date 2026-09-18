import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`full-card drag, reorder and undo at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1400 });
    await page.goto('/tests/ui/');
    const cards = page.locator('.team-editor-list > li');
    const handle = page.getByRole('button', { name: 'Drag Fourth & Long to reorder' });
    await handle.scrollIntoViewIfNeeded();
    const start = (await handle.boundingBox())!;
    const target = (await cards.nth(1).boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 10, { steps: 3 });
    const overlay = page.locator('.team-editor-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('textarea')).toHaveValue(/A statement win/);
    const lifted = (await overlay.boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, target.y + target.height / 2, { steps: 12 });
    expect((await overlay.boundingBox())!.y).toBeGreaterThan(lifted.y + 40);
    await expect(cards.nth(1)).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, -[\d.]+\)/);
    await expect(page.locator('.export-team-name').first()).toHaveText('Fourth & Long');
    await page.mouse.up();
    await expect(overlay).toHaveCount(0);
    await expect(cards.first().locator('strong')).toHaveText('Sunday Stunners');
    await expect(page.locator('.export-team-name').first()).toHaveText('Sunday Stunners');
    await page.getByRole('button', { name: 'Undo move' }).click();
    await expect(cards.first().locator('strong')).toHaveText('Fourth & Long');
  });
}

test('keyboard drag can cancel with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/ui/');
  const handle = page.getByRole('button', { name: 'Drag Fourth & Long to reorder' });
  await handle.scrollIntoViewIfNeeded();
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.team-editor-overlay')).toBeVisible();
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[role="status"]')).toContainText(
    'Draggable item 1 was moved over droppable area 2.',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('.team-editor-overlay')).toHaveCount(0);
  await expect(page.locator('.export-team-name').first()).toHaveText('Fourth & Long');
});

test('keyboard drag can drop with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/ui/');
  const handle = page.getByRole('button', { name: 'Drag Fourth & Long to reorder' });
  await handle.scrollIntoViewIfNeeded();
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.team-editor-overlay')).toBeVisible();
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[role="status"]')).toContainText(
    'Draggable item 1 was moved over droppable area 2.',
  );
  await page.keyboard.press('Space');
  await expect(page.locator('.export-team-name').first()).toHaveText('Sunday Stunners');
  await expect(handle).toBeFocused();
});

test('shortcut reference works by keyboard on mobile without intercepting commentary', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto('/tests/ui/');
  const summary = page.getByText('Keyboard shortcuts', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Lift the focused team/)).toBeVisible();
  await expect(page.getByText(/Cancel a keyboard drag/)).toBeVisible();
  await expect(page.getByText(/Activate a move-up, move-down, or Undo move button/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Lift the focused team/)).toBeHidden();

  const commentary = page.getByLabel('Commentary for Fourth & Long');
  await commentary.fill('Typing here');
  await commentary.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(commentary).toHaveValue('Typing here ');
  await expect(page.locator('.team-editor-overlay')).toHaveCount(0);
  await expect(page.locator('.export-team-name').first()).toHaveText('Fourth & Long');
});
