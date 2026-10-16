import { execFileSync } from 'node:child_process';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const file = new URL('current-app.fig', import.meta.url).pathname;
const cli = ['--yes', '@open-pencil/cli@0.16.0'];
function run(args) {
  return execFileSync('npx', [...cli, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}
const pages = JSON.parse(
  run([
    'eval',
    file,
    '-c',
    `return figma.root.children.map(p => ({name:p.name, frames:p.children.map(f=>({name:f.name,id:f.id,texts:f.findAll(n=>n.type==='TEXT').length,vectors:f.findAll(n=>n.type==='VECTOR').length}))}));`,
    '--json',
  ]),
);
assert.equal(pages.length, 2);
const captures = JSON.parse(await readFile(new URL('screens.json', import.meta.url), 'utf8'));
assert.equal(captures.length, 24);
for (const page of pages) {
  assert.equal(page.frames.length, 12);
  assert(page.frames.every((f) => f.texts > 10));
  assert(page.frames.some((f) => f.vectors > 0));
  for (const frame of page.frames)
    assert(captures.some((s) => `${s.title} · ${s.width}px` === frame.name));
}
const truncationCount = JSON.parse(
  run([
    'eval',
    file,
    '-c',
    `return figma.root.children.reduce((count,p)=>count+p.findAll(n=>n.type==='TEXT' && n.textTruncation==='ENDING' && n.maxLines===1).length,0);`,
    '--json',
  ]),
);
assert(
  truncationCount > 0,
  'Visible browser ellipsis must remain native text truncation after save/reopen',
);
const dir = await mkdtemp(join(tmpdir(), 'fantasy-openpencil-verify-'));
const copy = join(dir, 'edited.fig');
run([
  'eval',
  file,
  '-c',
  `const text=figma.currentPage.findAll(n=>n.type==='TEXT')[0];text.characters='Editable mockup verified'; return text.characters;`,
  '-o',
  copy,
  '--json',
]);
assert.equal(
  JSON.parse(
    run([
      'eval',
      copy,
      '-c',
      `return figma.currentPage.findAll(n=>n.type==='TEXT')[0].characters;`,
      '--json',
    ]),
  ),
  'Editable mockup verified',
);
for (const page of pages)
  for (const frame of page.frames) {
    const name = frame.name.replace(/[^a-z0-9]+/gi, '-');
    run([
      'export',
      file,
      '--node',
      frame.id,
      '--font-policy',
      'strict',
      '-o',
      join(dir, `${name}.png`),
    ]);
    console.log(`Rendered ${frame.name}`);
  }
console.log(
  `Verified 24 editable screen frames, native save/reopen, and strict-font PNG exports: ${dir}`,
);
