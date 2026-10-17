// Deterministic production-component fixtures. No account or provider requests.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base = process.env.UI_REVIEW_BASE_URL || 'http://127.0.0.1:3107';
const phase = process.env.UI_REVIEW_PHASE || 'before';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const out = new URL(`./${phase}/`, import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [slug, mode, width, height] of [
  ['mobile-live-header', 'live&managed=1', 390, 844],
  ['mobile-ranking-editor', 'workspace-editor', 390, 1000],
  ['mobile-ranking-row', 'workspace-editor', 390, 844],
  ['mobile-analytics-detail', 'workspace-insights', 390, 844],
  ['mobile-analytics-navigation', 'workspace-insights', 390, 1000],
  ['desktop-profile-focus', 'workspace-overview', 1440, 900],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto(`${base}/tests/ui/?mode=${mode}`);
  await page.waitForFunction(() => document.querySelector('#root')?.textContent.length > 30);
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.fonts.ready);
  if (slug === 'mobile-ranking-row') {
    await page
      .getByRole('heading', { name: 'Team entries', exact: true })
      .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140));
  }
  if (slug === 'mobile-analytics-detail') {
    const trigger = page.getByRole('button', { name: 'View selected team details' });
    if (await trigger.count()) await trigger.click();
    else
      await page
        .getByRole('complementary', { name: 'Selected team inspector' })
        .scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  if (slug === 'desktop-profile-focus') {
    await page.getByLabel('Profile menu').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.screenshot({
      path: new URL(`${slug}.png`, out).pathname,
      clip: { x: 960, y: 0, width: 480, height: 440 },
    });
  } else {
    await page.screenshot({ path: new URL(`${slug}.png`, out).pathname });
  }
  console.log(`${phase}/${slug}.png`);
  await page.close();
}
await browser.close();
