let helpSequence = 0;
function helpTip(label, text) {
  const id = 'help-' + ++helpSequence;
  return `<span class="help-tip"><button type="button" class="help-trigger" data-help="toggle" aria-label="${esc(label)}" aria-describedby="${id}" aria-expanded="false">ⓘ</button><span class="help-content" role="tooltip" id="${id}"><strong>${esc(label)}</strong>${esc(text)}</span></span>`;
}
function mockCsvButton(label = 'Download CSV') {
  return `<button type="button" data-sample-csv>${esc(label)}</button>`;
}
function saveSampleFile(name, content, type = 'application/json') {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportSampleTable(button) {
  const root =
    button.closest('dialog, .content, .workspace, article, section') ||
    document.querySelector('main');
  const tables = [...root.querySelectorAll('table')];
  const rows = tables.flatMap((t) =>
    [...t.rows]
      .filter((r) => !r.hidden)
      .map((r) =>
        [...r.cells]
          .map((c) => '"' + c.innerText.replaceAll('"', '""').replaceAll('\n', ' ') + '"')
          .join(','),
      ),
  );
  saveSampleFile(
    'sample-report.csv',
    rows.length ? rows.join('\r\n') : 'Notice\r\n"Illustrative mockup data only"',
    'text/csv;charset=utf-8',
  );
  toast('Sample CSV downloaded.');
}
document.addEventListener('click', (e) => {
  const h = e.target.closest('[data-help]');
  if (h) {
    const wrap = h.closest('.help-tip');
    const open = !wrap.classList.contains('help-open');
    document.querySelectorAll('.help-open').forEach((x) => x.classList.remove('help-open'));
    wrap.classList.toggle('help-open', open);
    h.setAttribute('aria-expanded', String(open));
    return;
  }
  if (!e.target.closest('.help-tip'))
    document.querySelectorAll('.help-open').forEach((x) => x.classList.remove('help-open'));
  const csv = e.target.closest('[data-sample-csv]');
  if (csv) exportSampleTable(csv);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    document.querySelectorAll('.help-open').forEach((x) => {
      x.classList.remove('help-open');
      x.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
});

function positionHelp(trigger) {
  if (innerWidth <= 720) return;
  const content = trigger.closest('.help-tip').querySelector('.help-content'),
    rect = trigger.getBoundingClientRect();
  content.style.left = Math.max(12, Math.min(rect.left, innerWidth - 334)) + 'px';
  content.style.right = 'auto';
  content.style.top =
    Math.max(12, Math.min(rect.bottom + 6, innerHeight - content.offsetHeight - 12)) + 'px';
}
document.addEventListener('pointerover', (e) => {
  const trigger = e.target.closest('[data-help]');
  if (trigger) positionHelp(trigger);
});
document.addEventListener('focusin', (e) => {
  const trigger = e.target.closest('[data-help]');
  if (trigger) positionHelp(trigger);
});
