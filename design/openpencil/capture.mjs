// Run from the application root with the deterministic UI fixture server running.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL(process.env.DESIGN_OUTPUT_DIR || './', import.meta.url);
const base = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:3107';
const screens = [
  ['Rankings studio', '?mode=workspace-editor'],
  ['Weekly overview', '?mode=workspace-overview'],
  ['Season insights', '?mode=workspace-insights'],
  ['Playoff forecasts', '?mode=workspace-playoffs'],
  ['League history', '?mode=workspace-history'],
  ['Live matchups', '?mode=live'],
  ['Profile and writing instructions', '?mode=workspace-profile'],
  ['Manage leagues', '?mode=workspace-manage'],
  ['Connect league', '?mode=workspace-create'],
  ['Players (component fixture)', '?mode=players'],
  ['Trade analyzer (component fixture)', '?mode=trade'],
  ['Sign in', 'sign-in.html'],
];
await mkdir(new URL('reference/', out), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const captures = [];
for (const [size, width, height] of [
  ['Desktop', 1440, 900],
  ['Mobile', 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const [title, query] of screens.filter(
    ([title]) =>
      !process.env.DESIGN_SCREEN_TITLES ||
      process.env.DESIGN_SCREEN_TITLES.split('|').includes(title),
  )) {
    const url = `${base}/tests/ui/${query}`;
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#root')?.textContent.length > 30);
    await page.waitForTimeout(1600);
    await page.evaluate(() => document.fonts.ready);
    const snapshot = await page.evaluate(async () => {
      const svgImages = Object.fromEntries(
        await Promise.all(
          [...document.images]
            .filter((img) => new URL(img.src).pathname.endsWith('.svg'))
            .map(async (img) => [img.src, await (await fetch(img.src)).text()]),
        ),
      );
      const items = [];
      const transparent = (s) => !s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)';
      const box = (r) => ({ x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height });
      const text = (value, r, style, name) => {
        if (!value.trim() || r.width <= 0 || r.height <= 0) return;
        items.push({
          kind: 'text',
          name,
          ...box(r),
          text: value,
          color: style.color,
          fontSize: parseFloat(style.fontSize),
          weight: style.fontWeight,
          italic: style.fontStyle === 'italic',
          lineHeight: parseFloat(style.lineHeight),
          letterSpacing: parseFloat(style.letterSpacing) || 0,
          family: style.fontFamily,
          clipWidth: r.clipWidth,
          transform: style.textTransform,
        });
      };
      const walk = (el) => {
        const s = getComputedStyle(el),
          r = el.getBoundingClientRect();
        if (
          s.display === 'none' ||
          s.visibility === 'hidden' ||
          s.opacity === '0' ||
          r.width <= 0 ||
          r.height <= 0
        )
          return;
        const name =
          el.getAttribute('aria-label') || el.id || el.classList[0] || el.tagName.toLowerCase();
        if (el instanceof HTMLImageElement) {
          if (svgImages[el.src])
            items.push({
              kind: 'svg',
              name: el.alt || el.src.split('/').at(-1),
              ...box(r),
              svg: svgImages[el.src],
            });
          return;
        }
        if (el instanceof SVGElement) {
          if (el.tagName.toLowerCase() === 'svg') {
            const copy = el.cloneNode(true);
            [copy, ...copy.querySelectorAll('*')].forEach((node, i) => {
              const original = [el, ...el.querySelectorAll('*')][i];
              const st = getComputedStyle(original);
              node.setAttribute('fill', st.fill);
              node.setAttribute('stroke', st.stroke);
              node.setAttribute('stroke-width', st.strokeWidth);
            });
            items.push({ kind: 'svg', name, ...box(r), svg: copy.outerHTML });
          }
          return;
        }
        const borders = ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
          width: parseFloat(s[`border${side}Width`]),
          color: s[`border${side}Color`],
        }));
        if (
          !transparent(s.backgroundColor) ||
          borders.some((b) => b.width > 0 && !transparent(b.color))
        ) {
          items.push({
            kind: 'rect',
            name,
            ...box(r),
            color: s.backgroundColor,
            radius: parseFloat(s.borderTopLeftRadius) || 0,
            borders,
            opacity: Number(s.opacity),
          });
        }
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          const value =
            el instanceof HTMLSelectElement
              ? el.selectedOptions[0]?.textContent
              : el.value || el.placeholder;
          const left = parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth);
          const top = parseFloat(s.paddingTop) + parseFloat(s.borderTopWidth);
          text(
            value || '',
            {
              x: r.x + left,
              y: r.y + top,
              width: r.width - left - parseFloat(s.paddingRight),
              height: r.height - top,
            },
            s,
            name,
          );
          return;
        }
        for (const child of el.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (el instanceof HTMLDetailsElement && !el.open && child.tagName !== 'SUMMARY')
              continue;
            walk(child);
          } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            // Group character ranges into browser-computed lines to retain wrapping.
            const range = document.createRange();
            const lines = [];
            let clipRight = Infinity;
            let ellipsis = false;
            for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
              const as = getComputedStyle(ancestor);
              if (as.textOverflow === 'ellipsis') ellipsis = true;
              if (['hidden', 'clip', 'auto', 'scroll'].includes(as.overflowX)) {
                const ar = ancestor.getBoundingClientRect();
                clipRight = Math.min(
                  clipRight,
                  ar.right - parseFloat(as.paddingRight) - parseFloat(as.borderRightWidth),
                );
              }
            }
            for (let i = 0; i < child.textContent.length; i++) {
              range.setStart(child, i);
              range.setEnd(child, i + 1);
              const cr = range.getBoundingClientRect();
              if (cr.width === 0 || cr.height === 0) continue;
              let line = lines.at(-1);
              if (!line || Math.abs(line.y - cr.y) > 2) {
                line = { x: cr.x, y: cr.y, width: cr.width, height: cr.height, value: '' };
                lines.push(line);
              }
              line.width = cr.right - line.x;
              line.value += child.textContent[i];
            }
            for (const line of lines) {
              if (ellipsis && Number.isFinite(clipRight))
                line.clipWidth = Math.max(1, clipRight - line.x);
              text(line.value.replace(/\s+/g, ' '), line, s, name);
            }
          }
        }
      };
      walk(document.body);
      return {
        width: innerWidth,
        height: Math.max(innerHeight, document.documentElement.scrollHeight),
        background: getComputedStyle(document.documentElement).backgroundColor,
        items,
      };
    });
    const slug = `${size.toLowerCase()}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')}`;
    await page.screenshot({ path: new URL(`reference/${slug}.png`, out).pathname, fullPage: true });
    captures.push({ title, size, url: url.replace(base, ''), ...snapshot });
    console.log(`${size}: ${title} (${snapshot.items.length} editable layers)`);
  }
  await page.close();
}
await browser.close();
await writeFile(new URL('screens.json', out), `${JSON.stringify(captures, null, 2)}\n`);
