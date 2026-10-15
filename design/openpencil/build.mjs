// Official OpenPencil plugin API creates native, individually editable layers.
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = new URL('./', import.meta.url);
const screens = JSON.parse(await readFile(new URL('screens.json', dir), 'utf8'));
const seed = join(tmpdir(), 'fantasy-openpencil-seed.fig');
const html = join(tmpdir(), 'fantasy-openpencil-seed.html');
await writeFile(html, '<div style="width:1px;height:1px"></div>');
const cli = ['--yes', '@open-pencil/cli@0.16.0'];
execFileSync('npx', [...cli, 'import', html, '-o', seed], { stdio: 'inherit' });
const script = `
const screens = ${JSON.stringify(screens)};
function paint(css) {
  const parts = (css || '').match(/[\\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3 || parts[3] === 0) return [];
  return [{ type: 'SOLID', color: { r: parts[0]/255, g: parts[1]/255, b: parts[2]/255 }, opacity: parts[3] ?? 1 }];
}
for (const child of [...figma.currentPage.children]) child.remove();
figma.currentPage.name = 'Desktop · current app';
const desktop = figma.currentPage;
const mobile = figma.createPage(); mobile.name = 'Mobile · current app';
const summaries = [];
for (const size of ['Desktop', 'Mobile']) {
  figma.currentPage = size === 'Desktop' ? desktop : mobile;
  let x = 0;
  for (const screen of screens.filter(s => s.size === size)) {
    const frame = figma.createFrame();
    frame.name = screen.title + ' · ' + screen.width + 'px';
    frame.resize(screen.width, screen.height); frame.x = x; frame.y = 0;
    frame.fills = paint(screen.background); frame.clipsContent = true;
    x += screen.width + 160;
    for (const item of screen.items) {
      let node;
      if (item.kind === 'text') {
        node = figma.createText();
        const weight = Number(item.weight);
        node.fontName = { family: 'Inter', style: item.italic ? 'Italic' : weight >= 650 ? 'Bold' : weight >= 500 ? 'Medium' : 'Regular' };
        node.fontSize = item.fontSize;
        node.characters = item.transform === 'uppercase' ? item.text.toUpperCase() : item.transform === 'lowercase' ? item.text.toLowerCase() : item.text;
        node.fills = paint(item.color);
        node.letterSpacing = {unit:'PIXELS', value:item.letterSpacing};
        node.textAutoResize = 'WIDTH_AND_HEIGHT';
        if (Number.isFinite(item.lineHeight)) node.lineHeight = {unit:'PIXELS', value:item.lineHeight};
        if (item.clipWidth) {
          node.textAutoResize = 'NONE';
          node.resize(item.clipWidth, Math.max(item.h + 5, item.fontSize * 1.3));
          node.maxLines = 1;
          node.textTruncation = 'ENDING';
        }

      } else if (item.kind === 'svg') {
        try { node = figma.createNodeFromSvg(item.svg); } catch { continue; }
        node.rescale(Math.max(item.w, 1) / Math.max(node.width, 1));
        node.resize(Math.max(item.w, 1), Math.max(item.h, 1));
        node.fills = [];
      } else {
        node = figma.createRectangle();
        node.resize(Math.max(item.w, 1), Math.max(item.h, 1));
        node.fills = paint(item.color);
        node.cornerRadius = Math.min(item.radius, item.w/2, item.h/2);
        node.opacity = item.opacity;
        // Uniform borders retain native strokes; separate edge rectangles retain dividers.
        const uniform = item.borders.every(b => b.width === item.borders[0].width && b.color === item.borders[0].color);
        if (uniform && item.borders[0].width > 0) {
          node.strokes = paint(item.borders[0].color); node.strokeWeight = item.borders[0].width; node.strokeAlign = 'INSIDE';
        }
      }
      frame.appendChild(node);
      node.x = item.x; node.y = item.y;
      node.name = item.kind === 'text' ? item.text.trim().slice(0,80) : item.name;
      if (item.kind === 'rect') {
        const uniform = item.borders.every(b => b.width === item.borders[0].width && b.color === item.borders[0].color);
        if (!uniform) item.borders.forEach((b,i) => {
          if (!b.width || !paint(b.color).length) return;
          const edge = figma.createRectangle(); frame.appendChild(edge);
          edge.name = item.name + ' border ' + ['top','right','bottom','left'][i]; edge.fills = paint(b.color);
          edge.resize(i%2 ? b.width : item.w, i%2 ? item.h : b.width);
          edge.x = item.x + (i === 1 ? item.w - b.width : 0);
          edge.y = item.y + (i === 2 ? item.h - b.width : 0);
        });
      }
    }
    summaries.push({name:frame.name,id:frame.id,layers:frame.children.length});
  }
}
figma.currentPage = desktop;
return summaries;
`;
const result = execFileSync(
  'npx',
  [...cli, 'eval', seed, '--stdin', '-o', new URL('current-app.fig', dir).pathname, '--json'],
  { input: script, maxBuffer: 10 * 1024 * 1024 },
);
console.log(result.toString());
const frames = execFileSync('npx', [
  ...cli,
  'eval',
  new URL('current-app.fig', dir).pathname,
  '-c',
  'return figma.root.children.map(p=>({page:p.name,frames:p.children.map(f=>({name:f.name,id:f.id,layers:f.children.length}))}));',
  '--json',
]);
await writeFile(new URL('frames.json', dir), frames);
