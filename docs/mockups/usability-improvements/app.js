/* Interactive UI/Usability Redesign Prototype — Preserves 100% of TASK-1..TASK-146 features */
const screens = [
  'Rankings studio',
  'Players',
  'Trade analyzer',
  'Weekly overview',
  'Live matchups',
  'Season insights',
  'Playoff simulation',
  'Manage leagues',
  'Connect league',
  'Profile',
  'League history',
  'Other tools',
];

const primaryNavIndices = [0, 3, 4, 5, 6, 10, 11];
const teams = [
  'Sunday Strategists',
  'Fourth & Forever',
  'The Waiver Wire',
  'Red Zone Regulars',
  'Bench Mob',
  'Goal Line Stand',
];
const managers = [
  'Alex Morgan',
  'Blair Davis',
  'Casey Brooks',
  'Devon Lee',
  'Jordan Ellis',
  'Taylor Reed',
];

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

let page = Math.max(0, screens.indexOf(decodeURIComponent(location.hash.slice(1))));
if (page < 0) page = 0;
let tab = '';
let selected = 0;
let state = 'Ready';
let showUxNotes = true;
let order = [...teams];
let exportCompactMode = false;
let openingCollapsed = false;
let overviewInlineOpen = { 0: true, 1: false };
let playoffHistogramMode = false;

const contextValues = {
  League: 'Sample league',
  Season: '2025',
  Week: '7',
  'Show league': 'All leagues',
};

const draftValues = {
  'Edition title': 'Week 7: The contenders emerge',
  'Opening take':
    'Six weeks in, the standings are finally separating. Here’s who has earned their place heading into the mid-season stretch.',
  'Team take Sunday Strategists':
    'The most complete team in the league right now. Another convincing win keeps them at the top.',
  'Team take Fourth & Forever':
    'Tough loss in Week 6, but top-two points scored keeps their playoff bye odds strong.',
  'Team take The Waiver Wire':
    'Mid-season pickups have stabilized the flex spot after early injury trouble.',
  'Team take Red Zone Regulars': '',
  'Team take Bench Mob':
    'High ceiling on the bench, but start/sit decisions have cost two close games.',
  'Team take Goal Line Stand': '',
};

let helpSeq = 0;
function helpTip(label, text) {
  const id = 'tip-' + ++helpSeq;
  return `<span class="help-tip"><button type="button" class="help-trigger" data-help="toggle" aria-label="${esc(label)}" aria-describedby="${id}" aria-expanded="false">ⓘ</button><span class="help-content" role="tooltip" id="${id}"><strong>${esc(label)}</strong>${esc(text)}</span></span>`;
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    t.style.display = 'none';
  }, 2600);
}

function modal(title, bodyHtml) {
  const d = $('#dialog');
  $('#dialog-body').innerHTML = `<h2>${esc(title)}</h2>${bodyHtml}`;
  if (!d.open) d.showModal();
}

function saveSampleFile(name, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mockCsvButton(label = 'Download CSV') {
  return `<button type="button" class="subtle" data-sample-csv>⬇ ${esc(label)}</button>`;
}

const btn = (t, a = '', c = '') => `<button type="button" class="${c}" data-action="${a}">${t}</button>`;
const kv = (l, v) => `<div class="kv"><span>${l}</span><strong>${v}</strong></div>`;
const strip = (rows) =>
  `<div class="summary-strip">${rows.map(([l, v, s]) => `<div><span>${l}</span><strong>${v}</strong><small>${s || ''}</small></div>`).join('')}</div>`;
const split = (b, a) =>
  `<div class="split"><section class="content">${b}</section><aside class="aside">${a}</aside></div>`;
const head = (h, p, a = '') =>
  `<div class="sectionhead"><div><h2>${h}</h2>${p ? `<p>${p}</p>` : ''}</div><div class="actions">${a}</div></div>`;

function selectCtrl(label, opts, key = label) {
  return `<label>${label}<select aria-label="${esc(label)}" data-field="${esc(key)}">${opts
    .map((o) => `<option ${contextValues[key] === o ? 'selected' : ''}>${esc(o)}</option>`)
    .join('')}</select></label>`;
}

function fieldCtrl(label, val = '', type = 'text') {
  return `<label>${label}<input data-field="${esc(label)}" type="${type}" value="${esc(draftValues[label] ?? val)}"></label>`;
}

function tabs(names) {
  if (!names.includes(tab)) tab = names[0];
  return `<div class="tabs" role="tablist" aria-label="${esc(screens[page])} views">${names
    .map((n) => `<button type="button" data-tab="${esc(n)}" aria-pressed="${n === tab}">${esc(n)}</button>`)
    .join('')}</div>`;
}

function table(heads, rows, selectable = false) {
  return `<div class="table-wrap"><table><thead><tr>${heads
    .map(
      (h, i) =>
        `<th scope="col" class="${i ? 'num' : ''}"><button type="button" class="link" data-action="sort:${i}" style="color:var(--muted);text-decoration:none;font-size:11.5px">${h}</button></th>`,
    )
    .join('')}</tr></thead><tbody>${rows
    .map(
      (r, i) =>
        `<tr class="${selectable && i === selected ? 'selected' : ''}">${r
          .map((c, j) => `<td class="${j ? 'num' : ''}">${c}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</tbody></table></div>`;
}

function uxCalloutForPage() {
  if (!showUxNotes) return '';
  const notes = {
    0: [
      'Unified Page Command Bar merges title, League/Season/Week selectors, and autosave freshness into 1 compact row (-95px vertical chrome).',
      'Team rows show completion progress (4/6 takes ready), drag handles (⋮⋮), rank movement badges, and 1-line commentary previews.',
      'Sticky Right-Hand Take Studio stays in view while scrolling and adds ← Prev / Next → team steppers plus top-level Studio Toolbar.',
      'Preview & Export supports toggling between isolated Original (1304px) and Compact Phone (720px) PNG layouts without touching export.css.',
    ],
    1: [
      '1-Click Sub-Tool Switcher lets you jump between Players and Trade Analyzer without routing back through the Other Tools landing page.',
      'When 2+ players are selected, a Side-by-Side Weekly Comparison Matrix + Trend Chart appears above individual player source cards.',
    ],
    2: [
      'Unified Trade Exchange Banner summarizes You Send ↔ Partner Sends, net starter gain, and positional coverage deltas in one bar.',
      'Rosters are grouped with clear Starter/Bench/Lock status badges and instant search filtering.',
    ],
    3: [
      'Matchup cards add visual Win-Probability Tug-of-War bars so you can scan close matchups across all leagues at a glance.',
      'Advisor buttons display live actionable impact badges ("Lineup advisor · +17.8 pts", "Waiver advisor · 2 upgrades").',
      'Inline Quick-Preview Drawer shows recommended starter swaps directly on the card while retaining the full scenario modal.',
    ],
    4: [
      'Fixed the top-right Account Dropdown bug (was floating white-on-white over Matchup Slot 2 in live-1440.png).',
      'Added ★ My Team badges in the sidebar, head-to-head win probability bars, and LIVE Q3 / FINAL / BYE status pills with Proj vs Actual.',
    ],
    5: [
      'Restored semantic 4-tier heatmap colors (Elite Blue, Strong Green, Mid Amber, Needs Work Coral) across QB, RB, WR, TE, K, DEF from reference.',
      'Restored horizontal stacked Roster Projections chart with 0–2200 X-axis scale and persistent Selected Team Evidence right-hand panel.',
    ],
    6: [
      'Added visible Table vs. Histogram Distribution mode toggle (TASK-69) directly on the Playoff Forecast tab.',
      'Restored the right-hand Selected Team Path Inspector alongside the probability table and 5-view Advanced calibration.',
    ],
    7: [
      'Grouped Active/Archived toggle, per-season Managed Team selector, and provider ID settings with clear save/clear feedback.',
    ],
    8: [
      'Guided Sleeper & ESPN onboarding preserves entered fields when visiting private ESPN cookie setup.',
    ],
    9: [
      'Clearly separates Auth0 identity/password recovery, Server-Managed Codex readiness vs. personal API key precedence, and encrypted ESPN cookies.',
    ],
    10: [
      'Pre-populates the right-hand Record Evidence inspector on initial load (eliminating the empty dead state) and enhances Fantasy Wrapped cards.',
    ],
    11: [
      'Provides rich summary cards with live context counts for Players and Trade Analyzer while keeping 1-click sub-navigation.',
    ],
  }[page] || [];

  return `<aside class="ux-annotation-banner" aria-label="UX and usability improvements on this screen">
    <div>
      <strong>✨ UI & Usability Improvements on ${esc(screens[page])} (100% Feature Parity Preserved)</strong>
      <ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>
    <button type="button" class="subtle" data-action="hideUxNotes">Hide notes</button>
  </aside>`;
}

function commandBar(title, subtitle, showContext = true, includeWeek = false, actionsHtml = '') {
  const ctx = showContext
    ? `<div class="context-inline-controls" aria-label="League context">
        ${selectCtrl('League', ['Sample league', 'Sunday league'])}
        ${selectCtrl('Season', ['2025', '2024', '2023'])}
        ${includeWeek ? selectCtrl('Week', ['7', '6', '5', '4']) : ''}
        <span class="fresh-badge">✓ ${page === 4 ? 'Live · 20s ago' : 'Data through W6'}</span>
      </div>`
    : '';
  return `<section class="page-command-bar">
    <div class="page-title-group">
      <h1>${esc(title)}</h1>
      <p>${esc(subtitle)}</p>
    </div>
    ${ctx}
    ${actionsHtml ? `<div class="actions">${actionsHtml}</div>` : ''}
  </section>`;
}

function subtoolBar() {
  if (![1, 2, 11].includes(page)) return '';
  return `<nav class="subtool-switcher" aria-label="Other tools quick switcher">
    <div class="subtool-pills">
      <button type="button" data-action="go:11" aria-pressed="${page === 11}">🧰 All tools directory</button>
      <button type="button" data-action="go:1" aria-pressed="${page === 1}">🔎 Players & comparison (${decisionCompare.size})</button>
      <button type="button" data-action="go:2" aria-pressed="${page === 2}">⇄ Trade analyzer & ideas (3 mutual)</button>
    </div>
    <small>Quick-switch without losing selected league or player context</small>
  </nav>`;
}

/* ==================== 0. RANKINGS STUDIO ==================== */
let workflowUndo = null;
let workflowConsent = { Codex: true, Claude: false };
let workflowProvider = 'Codex';
let workflowModel = 'gpt-5.6-sol';
let workflowRunning = false;
let workflowGeneration = 0;
let workflowSuggestion = '';
let workflowShowRoster = false;
let workflowReadiness = 'ready';

function exportDocument() {
  const cls = exportCompactMode ? 'compact-export' : '';
  const content = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="original-export.css"><style>body{margin:0;padding:12px;background:#e5e9f2}*{box-sizing:border-box}</style></head><body class="${cls}"><div class="export-canvas ${cls}"><div class="ranking-preview"><h2 class="export-title">${esc(draftValues['Edition title'] ?? 'Week 7: The contenders emerge')}</h2><p class="export-introduction">${esc(draftValues['Opening take'] ?? 'Six weeks in, the standings are finally separating.')}</p><table class="export-table"><colgroup><col class="export-rank-column"><col class="export-team-column"><col class="export-trend-column"><col class="export-comments-column"></colgroup><thead><tr><th>Rank</th><th>Team / Record</th><th>Trending</th><th>Comments</th></tr></thead><tbody>${order
    .map(
      (n, i) =>
        `<tr><td class="export-rank"><span class="export-rank-circle ${i < Math.ceil(order.length / 2) ? 'top-half' : 'bottom-half'}">${i + 1}</span></td><td><div class="export-team-name">${esc(n)}</div><div class="export-team-details"><span>${esc(managers[teams.indexOf(n)])}</span><span>${Math.max(0, 5 - i)}-${i + 1}</span></div></td><td class="export-trend"><div class="export-movement ${i % 2 ? 'down' : 'up'}">${i % 2 ? '▼' : '▲'} 1</div><div class="export-last-week">Last Week: ${i + 2}</div></td><td class="export-comments">${esc(draftValues['Team take ' + n] || 'A new week and another chance to climb.')}</td></tr>`,
    )
    .join('')}</tbody></table></div></div></body></html>`;
  return `<div class="original-export-host"><iframe class="original-export" style="width:${exportCompactMode ? '760px' : '1330px'}" title="Original rankings export preview" srcdoc="${esc(content)}"></iframe></div>`;
}

function renderRankings() {
  const t = tabs(['Edit rankings', 'Preview & export']);
  const readyCount = order.filter((n) => (draftValues['Team take ' + n] ?? '').trim().length > 0).length;
  const currentTeam = order[selected] || order[0];
  const currentTake = draftValues['Team take ' + currentTeam] ?? '';

  const body =
    tab === 'Edit rankings'
      ? split(
          `<div class="studio-toolbar" role="toolbar" aria-label="Edition actions">
            <div class="studio-toolbar-group">
              <button type="button" class="primary" data-workflow="save-ranking">💾 Save rankings</button>
              <button type="button" data-workflow="undo" ${workflowUndo ? '' : 'disabled'}>↩ Undo move</button>
              <button type="button" data-workflow="draft">🛡 Draft & save status</button>
            </div>
            <div class="studio-toolbar-group">
              ${btn('📋 Copy edition', 'copy')}
              ${btn('🕓 Revision history', 'revision')}
              ${btn('⌨ Shortcuts', 'shortcuts')}
              ${helpTip('Edition tools', 'Copy an earlier edition, restore a saved revision, resolve concurrent save conflicts, or use keyboard drag shortcuts.')}
            </div>
          </div>
          <div style="display:grid;gap:12px;margin-bottom:18px">
            ${fieldCtrl('Edition title', 'Week 7: The contenders emerge')}
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <label style="font-weight:600;color:var(--ink)">Opening take</label>
                <button type="button" class="subtle" data-action="toggleOpening">${openingCollapsed ? 'Expand opening take ▾' : 'Collapse ▴'}</button>
              </div>
              ${
                openingCollapsed
                  ? `<p class="muted" style="padding:8px 12px;background:var(--bg);border-radius:6px">${esc(draftValues['Opening take'])}</p>`
                  : `<textarea data-field="Opening take" aria-label="Opening take">${esc(draftValues['Opening take'])}</textarea>`
              }
            </div>
          </div>
          ${head(
            'Team order',
            'Click a row to edit its take on the right, or drag / use arrows to reorder.',
            `<span class="progress-pill"><span>${readyCount} of ${order.length} takes ready</span><span class="mini-progress"><span style="width:${Math.round((readyCount / order.length) * 100)}%"></span></span></span>`,
          )}
          <div>
            ${order
              .map((n, i) => {
                const takeText = (draftValues['Team take ' + n] ?? '').trim();
                const hasTake = takeText.length > 0;
                const ppg = (124.8 - teams.indexOf(n) * 4.7).toFixed(1);
                return `<div class="rankrow ${i === selected ? 'selected' : ''}" draggable="true" tabindex="0" data-pick-row="${i}">
                  <span class="drag-handle" title="Drag or press Space to reorder">⋮⋮</span>
                  <span class="rank-badge">${i + 1}</span>
                  <div class="team">
                    <div class="team-header">
                      ${btn(n, 'pick:' + i, 'link')}
                      <small>${esc(managers[teams.indexOf(n)])} · ${Math.max(0, 5 - i)}–${i + 1} · ${ppg} PPG</small>
                      <span class="badge ${i % 2 ? 'down' : 'up'}">${i % 2 ? '▼ 1' : '▲ 1'}</span>
                      <span class="badge ${hasTake ? 'ready' : 'draft'}">${hasTake ? '✓ Take ready' : 'Draft needed'}</span>
                    </div>
                    <span class="take-snippet">${hasTake ? esc(takeText) : 'No commentary yet — select row to write or generate a suggestion.'}</span>
                  </div>
                  <div class="move">
                    <button type="button" data-action="up:${i}" aria-label="Move ${esc(n)} up" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" data-action="down:${i}" aria-label="Move ${esc(n)} down" ${i === order.length - 1 ? 'disabled' : ''}>↓</button>
                  </div>
                </div>`;
              })
              .join('')}
          </div>`,
          `<div class="aside-stepper">
            <div>
              <small>Selected team · Rank #${selected + 1}</small>
              <h3>${esc(currentTeam)}</h3>
            </div>
            <div class="actions">
              <button type="button" class="subtle" data-action="pick:${Math.max(0, selected - 1)}" ${selected === 0 ? 'disabled' : ''}>← Prev</button>
              <button type="button" class="subtle" data-action="pick:${Math.min(order.length - 1, selected + 1)}" ${selected === order.length - 1 ? 'disabled' : ''}>Next #${Math.min(order.length, selected + 2)} →</button>
            </div>
          </div>
          <div class="evidence-chips">
            <div class="evidence-chip"><span>Last week</span><strong>Won 128.4–112.6</strong></div>
            <div class="evidence-chip"><span>Scoring avg</span><strong>${(124.8 - selected * 4.2).toFixed(1)} PPG</strong></div>
            <div class="evidence-chip"><span>Power delta</span><strong>${selected % 2 ? 'Down 1' : 'Up 1'}</strong></div>
          </div>
          <label>Team take for ${esc(currentTeam)}
            <textarea data-field="Team take ${esc(currentTeam)}" rows="5" placeholder="Write your weekly commentary for ${esc(currentTeam)}...">${esc(currentTake)}</textarea>
          </label>
          <div style="margin-top:12px;padding:12px;background:#fff;border:1px solid var(--line);border-radius:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <strong style="font-size:12.5px">✨ Writing assistant</strong>
              <span class="badge ready">${esc(workflowProvider)}: ${esc(workflowReadiness)}</span>
            </div>
            <p style="margin-bottom:8px">Grounded in current owned roster, completed matchups, and your ranking order. ${helpTip('Writing context & consent', 'Review which team, matchup, score, and current owned roster data is shared with your chosen assistant before generating. Suggestions remain editable.')}</p>
            <div class="actions">
              ${btn('Open writing assistant', 'writing', 'primary')}
              <button type="button" class="subtle" data-workflow="quick-roster">Inspect roster evidence</button>
            </div>
          </div>`,
        )
      : split(
          `${head(
            'Isolated Edition Preview',
            'Classic export markup and original-export.css geometry remain 100% untouched by the workspace redesign (TASK-3, TASK-17, TASK-30).',
            `<div class="actions">
              <button type="button" data-action="exportMode:original" aria-pressed="${!exportCompactMode}">Desktop Original (1304px)</button>
              <button type="button" data-action="exportMode:compact" aria-pressed="${exportCompactMode}">Mobile Compact (720px)</button>
            </div>`,
          )}${exportDocument()}`,
          `<h3>Export & publish</h3>
          <p>Download the unchanged original or compact PNG, or publish to your league link.</p>
          <div style="display:grid;gap:8px;margin-bottom:14px">
            ${btn('⬇ Export original PNG (1304px)', 'export')}
            ${btn('📱 Export compact PNG (720px)', 'export')}
            ${btn('🚀 Publish edition', 'publish', 'primary')}
            ${btn('🔗 Copy public link', 'share')}
            ${btn('Unpublish edition', 'unpublish')}
          </div>
          ${kv('Draft state', 'Saved · Revision #14')}
          ${kv('Published state', 'Edition live · Updated 10:42 AM')}
          <p style="margin-top:10px">${helpTip('Publication safeguards', 'Delayed publication requests cannot overwrite newer decisions (TASK-86). Private drafts remain separate from published editions (TASK-17).')}</p>`,
        );

  return (
    commandBar(
      'Rankings studio',
      'Set the order, write the story with adjacent roster evidence, and share this week’s edition.',
      true,
      true,
      `<span class="fresh-badge">✓ All changes saved</span>${btn(tab === 'Edit rankings' ? 'Preview & export →' : '← Back to editor', 'preview', 'primary')}`,
    ) +
    `<section class="workspace">${t}${body}</section>`
  );
}

/* ==================== 1 & 2. PLAYERS & TRADE ANALYZER ==================== */
const decisionFixture = [
  ['Jalen Hurts', 'QB', 23.1, 'Starter'],
  ['James Cook', 'RB', 16.2, 'Starter'],
  ['Breece Hall', 'RB', 0.0, 'Bye'],
  ['Justin Jefferson', 'WR', 20.4, 'Starter'],
  ['Jayden Reed', 'WR', 19.1, 'Bench'],
  ['George Kittle', 'TE', 12.3, 'Game locked'],
  ['Jordan Addison', 'WR', 13.4, 'Available'],
  ['Tyjae Spears', 'RB', 10.8, 'Available'],
  ['Garrett Wilson', 'WR', 18.3, 'Starter'],
  ['Josh Allen', 'QB', 24.4, 'Starter'],
  ['Trey McBride', 'TE', 15.2, 'Bench'],
  ['Derrick Henry', 'RB', 18.1, 'Starter'],
  ['Dalton Kincaid', 'TE', 16.0, 'Starter'],
].map(([name, pos, proj, status], id) => ({ name, pos, proj, status, id }));

const decisionRosters = [
  [0, 1, 2, 3, 4, 5],
  [8, 9, 10, 11, 6, 12],
  [1, 3, 5, 7, 9],
  [0, 2, 4, 8, 10],
  [1, 5, 9, 11],
  [0, 3, 8, 10],
];

let decisionCompare = new Set([3, 8]);
let decisionQuery = '';
let decisionPosition = '';
let decisionRange = [1, 6];
let decisionTeamIds = [0, 1];
let decisionSends = [new Set([3]), new Set([8])];
let decisionSlots = 1;
let decisionConfirmed = true;
let decisionLeague = 0;
let decisionWaiverPos = '';
let decisionCandidate = 6;
let decisionDrop = 4;
let decisionRefreshed = false;
let decisionExcluded = new Set();
let decisionDismissed = new Set();

const decisionPoints = (n) => (Number.isFinite(n) ? n.toFixed(1) : 'Unavailable');
const decisionSign = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

function playerWeeklySeries(id) {
  const p = decisionFixture[id];
  return Array.from({ length: 6 }, (_, w) => +(Math.max(4, p.proj || 14) + ((w + id) % 3 - 1) * 2.4).toFixed(1));
}

function renderPlayers() {
  const list = decisionFixture.filter(
    (p) =>
      (!decisionPosition || p.pos === decisionPosition) &&
      `${p.name} ${p.pos} ${teams[p.id % teams.length]}`.toLowerCase().includes(decisionQuery.toLowerCase()),
  );
  const compIds = [...decisionCompare];
  const weeks = [];
  for (let w = decisionRange[0]; w <= decisionRange[1]; w++) weeks.push(w);

  const matrixHtml =
    compIds.length >= 2 && decisionRange[0] <= decisionRange[1]
      ? `<div style="margin:16px 0;padding:16px;background:var(--bg);border:1px solid var(--line);border-radius:10px">
          ${head(
            'Side-by-Side Weekly Comparison Matrix',
            `Comparing ${compIds.map((id) => decisionFixture[id].name).join(' vs. ')} across Weeks ${decisionRange[0]}–${decisionRange[1]}`,
            `<button type="button" class="link" data-decision="sources">Sources & coverage</button>`,
          )}
          ${table(
            ['Player', 'Pos / Owner', 'Window Avg', 'Window Total', 'W7 Proj (Sleeper / ESPN)', ...weeks.map((w) => 'W' + w)],
            compIds.map((id) => {
              const p = decisionFixture[id];
              const allScores = playerWeeklySeries(id);
              const slice = weeks.map((w) => allScores[w - 1]);
              const tot = slice.reduce((a, b) => a + b, 0);
              return [
                `<strong>${esc(p.name)}</strong>`,
                `${p.pos} · ${p.status === 'Available' ? 'Unowned' : teams[id % teams.length]}`,
                decisionPoints(tot / slice.length),
                decisionPoints(tot),
                `${decisionPoints(p.proj)} <small>(${decisionPoints(p.proj - 0.6)} / ${decisionPoints(p.proj + 0.6)})</small>`,
                ...slice.map((v) => decisionPoints(v)),
              ];
            }),
          )}
        </div>`
      : '';

  return (
    subtoolBar() +
    commandBar(
      'Players & Comparison',
      'Search League-scored player profiles, verified unowned pool, and side-by-side weekly evidence.',
      true,
      false,
      `${btn('↻ Refresh players', 'refresh')}${btn('+ Include verified unowned pool', 'pool')}`,
    ) +
    `<section class="workspace"><div class="content">
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px">
        <label style="flex:2;min-width:200px">Find a player<input data-decision-search value="${esc(decisionQuery)}" placeholder="Search by player name, position, team, or ID..."></label>
        <label style="min-width:140px">Position<select data-decision-field="player-position"><option value="">All positions</option>${['QB', 'RB', 'WR', 'TE'].map((pos) => `<option ${decisionPosition === pos ? 'selected' : ''}>${pos}</option>`).join('')}</select></label>
        <label style="min-width:110px">First week<select data-decision-field="range-start">${[1, 2, 3, 4, 5, 6].map((w) => `<option value="${w}" ${decisionRange[0] === w ? 'selected' : ''}>Week ${w}</option>`).join('')}</select></label>
        <label style="min-width:110px">Last week<select data-decision-field="range-end">${[1, 2, 3, 4, 5, 6].map((w) => `<option value="${w}" ${decisionRange[1] === w ? 'selected' : ''}>Week ${w}</option>`).join('')}</select></label>
        <button type="button" data-decision="filters-reset">Reset filters</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:8px;max-height:240px;overflow-y:auto;padding:4px;margin-bottom:16px">
        ${list
          .map(
            (p) => `<div class="rankrow" style="margin:0;padding:8px 12px">
              <div class="team">
                <button type="button" class="link" data-decision="profile:${p.id}">${esc(p.name)}</button>
                <small style="display:block">${p.pos} · ${p.status} · ${decisionPoints(p.proj)} pts proj</small>
              </div>
              <button type="button" data-decision="compare:${p.id}" aria-pressed="${decisionCompare.has(p.id)}">${decisionCompare.has(p.id) ? '✓ Comparing' : '+ Compare'}</button>
            </div>`,
          )
          .join('')}
      </div>
      <div class="sectionhead">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h2>Selected players (${compIds.length})</h2>
          ${compIds.map((id) => `<button type="button" class="subtle" data-decision="compare:${id}">${esc(decisionFixture[id].name)} ×</button>`).join('')}
        </div>
        <button type="button" data-decision="compare-clear" ${compIds.length ? '' : 'disabled'}>Clear selection</button>
      </div>
      ${decisionRange[0] > decisionRange[1] ? '<div class="notice">Choose a first week no later than the last week.</div>' : matrixHtml}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">
        ${compIds
          .map((id) => {
            const p = decisionFixture[id];
            const scores = playerWeeklySeries(id).slice(decisionRange[0] - 1, decisionRange[1]);
            const total = scores.reduce((a, b) => a + b, 0);
            return `<article style="border:1px solid var(--line);border-radius:10px;padding:16px">
              <div class="sectionhead">
                <div><h3>${esc(p.name)}</h3><small>${p.pos} · ${p.status === 'Available' ? 'Unowned' : teams[id % teams.length]} · ${p.status}</small></div>
                <button type="button" class="subtle" data-decision="compare:${id}">Remove</button>
              </div>
              ${strip([
                ['Observed total', decisionPoints(total)],
                ['Average', decisionPoints(total / Math.max(1, scores.length))],
                ['Coverage', `${scores.length}/${scores.length} wks`],
              ])}
              ${kv('Week 7 combined projection', decisionPoints(p.proj) + ' pts')}
              ${kv('Provider split & disagreement', `Sleeper ${decisionPoints(p.proj - 0.6)} · ESPN ${decisionPoints(p.proj + 0.6)} (Δ 1.2)`)}
              ${table(['Week', 'Observed points'], scores.map((v, i) => ['Week ' + (decisionRange[0] + i), decisionPoints(v)]))}
            </article>`;
          })
          .join('')}
      </div>
    </div></section>`
  );
}

function decisionCoverage(ids) {
  return ['QB', 'RB', 'WR', 'TE'].map((pos) => `${pos} ${ids.filter((id) => decisionFixture[id].pos === pos).length}`).join(' · ');
}
function decisionBest(ids) {
  return ['QB', 'RB', 'WR', 'TE'].reduce(
    (tot, pos) => tot + Math.max(0, ...ids.filter((id) => decisionFixture[id].pos === pos).map((id) => decisionFixture[id].proj)),
    0,
  );
}
function decisionTradeSide(side) {
  const own = decisionRosters[decisionTeamIds[side]];
  const outgoing = [...decisionSends[side]];
  const incoming = [...decisionSends[1 - side]];
  const after = own.filter((id) => !outgoing.includes(id)).concat(incoming);
  return {
    own,
    outgoing,
    incoming,
    after,
    beforeScore: decisionBest(own),
    afterScore: decisionBest(after),
  };
}

function renderTrades() {
  const view = tabs(['Build a trade', 'Find trade ideas (3 mutual)']);
  if (tab.startsWith('Find trade ideas')) {
    const own = decisionRosters[decisionTeamIds[0]];
    const ideas = [
      { partner: 4, send: 4, receive: 11, g0: 1.9, g1: 17.2 },
      { partner: 1, send: 3, receive: 10, g0: 1.6, g1: 2.1 },
      { partner: 1, send: 3, receive: 12, g0: 2.4, g1: 1.3 },
    ];
    return (
      subtoolBar() +
      commandBar(
        'Trade Analyzer',
        'Discover mutually beneficial 1-for-1 exchanges or build custom multi-player scenarios.',
        true,
        false,
        `<button type="button" class="link" data-decision="sources">Sources & coverage</button>${btn('↻ Refresh rosters', 'refresh')}`,
      ) +
      `<section class="workspace">${view}<div class="content">
        ${head(
          'Mutual Trade Suggestions (Current-Week Lineup Optimization)',
          'Sorted by the smaller of both managers’ starting lineup gains so every idea helps both sides.',
          `<label style="min-width:190px">Your managed team<select data-decision-field="idea-team">${teams.map((t, i) => `<option value="${i}" ${decisionTeamIds[0] === i ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`,
        )}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px">
          ${ideas
            .map(
              (d) => `<article style="border:1px solid var(--line);border-radius:10px;padding:16px;background:#fff">
                <div class="sectionhead">
                  <h3>Partner: ${esc(teams[d.partner])}</h3>
                  <span class="badge ready">Min gain +${Math.min(d.g0, d.g1).toFixed(1)} pts</span>
                </div>
                <p style="margin-bottom:10px">You send <strong>${esc(decisionFixture[d.send].name)}</strong> (${decisionFixture[d.send].pos}) ↔ You receive <strong>${esc(decisionFixture[d.receive].name)}</strong> (${decisionFixture[d.receive].pos})</p>
                ${table(
                  ['Team', 'Before Lineup', 'After Lineup', 'Net Gain'],
                  [
                    [teams[decisionTeamIds[0]], '72.0', (72.0 + d.g0).toFixed(1), `+${d.g0.toFixed(1)} pts`],
                    [teams[d.partner], '76.8', (76.8 + d.g1).toFixed(1), `+${d.g1.toFixed(1)} pts`],
                  ],
                )}
                <p style="font-size:12px;margin:10px 0"><strong>Why it works:</strong> ${esc(decisionFixture[d.receive].name)} upgrades your starting ${decisionFixture[d.receive].pos} slot while ${esc(decisionFixture[d.send].name)} fills ${esc(teams[d.partner])}’s flex/starter gap.<br><span class="muted">Coverage: ${decisionCoverage(own)}</span></p>
                <div class="actions">
                  <button type="button" class="primary" data-decision="inspect:${d.partner}:${d.send}:${d.receive}">Inspect & edit scenario →</button>
                  <button type="button" class="link" data-decision="sources">Sources & coverage</button>
                </div>
              </article>`,
            )
            .join('')}
        </div>
        <p class="muted" style="margin-top:14px">Evaluates current-week starting lineup impact only. Questionable/doubtful, locked, and bye-week assets are excluded from discovery. Sleeper trade deadline and review period rules are respected.</p>
      </div></section>`
    );
  }

  const s0 = decisionTradeSide(0);
  const s1 = decisionTradeSide(1);
  const counts = [decisionSends[0].size, decisionSends[1].size];
  const gainSide = counts[0] === counts[1] ? -1 : counts[0] > counts[1] ? 1 : 0;
  const needed = Math.abs(counts[0] - counts[1]);
  const ready = counts[0] > 0 && counts[1] > 0 && (gainSide < 0 || (decisionSlots >= needed && decisionConfirmed));

  return (
    subtoolBar() +
    commandBar(
      'Trade Analyzer',
      'Compare two-sided legal starting lineups before and after the exchange.',
      true,
      false,
      `<button type="button" class="link" data-decision="sources">Sources & coverage</button><button type="button" data-decision="trade-reset">Reset trade</button>`,
    ) +
    `<section class="workspace">${view}<div class="content">
      <div class="trade-exchange-banner" aria-label="Unified trade exchange summary">
        <div class="trade-exchange-side">
          <small>${esc(teams[decisionTeamIds[0]])} sends (${counts[0]})</small>
          <strong style="display:block;font-size:15px;margin:4px 0">${s0.outgoing.map((id) => decisionFixture[id].name).join(', ') || 'Select player(s) below'}</strong>
          <span class="badge ${s0.afterScore - s0.beforeScore >= 0 ? 'ready' : 'down'}">Lineup impact: ${ready ? `${decisionPoints(s0.beforeScore)} → ${decisionPoints(s0.afterScore)} (${decisionSign(s0.afterScore - s0.beforeScore)} pts)` : 'Awaiting selection'}</span>
          <small style="display:block;margin-top:6px">Positional depth: ${decisionCoverage(s0.own)} → ${decisionCoverage(s0.after)}</small>
        </div>
        <div style="text-align:center;font-weight:700;color:var(--accent);font-size:18px">⇄</div>
        <div class="trade-exchange-side">
          <small>${esc(teams[decisionTeamIds[1]])} sends (${counts[1]})</small>
          <strong style="display:block;font-size:15px;margin:4px 0">${s1.outgoing.map((id) => decisionFixture[id].name).join(', ') || 'Select player(s) below'}</strong>
          <span class="badge ${s1.afterScore - s1.beforeScore >= 0 ? 'ready' : 'down'}">Lineup impact: ${ready ? `${decisionPoints(s1.beforeScore)} → ${decisionPoints(s1.afterScore)} (${decisionSign(s1.afterScore - s1.beforeScore)} pts)` : 'Awaiting selection'}</span>
          <small style="display:block;margin-top:6px">Positional depth: ${decisionCoverage(s1.own)} → ${decisionCoverage(s1.after)}</small>
        </div>
      </div>
      ${
        gainSide >= 0
          ? `<div class="notice">
              <strong>Uneven exchange: ${esc(teams[decisionTeamIds[gainSide]])} receives ${needed} extra player${needed === 1 ? '' : 's'}.</strong>
              <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:8px">
                <label style="display:inline-flex;align-items:center;gap:8px">Open roster slots available:<input type="number" min="0" style="width:72px" data-decision-field="slots" value="${decisionSlots}"></label>
                <label style="display:inline-flex;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" style="width:16px;height:16px" data-decision-field="confirm" ${decisionConfirmed ? 'checked' : ''}> I confirm ${esc(teams[decisionTeamIds[gainSide]])} has open roster capacity.</label>
              </div>
            </div>`
          : ''
      }
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px">
        ${[0, 1]
          .map((side) => {
            const d = side ? s1 : s0;
            return `<section style="border:1px solid var(--line);border-radius:10px;padding:16px">
              <div style="display:flex;gap:10px;margin-bottom:12px">
                <label style="flex:1">${side ? 'Trade partner' : 'Your team'}<select data-decision-field="trade-team-${side}">${teams
                  .map((t, i) => [i, t])
                  .filter(([i]) => i !== decisionTeamIds[1 - side])
                  .map(([i, t]) => `<option value="${i}" ${decisionTeamIds[side] === i ? 'selected' : ''}>${esc(t)}</option>`)
                  .join('')}</select></label>
                <label style="flex:1">Filter roster<input data-decision-roster="${side}" placeholder="Name or position..."></label>
              </div>
              <div>
                ${d.own
                  .map((id) => {
                    const p = decisionFixture[id];
                    return `<div class="rankrow" data-decision-row style="padding:8px 12px">
                      <div class="team">
                        <button type="button" class="link" data-decision="profile:${id}">${esc(p.name)}</button>
                        <small style="display:block">${p.pos} · <span class="badge ${p.status === 'Game locked' ? 'down' : p.status === 'Bye' ? 'bye' : 'upcoming'}">${p.status}</span> · ${decisionPoints(p.proj)} proj pts</small>
                      </div>
                      <button type="button" data-decision="send:${side}:${id}" aria-pressed="${decisionSends[side].has(id)}">${decisionSends[side].has(id) ? '✓ Sending' : 'Send'}</button>
                    </div>`;
                  })
                  .join('')}
              </div>
            </section>`;
          })
          .join('')}
      </div>
    </div></section>`
  );
}

/* ==================== 3. WEEKLY OVERVIEW ==================== */
const sampleGames = [
  { league: 'Sample league', provider: 'Sleeper', home: teams[0], away: teams[1], homeScore: 108.4, awayScore: 96.8, winPct: 64 },
  { league: 'Sample league', provider: 'Sleeper', home: teams[2], away: teams[3], homeScore: 86.2, awayScore: 92.4, winPct: 42 },
  { league: 'Sample league', provider: 'Sleeper', home: teams[4], away: teams[5], homeScore: 110.8, awayScore: 71.6, winPct: 86 },
  { league: 'Sunday league', provider: 'ESPN', home: teams[3], away: teams[4], homeScore: 94.6, awayScore: 103.2, winPct: 38 },
  { league: 'Sunday league', provider: 'ESPN', home: teams[2], away: teams[3], homeScore: 121.2, awayScore: 106.4, winPct: 72 },
  { league: 'Sunday league', provider: 'ESPN', home: teams[4], away: teams[5], homeScore: 88.4, awayScore: 90.2, winPct: 48 },
];

function renderOverview() {
  return (
    commandBar(
      'My weekly overview',
      'All your managed-league matchups side by side, with proactive lineup & waiver impact badges.',
      false,
      false,
      btn('↻ Refresh all leagues', 'refresh', 'primary'),
    ) +
    `<div class="overview-league-grid">
      ${[0, 3]
        .map((gameIdx, i) => {
          const g = sampleGames[gameIdx];
          const inlineOpen = !!overviewInlineOpen[i];
          return `<section class="workspace" aria-label="${esc(g.league)} weekly overview"><div class="content">
            ${head(g.league, 'Week 7 · Roster captured 5 minutes ago', `<span class="badge upcoming">${g.provider}</span>`)}
            ${selectCtrl('Managed team in ' + g.league, [g.home, ...teams.filter((t) => t !== g.home)])}
            ${strip([
              ['Record', i ? '3–3' : '5–1'],
              ['Power rank', i ? '#5' : '#1'],
              ['Playoff estimate', i ? '52%' : '92%'],
            ])}
            <div class="overview-matchup">
              <div>
                <small>Your team</small>
                <h3>${esc(g.home)}</h3>
                <strong>${g.homeScore.toFixed(1)}</strong>
                <small>Projected ${(g.homeScore + 24.2).toFixed(1)}</small>
              </div>
              <span class="muted">vs.</span>
              <div>
                <small>Opponent</small>
                <h3>${esc(g.away)}</h3>
                <strong>${g.awayScore.toFixed(1)}</strong>
                <small>Projected ${(g.awayScore + 27.3).toFixed(1)}</small>
              </div>
            </div>
            <div class="tug-bar-wrap">
              <div class="tug-labels">
                <span>${esc(g.home)} ${g.winPct}%</span>
                <span class="muted">Uncalibrated win estimate</span>
                <span>${100 - g.winPct}% ${esc(g.away)}</span>
              </div>
              <div class="tug-bar">
                <div class="tug-left" style="width:${g.winPct}%"></div>
                <div class="tug-right" style="width:${100 - g.winPct}%"></div>
              </div>
            </div>
            ${
              !i && !decisionDismissed.has(i)
                ? `<div class="notice">
                    <strong>⚠ Actionable Alert: Breece Hall is on Week 7 bye</strong>
                    <p style="margin:4px 0 8px">Swap in James Cook (+14.2 projected pts) before Sunday kickoff.</p>
                    <div class="actions">
                      <button type="button" class="primary" data-decision="lineup:${i}">Review in Lineup Advisor (+17.8 pts)</button>
                      <button type="button" data-decision="dismiss:${i}">Dismiss alert</button>
                    </div>
                  </div>`
                : ''
            }
            <div class="actions" style="margin:12px 0">
              <button type="button" data-decision="lineup:${i}">📋 Lineup advisor <span class="badge ready">${i ? '+3.1 pts' : '+17.8 pts'}</span></button>
              <button type="button" data-decision="waiver:${i}">➕ Waiver advisor <span class="badge upcoming">2 upgrades</span></button>
              <button type="button" data-decision="alerts:${i}">🔔 Dismissed alerts (${decisionDismissed.has(i) ? 1 : 0})</button>
              <button type="button" class="subtle" data-action="toggleOverviewInline:${i}">${inlineOpen ? 'Hide quick preview ▴' : 'Quick preview ▾'}</button>
            </div>
            ${
              inlineOpen
                ? `<div class="inline-advisor-box">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <strong style="font-size:12.5px">Quick Lineup & Waiver Preview</strong>
                      <button type="button" class="link" data-decision="lineup:${i}">Open full interactive simulator →</button>
                    </div>
                    ${table(
                      ['Type', 'Slot / Action', 'Current / Drop', 'Recommended', 'Net Impact'],
                      [
                        ['Starter swap', 'RB', 'Breece Hall (Bye · 0.0)', 'James Cook (16.2)', '+14.2 pts'],
                        ['Starter swap', 'FLEX', 'Bench WR (15.5)', 'Jayden Reed (19.1)', '+3.6 pts'],
                        ['Waiver add', 'WR depth', 'Drop bench WR', 'Jordan Addison (13.4)', '+2.2 bench lift'],
                      ],
                    )}
                  </div>`
                : ''
            }
            <div class="actions" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
              ${btn('Rankings', 'overviewGo:' + i + ':0', 'subtle')}
              ${btn('Season insights', 'overviewGo:' + i + ':5', 'subtle')}
              ${btn('Playoffs', 'overviewGo:' + i + ':6', 'subtle')}
              ${btn('Live matchup', 'overviewGo:' + i + ':4', 'subtle')}
            </div>
          </div></section>`;
        })
        .join('')}
    </div>`
  );
}

/* ==================== 4. LIVE MATCHUPS ==================== */
let highlightedGames = [0, 1, 3, 4];

function liveRoster(team, score, index, away = false) {
  const starters = away
    ? [
        ['QB', 'Josh Allen', 'LIVE Q3', 'bad'],
        ['SFLEX', 'Matthew Stafford', 'FINAL', 'final'],
        ['RB', 'Breece Hall', 'BYE', 'bye'],
        ['RB', 'Derrick Henry', 'LIVE Q3', 'bad'],
        ['WR', 'Garrett Wilson', 'FINAL', 'final'],
        ['WR', 'CeeDee Lamb', 'SUN 3:25', 'upcoming'],
        ['TE', 'Trey McBride', 'SUN 3:25', 'upcoming'],
        ['Flex', 'Puka Nacua', 'FINAL', 'final'],
        ['K', 'Jake Bates', 'FINAL', 'final'],
        ['DST', 'Las Vegas Raiders', 'SUN 3:05', 'upcoming'],
      ]
    : [
        ['QB', 'Jalen Hurts', 'LIVE Q3', 'bad'],
        ['SFLEX', 'Kyler Murray', 'SUN 3:05', 'upcoming'],
        ['RB', 'James Cook', 'LIVE Q3', 'bad'],
        ['RB', 'Kenneth Walker', 'FINAL', 'final'],
        ['WR', 'Justin Jefferson', 'FINAL', 'final'],
        ['WR', 'Ladd McConkey', 'SUN 3:05', 'upcoming'],
        ['TE', 'George Kittle', 'SUN 3:25', 'upcoming'],
        ['Flex', 'Jayden Reed', 'FINAL', 'final'],
        ['K', 'Brandon Aubrey', 'SUN 3:25', 'upcoming'],
        ['DST', 'Cincinnati Bengals', 'FINAL', 'final'],
      ];
  const bench = away
    ? [
        ['QB', 'Kirk Cousins', 'FINAL'],
        ['RB', 'Brian Robinson', 'FINAL'],
        ['RB', 'Emanuel Wilson', 'FINAL'],
        ['WR', 'RJ Harvey', 'SUN 3:05'],
        ['WR', 'Luther Burden', 'FINAL'],
        ['TE', 'Jake Ferguson', 'SUN 3:25'],
        ['K', '—', '—'],
        ['DST', '—', '—'],
      ]
    : [
        ['QB', 'Daniel Jones', 'FINAL'],
        ['RB', 'Keaton Mitchell', 'FINAL'],
        ['RB', 'Zach Charbonnet', 'FINAL'],
        ['WR', 'DeVaughn Vele', 'SUN 3:05'],
        ['WR', 'Jameson Williams', 'FINAL'],
        ['WR', 'Jordan Addison', 'FINAL'],
        ['TE', 'Dalton Kincaid', 'LIVE Q3'],
        ['DST', 'Houston Texans', 'FINAL'],
      ];

  const rows = (arr, isBench) =>
    arr
      .map(([slot, name, status], i) => {
        const pts =
          name === '—'
            ? '—'
            : status === 'BYE'
              ? '0.00'
              : Math.max(0, (isBench ? 9 : 24) - i * 1.9 - index - (away ? 2 : 0)).toFixed(2);
        return `<tr>
          <td>${slot}</td>
          <td>${name === '—' ? '—' : `<button type="button" class="link" style="font-size:11px;min-height:0" data-action="livePlayer:${esc(name)}">${esc(name)}</button>`}</td>
          <td class="live-status-col">${esc(status)}</td>
          <td>${pts}</td>
        </tr>`;
      })
      .join('');

  return `<section class="live-team-roster" aria-label="${esc(team)} roster">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
      <h3 style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(team)}</h3>
      <strong style="font-size:15px;font-variant-numeric:tabular-nums">${score.toFixed(2)}</strong>
    </div>
    <table class="dense-roster-table"><caption><span>Starters</span><span>Act</span></caption><tbody>${rows(starters, false)}</tbody></table>
    <table class="dense-roster-table"><caption><span>Bench</span><span>${(18.4 + index).toFixed(2)}</span></caption><tbody>${rows(bench, true)}</tbody></table>
  </section>`;
}

function renderLive() {
  const filter = contextValues['Show league'] ?? 'All leagues';
  return `<section class="live-review-workspace">
    <aside class="workspace live-game-picker">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <h1 style="font-size:18px">Live matchups</h1>
        ${btn('↻ Refresh', 'refresh', 'subtle')}
      </div>
      <p style="font-size:12px;font-weight:600;color:var(--accent)">${highlightedGames.length} of 4 slots active</p>
      <p class="muted" style="margin:4px 0 10px">Updated 20s ago · Auto-refreshes every 60s</p>
      ${selectCtrl('Show league', ['All leagues', 'Sample league', 'Sunday league'])}
      ${['Sample league', 'Sunday league']
        .filter((l) => filter === 'All leagues' || filter === l)
        .map(
          (l) => `<h2 style="font-size:13px;margin:12px 0 4px">${esc(l)} <small style="font-weight:400">(${l === 'Sample league' ? 'Sleeper' : 'ESPN'})</small></h2>
          ${sampleGames
            .map((g, i) =>
              g.league !== l
                ? ''
                : `<div style="margin:4px 0">
                    <button type="button" style="width:100%;justify-content:space-between;font-size:11px;padding:6px 8px;min-height:32px" data-action="highlight:${i}" aria-pressed="${highlightedGames.includes(i)}" ${highlightedGames.length === 4 && !highlightedGames.includes(i) ? 'disabled' : ''}>
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i === 0 || i === 3 ? '★ ' : ''}${esc(g.home)}</span>
                      <strong>${g.homeScore.toFixed(1)}–${g.awayScore.toFixed(1)}</strong>
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.away)}</span>
                    </button>
                  </div>`,
            )
            .join('')}`,
        )
        .join('')}
      <div style="margin-top:10px">${helpTip('Win estimate & coverage', 'Uncalibrated estimates use current scores, starters’ projections, and remaining NFL game time fractions. Select up to four matchups across leagues.')}</div>
    </aside>
    <div class="matchup-four-grid" aria-label="Four matchup sections">
      ${Array.from({ length: 4 }, (_, slot) => {
        const gIdx = highlightedGames[slot];
        if (gIdx === undefined) {
          return `<section class="matchup-quarter" style="justify-content:center;align-items:center;text-align:center;background:var(--bg)">
            <h2>Matchup slot ${slot + 1}</h2>
            <p class="muted">Select any game from the left sidebar to pin it here.</p>
          </section>`;
        }
        const g = sampleGames[gIdx];
        return `<article class="matchup-quarter" data-game="${gIdx}" aria-label="${esc(g.home)} versus ${esc(g.away)}">
          <div class="quarter-heading">
            <div style="min-width:0;flex:1">
              <div style="display:flex;align-items:center;gap:8px">
                <small>${esc(g.league)} · W7</small>
                <span class="badge ready" style="font-size:10px;padding:1px 6px">Win est: ${g.winPct}%–${100 - g.winPct}% (Uncalibrated)</span>
              </div>
              <h2>${esc(g.home)} vs. ${esc(g.away)}</h2>
            </div>
            <button type="button" class="subtle" style="min-height:26px;padding:2px 8px" data-action="highlight:${gIdx}" aria-label="Remove matchup ${esc(g.home)} versus ${esc(g.away)}">×</button>
          </div>
          <div class="quarter-rosters" tabindex="0" role="region" aria-label="${esc(g.home)} and ${esc(g.away)} rosters">
            ${liveRoster(g.home, g.homeScore, gIdx, false)}
            ${liveRoster(g.away, g.awayScore, gIdx, true)}
          </div>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

/* ==================== 5. SEASON INSIGHTS ==================== */
const analyticsState = {
  positionMode: 'Projected remaining weeks',
  positionSort: 'Total points',
  scoringTeam: 'All teams',
  former: false,
  metric: 'Make playoffs',
  cutoff: '6',
  advanced: 'Convergence',
  calibrated: true,
  calibrationRuns: 1,
  scheduleTeam: teams[0],
};

const posNames = ['RB', 'WR', 'QB', 'TE', 'K', 'DEF'];
const posPalette = ['#4b9cd3', '#2bbd7e', '#e5b822', '#8e6cef', '#e868a2', '#17b2cf'];

function tierClass(rank) {
  if (rank <= 2) return 'tier-1';
  if (rank <= 4) return 'tier-2';
  if (rank <= 5) return 'tier-3';
  return 'tier-4';
}

function renderInsights() {
  const nav = tabs([
    'Team scoring',
    'Weekly trends',
    'Roster strength',
    'Remaining schedule',
    'Manager report card',
    'Trades',
    'Pickups',
  ]);
  const selTeam = teams[selected] || teams[0];
  let mainBody = '';

  if (tab === 'Team scoring') {
    mainBody =
      head(
        'Who delivers every week?',
        'Click any team row to inspect its season profile on the right without losing your place.',
        mockCsvButton(),
      ) +
      table(
        ['Team', 'Avg. points', 'Best week', 'Above median', 'Avg. vs. proj', 'Beat proj', 'Best legal / wk', 'Start accuracy'],
        teams.map((name, i) => [
          `${btn(name, 'pick:' + i, 'link')}<small style="display:block">${esc(managers[i])}</small>`,
          (124.8 - i * 5.6).toFixed(1),
          (146.8 - i * 5).toFixed(1),
          `${Math.max(1, 5 - i)} / 6`,
          `+${(8.4 - i * 2.1).toFixed(1)}`,
          `${Math.max(1, 4 - i)} / 6`,
          (141.2 - i * 4).toFixed(1),
          `${(((48 - i) / 54) * 100).toFixed(1)}% (${48 - i}/54)`,
        ]),
        true,
      ) +
      `<p class="muted" style="margin-top:10px">Best legal lineup ${helpTip('Best legal / wk', 'Highest scoring lineup using eligible starters and bench respecting roster slots.')} · Start accuracy ${helpTip('Start accuracy', 'Actual starters retained in the best legal lineup divided by legal slots across covered weeks.')}</p>`;
  } else if (tab === 'Roster strength') {
    const completed = analyticsState.positionMode === 'Completed weeks only';
    const rows = teams.map((name, i) => ({
      name,
      i,
      points: [
        Math.round((completed ? 160 : 450) - i * 22 + ((i * 19) % 45)),
        Math.round((completed ? 185 : 580) - i * 24 + ((i * 31) % 50)),
        Math.round((completed ? 175 : 540) - i * 18 + ((i * 13) % 40)),
        Math.round((completed ? 75 : 155) - i * 8 + ((i * 7) % 20)),
        Math.round((completed ? 52 : 112) - i * 3),
        Math.round((completed ? 48 : 96) - i * 3),
      ],
    }));
    const rankOf = (r, p) => 1 + rows.filter((o) => o.points[p] > r.points[p]).length;
    const maxTotal = Math.max(...rows.map((r) => r.points.reduce((a, b) => a + b, 0)));

    mainBody =
      head(
        'Position Group Rankings & Roster Projections',
        completed
          ? 'Actual starters through Week 6, grouped by primary position.'
          : 'Rest-of-season best legal projected lineups (Weeks 7–14) with tier-colored rankings.',
        mockCsvButton(),
      ) +
      `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <label>Scoring window<select data-analytics-select="positionMode"><option ${!completed ? 'selected' : ''}>Projected remaining weeks</option><option ${completed ? 'selected' : ''}>Completed weeks only</option></select></label>
        <label>Sort by<select data-analytics-select="positionSort">${['Total points', ...posNames.map((p) => p + ' strength')].map((o) => `<option ${analyticsState.positionSort === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      </div>` +
      table(
        ['Team', ...posNames],
        rows.map((r, idx) => [
          `${btn(r.name, 'pick:' + idx, 'link')}`,
          ...r.points.map((val, p) => {
            const rk = rankOf(r, p);
            return `<span class="tier-pill ${tierClass(rk)}"><strong>#${rk}</strong><small>${val} pts</small></span>`;
          }),
        ]),
        true,
      ) +
      `<div style="margin-top:22px">
        ${head(completed ? 'Completed Position Totals' : 'Remaining Roster Projections', 'Rest-of-season projected points by position group (with 0–2200 scale)')}
        <ul class="analytics-legend">${posNames.map((p, i) => `<li><span style="background:${posPalette[i]}"></span><strong>${p}</strong></li>`).join('')}</ul>
        ${rows
          .map((r) => {
            const tot = r.points.reduce((a, b) => a + b, 0);
            return `<div class="analytics-stack-row">
              <strong>${esc(r.name)}</strong>
              <div class="analytics-stack" style="width:${((tot / Math.max(2200, maxTotal)) * 100).toFixed(1)}%">
                ${r.points.map((val, i) => `<span style="flex:${val};background:${posPalette[i]}" title="${posNames[i]}: ${val} pts">${val}</span>`).join('')}
              </div>
              <strong style="text-align:right">${tot} pts</strong>
            </div>`;
          })
          .join('')}
        <div class="stack-axis"><span>0</span><span>400</span><span>800</span><span>1200</span><span>1600</span><span>2000</span><span>2200</span></div>
      </div>`;
  } else if (tab === 'Weekly trends') {
    mainBody =
      head('Weekly scoring & exact lineup accuracy', 'Filter by team or inspect all completed weeks.', mockCsvButton()) +
      `<div style="margin-bottom:12px"><label style="max-width:240px">Team filter<select data-analytics-select="scoringTeam">${['All teams', ...teams].map((t) => `<option ${analyticsState.scoringTeam === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label></div>` +
      table(
        ['Team', 'Week', 'Actual pts', 'Projected pts', 'Diff', 'Best legal lineup', 'Missed pts', 'Start accuracy'],
        teams.slice(0, 3).flatMap((name, i) =>
          [1, 2, 3].map((w) => {
            const act = 125 - i * 4 + w * 3;
            const proj = 121 - i * 3 + w * 2;
            const best = act + 6;
            return [name, w, act.toFixed(1), proj.toFixed(1), `+${(act - proj).toFixed(1)}`, best.toFixed(1), '6.0', '88.9% (8/9)'];
          }),
        ),
      );
  } else if (tab === 'Remaining schedule') {
    mainBody =
      head('Remaining schedule difficulty (Weeks 7–14)', 'Average opponent strength minus league baseline (lower is easier).', mockCsvButton()) +
      table(
        ['Team', 'Easiest rank', 'Difficulty (pts/wk)', 'Measured weeks', 'Historical fallback'],
        teams.map((name, i) => [name, `#${i + 1}`, (i * 3.2 - 8).toFixed(1), '8 / 8', '0 weeks']),
      );
  } else if (tab === 'Manager report card') {
    const mgrs = analyticsState.former ? [...managers, 'Morgan Patel (former)'] : managers;
    mainBody =
      head(
        'Manager Report Card',
        'Scoring, trade value, pickup lift, and start accuracy across covered weeks.',
        `<label style="display:inline-flex;align-items:center;gap:6px;color:var(--ink)"><input type="checkbox" style="width:16px;height:16px" data-analytics-select="former" ${analyticsState.former ? 'checked' : ''}> Include former managers</label>` + mockCsvButton(),
      ) +
      table(
        ['Manager', 'Weeks', 'Avg vs median', 'Trade val/wk', 'Graded trades', 'Pickup lift/start', 'Start accuracy'],
        mgrs.map((m, i) => [m, i === 6 ? '3/6' : '6/6', `+${(12.8 - i * 3.1).toFixed(1)}`, i < 4 ? `+${(5.2 - i).toFixed(1)}` : 'Unavailable', Math.max(0, 4 - i), `+${(6.4 - i * 0.8).toFixed(1)}`, `${88 - i * 2}%`]),
      );
  } else if (tab === 'Trades') {
    mainBody =
      head('Evaluated League Trades', 'Equal four-week post-trade scoring windows.', mockCsvButton()) +
      table(
        ['Exchange', 'Scoring leader', 'Window', 'Evidence'],
        [
          ['Jefferson for Hall', teams[0], 'Weeks 3–6', btn('View comparison', 'tradeEvidence', 'link')],
          ['Wilson for Reed', 'Too close to call', 'Weeks 4–6', btn('View comparison', 'tradeEvidence', 'link')],
        ],
      );
  } else {
    mainBody =
      head('Waiver Pickup Value', 'Retained starts compared against positional median starter baselines.', mockCsvButton()) +
      table(
        ['Pickup', 'Team', 'Added Wk', 'Baseline', 'Player PPG', 'Baseline PPG', 'Lift / start', 'Retained starts'],
        [
          ['Jayden Reed', teams[0], 'W3', 'WR median starter', '16.2', '9.8', '+6.4', '3'],
          ['Jordan Addison', teams[2], 'W4', 'WR median starter', '14.0', '9.8', '+4.2', '2'],
        ],
      );
  }

  return (
    commandBar(
      'Season insights',
      'Scoring, tier-colored positional strength, schedule difficulty, and manager report cards.',
      true,
      false,
      `${btn('↻ Refresh report', 'refresh')}${btn('🔗 Share report', 'share')}${btn('⬇ Export report', 'export')}`,
    ) +
    `<section class="workspace">
      ${nav}
      ${split(
        mainBody,
        `<small>Selected team inspector</small>
        <h3>${esc(selTeam)}</h3>
        <p>Context stays pinned beside every Season Insights view.</p>
        ${kv('Manager', esc(managers[selected] || managers[0]))}
        ${kv('Record & Rank', `${Math.max(0, 5 - selected)}–${selected + 1} (#${selected + 1})`)}
        ${kv('Points scored / wk', (124.8 - selected * 5.6).toFixed(1) + ' pts')}
        ${kv('Best legal lineup / wk', (141.2 - selected * 4).toFixed(1) + ' pts')}
        ${kv('Weighted start accuracy', `${(((48 - selected) / 54) * 100).toFixed(1)}%`)}
        ${kv('Remaining schedule rank', `#${selected + 1} (${(selected * 3.2 - 8).toFixed(1)} pts/wk)`)}
        <div class="actions" style="margin-top:12px">
          <button type="button" class="subtle" data-action="jumpWeeklyTrends">Open in Weekly trends →</button>
        </div>`,
      )}
    </section>`
  );
}

/* ==================== 6. PLAYOFF SIMULATION ==================== */
function renderPlayoffs() {
  const nav = tabs(['Forecast table', 'Week-by-week chart', 'Advanced']);
  const selTeam = teams[selected] || teams[0];
  let mainBody = '';

  if (tab === 'Forecast table') {
    const cutoff = Number(analyticsState.cutoff);
    mainBody =
      head(
        'The Playoff Field (20,000 Markov & Monte Carlo Trials)',
        'Qualification, bye, and round-by-round advancement from the selected cutoff week.',
        `<div class="actions">
          <label style="display:inline-flex;align-items:center;gap:6px">Cutoff<select data-analytics-select="cutoff">${['6', '5', '4', '3', '2', '1'].map((w) => `<option value="${w}" ${analyticsState.cutoff === w ? 'selected' : ''}>Through Week ${w}</option>`).join('')}</select></label>
          <button type="button" data-action="playoffMode:table" aria-pressed="${!playoffHistogramMode}">📊 Table view</button>
          <button type="button" data-action="playoffMode:hist" aria-pressed="${playoffHistogramMode}">📈 Histogram mode (TASK-69)</button>
          ${mockCsvButton()}
        </div>`,
      ) +
      (cutoff < 3
        ? `<div class="notice"><strong>Early-season uncertainty disclaimer (TASK-42):</strong> Only ${cutoff} completed week(s) of scoring data. Forecasts have wide variance early in the season.</div>`
        : '');

    if (playoffHistogramMode) {
      mainBody += `<div class="histogram-grid" aria-label="Simulated win and seed histograms">
        ${teams
          .map((name, i) => {
            const dist = [4, 12, 26, 32, 18, 8].map((v, idx) => Math.max(2, v + (idx - i) * 3));
            const maxD = Math.max(...dist);
            return `<article class="histogram-card">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${esc(name)}</strong>
                <span class="badge ready">${[92, 86, 72, 58, 32, 14][i]}% playoffs</span>
              </div>
              <small class="muted">Projected wins distribution (mean ${(9.6 - i * 0.8).toFixed(1)} wins)</small>
              <div class="hist-bars">
                ${dist
                  .map(
                    (pct, bIdx) => `<div class="hist-col">
                      <small>${pct}%</small>
                      <div class="hist-col-bar" style="height:${Math.round((pct / maxD) * 76)}px"></div>
                      <small>${7 + bIdx}W</small>
                    </div>`,
                  )
                  .join('')}
              </div>
              <small class="muted">Bye: ${[44, 30, 16, 8, 2, 0][i]}% · Title: ${[26, 22, 19, 16, 11, 6][i]}%</small>
            </article>`;
          })
          .join('')}
      </div>`;
    } else {
      mainBody += table(
        ['Team', 'Proj. record', 'Make playoffs', 'Earn bye', 'Reach semifinal', 'Reach final', 'Win title'],
        teams.map((name, i) => {
          const pPlayoff = [92, 86, 72, 58, 32, 14][i];
          return [
            `${btn(name, 'pick:' + i, 'link')}<small style="display:block">${esc(managers[i])}</small>`,
            `${(9.6 - i * 0.8).toFixed(1)}–${(4.4 + i * 0.8).toFixed(1)}`,
            `<strong>${pPlayoff}%</strong>`,
            `${[44, 30, 16, 8, 2, 0][i]}%`,
            `${[68, 58, 47, 40, 25, 12][i]}%`,
            `${[45, 39, 34, 29, 20, 10][i]}%`,
            `<strong>${[26, 22, 19, 16, 11, 6][i]}%</strong>`,
          ];
        }),
        true,
      );
    }

    mainBody += `<details style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
      <summary style="font-weight:600">Weekly legal-lineup projection coverage (140 / 140 team-weeks)</summary>
      <div style="margin-top:10px">
        ${table(
          ['Team', 'Week 7 slots covered', 'Bench replacements optimized', 'Fallback'],
          teams.map((name, i) => [name, '9 / 9 legal slots', `${i % 3} bye/injury cover`, 'None (100% provider coverage)']),
        )}
      </div>
    </details>`;
  } else if (tab === 'Week-by-week chart') {
    mainBody =
      head(
        'Week-by-Week Forecast Evolution',
        'Historical as-of cutoffs showing how qualification & title odds moved each week.',
        `<label style="display:inline-flex;align-items:center;gap:6px">Metric<select data-analytics-select="metric">${['Make playoffs', 'Earn bye', 'Reach semifinal', 'Win title'].map((m) => `<option ${analyticsState.metric === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>` + mockCsvButton(),
      ) +
      table(
        ['Cutoff Week', ...teams],
        [1, 2, 3, 4, 5, 6].map((w) => ['Week ' + w, ...teams.map((_, i) => `${Math.max(5, [92, 86, 72, 58, 32, 14][i] - (6 - w) * 3)}%`)]),
      );
  } else {
    mainBody =
      head(
        'Advanced Model Calibration & Diagnostics (TASK-73, TASK-74, TASK-75)',
        'Historical out-of-sample Brier & log-loss evaluation against Standings and Equal-Chance benchmarks.',
        `<button type="button" data-analytics="calibrate">↻ Rerun calibration</button><button type="button" class="primary" data-analytics="json">⬇ Export calibration replay JSON</button>`,
      ) +
      `<div class="actions" style="margin-bottom:14px">
        ${['Convergence', 'Weekly diagnostics', 'Season comparisons', 'Reliability', 'Final seeding']
          .map((v) => `<button type="button" data-analytics="advanced:${v}" aria-pressed="${analyticsState.advanced === v}">${v}</button>`)
          .join('')}
      </div>` +
      table(
        ['Cutoff Week', 'Model Brier', 'Standings Brier', 'Equal-Chance Brier', 'Model Log Loss', 'Qualification Accuracy', 'Sample'],
        [1, 2, 3, 4, 5, 6].map((w, i) => [
          'Week ' + w,
          (0.22 - i * 0.02).toFixed(3),
          (0.24 - i * 0.015).toFixed(3),
          '0.250',
          (0.66 - i * 0.035).toFixed(3),
          `${68 + i * 4}%`,
          '42 team-weeks',
        ]),
      );
  }

  return (
    commandBar(
      'Playoff simulator',
      'Best legal weekly lineup simulations, round-by-round odds, histogram distributions, and model calibration.',
      true,
      false,
      `${btn('🔗 Share report', 'share')}${btn('⬇ Export report', 'export')}`,
    ) +
    `<section class="workspace">
      ${nav}
      ${split(
        mainBody,
        `<small>Selected team path</small>
        <h3>${esc(selTeam)}</h3>
        <p>Forecasts are simulation estimates, not official clinching claims.</p>
        ${kv('Current record', `${Math.max(0, 5 - selected)}–${selected + 1}`)}
        ${kv('Projected final wins', `${(9.6 - selected * 0.8).toFixed(1)} wins`)}
        ${kv('Playoff qualification', `${[92, 86, 72, 58, 32, 14][selected]}%`)}
        ${kv('First-round bye (Top 2)', `${[44, 30, 16, 8, 2, 0][selected]}%`)}
        ${kv('Win championship', `${[26, 22, 19, 16, 11, 6][selected]}%`)}
        ${kv('Bracket & tiebreaker', '6 teams · 2 byes · Total PF')}
        <p style="margin-top:10px">${helpTip('Simulation methodology', 'Uses 20,000 trials in a background worker with each week’s best legal projected lineup (starters + bench) and known NFL byes.')}</p>`,
      )}
    </section>`
  );
}

/* ==================== 7, 8, 9. LEAGUES, CONNECT, PROFILE ==================== */
let workflowArchive = false;

function renderLeagues() {
  return (
    commandBar(
      'Manage leagues',
      'Configure league names, per-season managed teams, provider IDs, and archive state.',
      false,
      false,
      `<button type="button" data-workflow="archive-view">${workflowArchive ? 'Show active leagues' : 'Show archived leagues'}</button>${btn('+ Connect league', 'go:8', 'primary')}`,
    ) +
    `<section class="workspace">${split(
      `${head(workflowArchive ? 'Archived leagues' : 'Connected active leagues', 'Select a league to edit its connection or managed team.')}
      ${table(
        ['League', 'Provider', 'Season', 'Managed Team', 'Action'],
        [
          ['Sample league', 'Sleeper', '2025', 'Sunday Strategists', btn('Manage', 'pick:0', 'link')],
          ['Sunday league', 'ESPN', '2025', 'Red Zone Regulars', btn('Manage', 'pick:1', 'link')],
        ],
        true,
      )}`,
      `<h3>${selected ? 'Sunday league (ESPN)' : 'Sample league (Sleeper)'}</h3>
      <p>Changes invalidate stale provider caches automatically (TASK-85).</p>
      <div style="display:grid;gap:10px">
        ${selectCtrl('Managed-team season', ['2025', '2024', '2023'])}
        ${selectCtrl('Managed team', ['Sunday Strategists', ...teams.slice(1), 'No team / commissioner'])}
        <div class="actions">
          <button type="button" class="primary" data-workflow="managed-save">Save managed team</button>
          <button type="button" data-workflow="managed-clear">Clear</button>
        </div>
        <hr style="border:0;border-top:1px solid var(--line);margin:6px 0">
        ${fieldCtrl('League name', selected ? 'Sunday league' : 'Sample league')}
        ${fieldCtrl('Provider league ID', selected ? '1140768' : '1312529175982129152')}
        <div class="actions">
          ${btn('Save changes', 'save', 'primary')}
          ${btn('ESPN cookies', 'espn')}
          <button type="button" data-workflow="archive">${workflowArchive ? 'Restore league' : 'Archive league'}</button>
          ${btn('Delete permanently', 'removeLeague')}
        </div>
      </div>`,
    )}</section>`
  );
}

function renderConnect() {
  const t = tabs(['Sleeper', 'ESPN']);
  return (
    commandBar('Connect a league', 'Add a Sleeper or ESPN league with power-based initial rankings.', false, false) +
    `<section class="workspace">${t}${split(
      `<div style="max-width:560px;display:grid;gap:14px">
        ${head('Connect ' + tab + ' League', 'Enter your league ID and season.')}
        ${fieldCtrl('Provider league ID', '')}
        ${fieldCtrl('League name', '')}
        ${selectCtrl('Season', ['2025', '2024', '2023'])}
        <p class="muted">${tab === 'Sleeper' ? 'Find the numeric ID after /leagues/ in your Sleeper URL.' : 'Find leagueId in your ESPN URL. Private leagues use saved ESPN cookies.'}</p>
        <div class="actions">
          ${btn('Cancel', 'go:7')}
          ${tab === 'ESPN' ? btn('Configure ESPN cookies', 'espn') : ''}
          ${btn('Connect league', 'connected', 'primary')}
        </div>
      </div>`,
      `<h3>Guided Setup (TASK-31, TASK-63)</h3>
      <p>When connected, Rankings Studio suggests an initial order based on team power rather than raw win-loss record.</p>
      ${kv('Initial ranking order', 'Power-based baseline')}
      ${kv('Form state preservation', 'Retained across ESPN cookie setup')}`,
    )}</section>`
  );
}

function renderProfile() {
  const t = tabs(['Profile details', 'Writing connections', 'ESPN settings']);
  let body = '';
  if (tab === 'Profile details') {
    body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:var(--bg);border-radius:8px;margin-bottom:14px">
      <div><small>Verified Email</small><strong style="display:block">alex@example.com <span class="badge ready">✓ Verified</span></strong></div>
      <div><small>Auth0 Identity</small><strong style="display:block">auth0|sample-alex</strong></div>
    </div>
    <div style="display:grid;gap:12px;max-width:520px">
      ${fieldCtrl('Name', 'Alex Morgan')}
      ${fieldCtrl('Nickname', 'Alex')}
      <div class="actions">
        <button type="button" class="primary" data-workflow="profile-save">Save profile</button>
        <button type="button" data-workflow="password">Reset password via Auth0</button>
      </div>
    </div>`;
  } else if (tab === 'Writing connections') {
    body = `<div style="padding:12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;margin-bottom:14px">
      <strong>Server-managed Codex: Ready (CLI verified)</strong>
      <p class="muted" style="margin-top:4px">Operator-enabled accounts share server quota. A saved personal OpenAI API key takes precedence (TASK-70, TASK-97).</p>
      <div class="actions" style="margin-top:8px">
        <button type="button" data-workflow="profile-readiness">↻ Refresh readiness</button>
        <button type="button" data-workflow="setup">Operator setup instructions</button>
      </div>
    </div>
    <div style="display:grid;gap:12px;max-width:520px">
      ${kv('OpenAI API key', 'Saved · Takes precedence over server login')}
      ${fieldCtrl('Replace OpenAI API key', '', 'password')}
      <div class="actions"><button type="button" data-workflow="key-save">Save OpenAI key</button><button type="button" data-workflow="key-remove">Remove OpenAI key</button></div>
      ${kv('Anthropic API key', 'Saved · Encrypted per user')}
      ${fieldCtrl('Replace Anthropic API key', '', 'password')}
      <div class="actions"><button type="button" data-workflow="key-save">Save Anthropic key</button><button type="button" data-workflow="key-remove">Remove Anthropic key</button></div>
    </div>`;
  } else {
    body = `<div style="display:grid;gap:12px;max-width:520px">
      <p class="muted">Private ESPN leagues use encrypted, account-scoped cookies (TASK-6).</p>
      ${fieldCtrl('espn_s2', '', 'password')}
      ${fieldCtrl('SWID', '', 'password')}
      <div class="actions">
        <button type="button" class="primary" data-workflow="key-save">Save ESPN cookies</button>
        <button type="button" data-workflow="key-remove">Remove cookies</button>
        <button type="button" data-workflow="espn-help">How to find cookies</button>
      </div>
    </div>`;
  }
  return (
    commandBar('Your profile & connections', 'Manage identity, writing assistant credentials, and private ESPN cookies.', false, false) +
    `<section class="workspace">${t}${split(body, `<h3>Security & privacy</h3><p>Saved keys and cookies are encrypted at rest and never returned to the browser after saving.</p>${btn('Manage connected leagues →', 'go:7')}`)}</section>`
  );
}

/* ==================== 10. LEAGUE HISTORY (MANAGER EXPLORER) ==================== */
const historyGroups = {
  Competition: ['Rivalries', 'Schedule & luck', 'Elo', 'Playoffs'],
  Seasons: ['Season results', 'Manager comparison', 'Achievements'],
  Moments: ['Monday miracles', 'Probability replay', 'Draft skill', 'Dropped breakouts', 'Lineup regrets', 'Trade impact', 'Trade network', 'Archive tools'],
  Profile: ['Activity', 'Player impact', 'Player loyalty', 'Draft overlap', 'Archetypes', 'Wrapped'],
  'League archive': ['Hall of Fame', 'Hall of Shame', 'Eras', 'Record book', 'Pain Index'],
};

let hState = {
  group: 'Competition',
  view: 'Rivalries',
  manager: 0,
  compareManager: 1,
  years: ['2025', '2024', '2023'],
  focusYear: '2025',
  matrix: false,
  wrappedScope: 'Personal recap',
  evidenceTitle: 'Alex Morgan vs. Blair Davis — All-Time Rivalry',
  evidenceBody: '2023–2025 (9 games): Alex leads 6–3–0 (66.7%), 1,044.0 PF vs 873.0 PA (+19.0 avg margin). Most recent: 2025 W6 Alex 128.4 – Blair 112.6.',
};

function renderHistory() {
  const mgrName = managers[hState.manager];
  const groupNames = Object.keys(historyGroups);
  const subViews = historyGroups[hState.group] || [];
  if (!subViews.includes(hState.view)) hState.view = subViews[0];

  let viewHtml = '';
  if (hState.view === 'Wrapped') {
    viewHtml = `<div style="background:linear-gradient(135deg,#17223b 0%,#283868 100%);color:#fff;border-radius:12px;padding:22px;margin:10px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <span class="badge upcoming">✨ Fantasy Wrapped · ${esc(hState.focusYear)}</span>
          <h2 style="color:#fff;margin-top:6px">${esc(hState.wrappedScope === 'Personal recap' ? mgrName + ' · Sunday Strategists' : 'Sample League 2025 Season Recap')}</h2>
        </div>
        <div class="actions">
          <button type="button" data-h-scope="Personal recap" aria-pressed="${hState.wrappedScope === 'Personal recap'}">Personal recap</button>
          <button type="button" data-h-scope="League recap" aria-pressed="${hState.wrappedScope === 'League recap'}">League recap</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px">
        <div style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px"><small style="color:#cbd5e1">Season Record & Seed</small><strong style="display:block;font-size:18px;margin-top:4px">10–6 · #1 Seed</strong></div>
        <div style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px"><small style="color:#cbd5e1">Expected Wins & Luck</small><strong style="display:block;font-size:18px;margin-top:4px">8.6 Exp (+1.4 Luck)</strong></div>
        <div style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px"><small style="color:#cbd5e1">Guardian Angel Player</small><strong style="display:block;font-size:18px;margin-top:4px">Josh Allen (33.6 W8)</strong></div>
        <div style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px"><small style="color:#cbd5e1">Manager Archetype</small><strong style="display:block;font-size:18px;margin-top:4px">Patient Builder (88.4% Acc)</strong></div>
      </div>
    </div>
    <div class="actions" style="margin-top:12px">
      ${btn('🔗 Create immutable Wrapped snapshot', 'share', 'primary')}
      ${mockCsvButton('Export recap CSV')}
    </div>`;
  } else {
    viewHtml =
      `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div><h2>${esc(hState.view)}</h2><p class="muted">Click any row to update the Record Evidence inspector on the right.</p></div>
        <div class="actions">
          ${hState.view === 'Rivalries' ? `<button type="button" data-h-action="toggleMatrix">${hState.matrix ? 'Show list view' : 'Show H2H matrix'}</button>` : ''}
          ${mockCsvButton('Export visible CSV')}
        </div>
      </div>` +
      table(
        ['Manager / Matchup', 'Record / Value', 'Games / Sample', 'Win % / Share', 'Points For', 'Points Against', 'Assessment', 'Evidence'],
        managers
          .filter((_, i) => i !== hState.manager)
          .map((opp, idx) => [
            `<strong>${esc(opp)}</strong>`,
            idx % 2 === 0 ? '6–3–0' : '3–6–0',
            '9 games',
            idx % 2 === 0 ? '66.7%' : '33.3%',
            (1044 - idx * 28).toFixed(1),
            (873 + idx * 35).toFixed(1),
            `<span class="badge ${idx % 2 === 0 ? 'ready' : 'down'}">${idx % 2 === 0 ? 'Punching bag' : 'Kryptonite'}</span>`,
            `<button type="button" class="link" data-h-evidence="${esc(mgrName + ' vs. ' + opp)}">Inspect 9 games →</button>`,
          ]),
      );
  }

  return (
    commandBar(
      'League history — Manager Explorer',
      'All-time rivalries, expected wins, Elo, Hall of Fame/Shame, moments, archetypes, and Fantasy Wrapped.',
      true,
      false,
      `${btn('🔗 Share history report', 'share')}`,
    ) +
    `<section class="workspace">
      <div class="identity">
        <span class="avatar">${mgrName
          .split(' ')
          .map((s) => s[0])
          .join('')}</span>
        <div>
          <h2>${esc(mgrName)}</h2>
          <small>Focused manager context preserved across all 23 history views (TASK-145)</small>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-left:16px">
          <label>Manager<select data-h-mgr>${managers.map((m, i) => `<option value="${i}" ${hState.manager === i ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
          <label>Focused Year<select data-h-year>${['2025', '2024', '2023'].map((y) => `<option ${hState.focusYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        </div>
        <div class="stats">
          <div><span>All-Time Record</span><strong>24–24–0</strong></div>
          <div><span>Win Rate</span><strong>50.0%</strong></div>
          <div><span>Elo Rating</span><strong>1532</strong></div>
        </div>
      </div>
      <div class="tabs" role="tablist" aria-label="History groups">
        ${groupNames.map((g) => `<button type="button" data-h-group="${esc(g)}" aria-pressed="${hState.group === g}">${esc(g)}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 20px;background:#f6f8fd;border-bottom:1px solid var(--line)">
        ${subViews.map((v) => `<button type="button" class="subtle" data-h-view="${esc(v)}" aria-pressed="${hState.view === v}">${esc(v)}</button>`).join('')}
      </div>
      ${split(
        viewHtml,
        `<small>Auto-populated record evidence</small>
        <h3>${esc(hState.evidenceTitle)}</h3>
        <p>${esc(hState.evidenceBody)}</p>
        ${kv('Selected manager', esc(mgrName))}
        ${kv('Included seasons', '2025, 2024, 2023 (48 games)')}
        ${kv('Bracket verification', '3 of 3 championship brackets verified')}
        <div style="margin-top:12px">
          <button type="button" class="subtle" data-action="go:5">Open 2025 Season Insights ↗</button>
        </div>`,
      )}
    </section>`
  );
}

/* ==================== 11. OTHER TOOLS DIRECTORY ==================== */
function renderOtherTools() {
  return (
    subtoolBar() +
    commandBar('Other tools', 'Direct access to Player Research & Comparison and the two-sided Trade Analyzer.', true, false) +
    `<div class="overview-league-grid">
      <section class="workspace"><div class="content">
        <span class="badge upcoming">Player Research & Provenance</span>
        <h2 style="margin:8px 0 4px">Players & Side-by-Side Comparison</h2>
        <p class="muted" style="margin-bottom:14px">Search owned and verified unowned players, filter by week range, inspect Sleeper + ESPN combined projections, and compare weekly scores side by side.</p>
        ${strip([
          ['Currently comparing', `${decisionCompare.size} players`],
          ['Pool coverage', '13 / 13 fixture players'],
        ])}
        ${btn('Open Players & Comparison →', 'go:1', 'primary')}
      </div></section>
      <section class="workspace"><div class="content">
        <span class="badge ready">Lineup Optimization</span>
        <h2 style="margin:8px 0 4px">Trade Analyzer & Mutual Trade Ideas</h2>
        <p class="muted" style="margin-bottom:14px">Discover mutually beneficial 1-for-1 exchanges for your saved team or evaluate custom multi-player trades with before/after legal lineup impact.</p>
        ${strip([
          ['Mutual trade ideas', '3 scenarios ready'],
          ['Active draft trade', `${decisionSends[0].size} ↔ ${decisionSends[1].size} selected`],
        ])}
        ${btn('Open Trade Analyzer →', 'go:2', 'primary')}
      </div></section>
    </div>`
  );
}

/* ==================== MAIN RENDER & EVENT DELEGATION ==================== */
function render() {
  document.body.classList.toggle('live-review', page === 4);
  const navActive = [1, 2].includes(page) ? 11 : page;
  $('#nav').innerHTML = primaryNavIndices
    .map(
      (idx) =>
        `<button type="button" data-page="${idx}" ${navActive === idx ? 'aria-current="page"' : ''}>${esc(screens[idx])}</button>`,
    )
    .join('');

  if (state !== 'Ready') {
    $('#main').innerHTML = `<section class="workspace" style="padding:56px 24px;text-align:center">
      <h2>${state === 'Loading' ? 'Loading multi-season data (Season 2 of 3)…' : state === 'Empty' ? 'No data available for this selection' : 'Partial refresh failure — retaining last verified data'}</h2>
      ${state === 'Loading' ? '<div style="max-width:360px;height:10px;background:#dce2ee;border-radius:999px;margin:14px auto;overflow:hidden"><div style="width:66%;height:100%;background:var(--accent)"></div></div>' : ''}
      <p class="muted" style="margin:10px auto 18px">Preview state selector is active. Production preserves cached results during refresh failures (TASK-27, TASK-39).</p>
      ${btn('Return to Ready state', 'readyState', 'primary')}
    </section>`;
    return;
  }

  const views = [
    renderRankings,
    renderPlayers,
    renderTrades,
    renderOverview,
    renderLive,
    renderInsights,
    renderPlayoffs,
    renderLeagues,
    renderConnect,
    renderProfile,
    renderHistory,
    renderOtherTools,
  ];
  $('#main').className = page === 4 ? 'live-mockup' : '';
  $('#main').innerHTML = (page === 4 ? '' : uxCalloutForPage()) + views[page]();
}

document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-page]');
  if (navBtn) {
    page = Number(navBtn.dataset.page);
    tab = '';
    location.hash = encodeURIComponent(screens[page]);
    $('#account-menu')?.removeAttribute('open');
    render();
    return;
  }

  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    render();
    return;
  }

  const hGroup = e.target.closest('[data-h-group]');
  if (hGroup) {
    hState.group = hGroup.dataset.hGroup;
    hState.view = historyGroups[hState.group][0];
    render();
    return;
  }

  const hView = e.target.closest('[data-h-view]');
  if (hView) {
    hState.view = hView.dataset.hView;
    render();
    return;
  }

  const hScope = e.target.closest('[data-h-scope]');
  if (hScope) {
    hState.wrappedScope = hScope.dataset.hScope;
    render();
    return;
  }

  const hEv = e.target.closest('[data-h-evidence]');
  if (hEv) {
    hState.evidenceTitle = hEv.dataset.hEvidence + ' — Matchup Breakdown';
    hState.evidenceBody = 'Verified completed-season series across 2023–2025: 9 matchups, 100% starter coverage, including 2025 W6 (128.4–112.6).';
    render();
    toast('Updated Record Evidence inspector.');
    return;
  }

  const hAct = e.target.closest('[data-h-action]');
  if (hAct && hAct.dataset.hAction === 'toggleMatrix') {
    hState.matrix = !hState.matrix;
    render();
    return;
  }

  const helpBtn = e.target.closest('[data-help]');
  if (helpBtn) {
    const wrap = helpBtn.closest('.help-tip');
    const isOpen = !wrap.classList.contains('help-open');
    document.querySelectorAll('.help-open').forEach((x) => x.classList.remove('help-open'));
    wrap.classList.toggle('help-open', isOpen);
    return;
  }
  if (!e.target.closest('.help-tip')) {
    document.querySelectorAll('.help-open').forEach((x) => x.classList.remove('help-open'));
  }

  const csvBtn = e.target.closest('[data-sample-csv]');
  if (csvBtn) {
    saveSampleFile('trapp-sample-export.csv', 'Team,Value\r\n"Sunday Strategists","124.8"\r\n');
    toast('Sample CSV downloaded.');
    return;
  }

  const wfBtn = e.target.closest('[data-workflow]');
  if (wfBtn) {
    const wf = wfBtn.dataset.workflow;
    if (wf === 'undo' && workflowUndo) {
      order = [...workflowUndo];
      workflowUndo = null;
      render();
      toast('Ranking move undone.');
    } else if (wf === 'save-ranking') {
      toast('Rankings saved. Autosave and conflict checks active.');
    } else if (wf === 'draft') {
      modal(
        'Draft Recovery & Save Conflict Resolution (TASK-15, TASK-16)',
        `<p>Local drafts are protected across reloads. If another editor saves a newer edition, compare both versions before choosing:</p>
        ${table(
          ['Version', 'Timestamp', 'Order preview'],
          [
            ['Local unsaved draft', 'Just now', order.slice(0, 3).join(', ') + '…'],
            ['Server saved revision #14', '10:42 AM', teams.slice(0, 3).join(', ') + '…'],
          ],
        )}
        <div class="actions" style="margin-top:14px">
          <button type="button" class="primary" onclick="document.querySelector('#dialog').close()">Keep local version</button>
          <button type="button" onclick="document.querySelector('#dialog').close()">Use server version</button>
        </div>`,
      );
    } else if (wf === 'quick-roster') {
      modal(
        'Current Owned Roster Evidence (TASK-13.3)',
        `<p class="muted">Sample league · Week 7 · Only currently owned players are used to ground depth commentary.</p>
        ${table(
          ['Slot', 'Starter', 'Bench option', 'Combined projection'],
          [
            ['QB', 'Jalen Hurts (23.1)', 'Daniel Jones (9.0)', 'Sleeper + ESPN'],
            ['RB', 'James Cook (16.2)', 'Zach Charbonnet (5.2)', 'Sleeper + ESPN'],
            ['WR', 'Justin Jefferson (20.4)', 'Jayden Reed (19.1)', 'Sleeper + ESPN'],
          ],
        )}`,
      );
    } else if (wf === 'archive-view' || wf === 'archive') {
      workflowArchive = !workflowArchive;
      render();
      toast(workflowArchive ? 'Viewing archived leagues.' : 'Viewing active leagues.');
    } else {
      toast('Action completed in mockup preview.');
    }
    return;
  }

  const decBtn = e.target.closest('[data-decision]');
  if (decBtn) {
    const [act, a, b, c] = decBtn.dataset.decision.split(':');
    if (act === 'compare') {
      decisionCompare.has(+a) ? decisionCompare.delete(+a) : decisionCompare.add(+a);
      render();
    } else if (act === 'compare-clear') {
      decisionCompare.clear();
      render();
    } else if (act === 'filters-reset') {
      decisionQuery = '';
      decisionPosition = '';
      render();
    } else if (act === 'send') {
      decisionSends[+a].has(+b) ? decisionSends[+a].delete(+b) : decisionSends[+a].add(+b);
      render();
    } else if (act === 'trade-reset') {
      decisionSends = [new Set(), new Set()];
      render();
    } else if (act === 'inspect') {
      decisionTeamIds = [decisionTeamIds[0], +a];
      decisionSends = [new Set([+b]), new Set([+c])];
      tab = 'Build a trade';
      render();
      toast('Prefilled editable trade scenario.');
    } else if (act === 'sources') {
      modal(
        'Projection Sources & Coverage (TASK-99)',
        `<p>Sleeper and ESPN weekly projections are combined under the selected league’s scoring rules. Missing inputs stay unavailable rather than zero (TASK-112).</p>
        ${table(
          ['Provider', 'Coverage', 'Freshness'],
          [
            ['Sleeper', '13 of 13 fixture players', 'Updated 5 mins ago'],
            ['ESPN', '13 of 13 fixture players', 'Updated 5 mins ago'],
          ],
        )}`,
      );
    } else if (act === 'profile') {
      const p = decisionFixture[+a];
      modal(
        `${p.name} (${p.pos}) — Player Profile`,
        `${kv('Status', p.status)}${kv('Week 7 Projection', decisionPoints(p.proj) + ' pts')}${kv('Sleeper / ESPN Split', `${decisionPoints(p.proj - 0.6)} / ${decisionPoints(p.proj + 0.6)}`)}`,
      );
    } else if (act === 'lineup' || act === 'waiver') {
      modal(
        act === 'lineup' ? 'Interactive Lineup Advisor (TASK-91)' : 'Interactive Waiver Advisor (TASK-92)',
        act === 'lineup'
          ? `<p>Full legal lineup optimization respecting game locks and player exclusions.</p>
            ${strip([
              ['Submitted lineup', '108.4 pts'],
              ['Optimal legal lineup', '126.2 pts'],
              ['Net gain', '+17.8 pts'],
            ])}
            ${table(
              ['Slot', 'Current Starter', 'Recommended Starter', 'Delta'],
              [
                ['RB', 'Breece Hall (Bye · 0.0)', 'James Cook (16.2)', '+14.2 pts'],
                ['FLEX', 'Bench WR (15.5)', 'Jayden Reed (19.1)', '+3.6 pts'],
              ],
            )}`
          : `<p>Verified unowned candidates compared against unlocked roster drops.</p>
            ${table(
              ['Unowned Candidate', 'Pos', 'Proj', 'Suggested Drop', 'Lineup / Bench Impact'],
              [
                ['Jordan Addison', 'WR', '13.4 pts', 'DeVaughn Vele', '+2.2 pts flex depth'],
                ['Tyjae Spears', 'RB', '10.8 pts', 'Keaton Mitchell', 'Week 7 bye cover'],
              ],
            )}`,
      );
    } else if (act === 'dismiss') {
      decisionDismissed.add(+a);
      render();
      toast('Alert dismissed for this team.');
    } else if (act === 'alerts') {
      modal(
        'Dismissed Alerts (TASK-95)',
        decisionDismissed.has(+a)
          ? `<p>Breece Hall · Week 7 bye</p><button type="button" class="primary" data-decision="restore:${a}">Restore alert</button>`
          : '<p>No dismissed alerts for this managed team.</p>',
      );
    } else if (act === 'restore') {
      decisionDismissed.delete(+a);
      $('#dialog').close();
      render();
    }
    return;
  }

  const anBtn = e.target.closest('[data-analytics]');
  if (anBtn) {
    const [act, val] = anBtn.dataset.analytics.split(':');
    if (act === 'advanced') {
      analyticsState.advanced = val;
      render();
    } else if (act === 'calibrate') {
      analyticsState.calibrationRuns++;
      render();
      toast('Sample historical calibration rerun complete.');
    } else if (act === 'json') {
      saveSampleFile('playoff-calibration-replay.json', JSON.stringify({ sample: true, runs: analyticsState.calibrationRuns }, null, 2), 'application/json');
      toast('Calibration replay JSON downloaded.');
    }
    return;
  }

  const actBtn = e.target.closest('[data-action]');
  if (!actBtn) return;
  const [act, a, b] = actBtn.dataset.action.split(':');
  if (act === 'hideUxNotes') {
    showUxNotes = false;
    $('#ux-toggle').checked = false;
    render();
  } else if (act === 'toggleOpening') {
    openingCollapsed = !openingCollapsed;
    render();
  } else if (act === 'pick') {
    selected = Number(a);
    render();
  } else if (act === 'up' || act === 'down') {
    const idx = Number(a);
    const next = act === 'up' ? idx - 1 : idx + 1;
    if (next >= 0 && next < order.length) {
      workflowUndo = [...order];
      const [moved] = order.splice(idx, 1);
      order.splice(next, 0, moved);
      selected = next;
      render();
    }
  } else if (act === 'preview') {
    tab = tab === 'Edit rankings' ? 'Preview & export' : 'Edit rankings';
    render();
  } else if (act === 'exportMode') {
    exportCompactMode = a === 'compact';
    render();
  } else if (act === 'playoffMode') {
    playoffHistogramMode = a === 'hist';
    render();
  } else if (act === 'jumpWeeklyTrends') {
    analyticsState.scoringTeam = teams[selected] || teams[0];
    tab = 'Weekly trends';
    render();
  } else if (act === 'toggleOverviewInline') {
    overviewInlineOpen[+a] = !overviewInlineOpen[+a];
    render();
  } else if (act === 'highlight') {
    const gIdx = Number(a);
    if (highlightedGames.includes(gIdx)) {
      highlightedGames = highlightedGames.filter((x) => x !== gIdx);
    } else if (highlightedGames.length < 4) {
      highlightedGames.push(gIdx);
    }
    render();
  } else if (act === 'go') {
    page = Number(a);
    tab = '';
    render();
  } else if (act === 'overviewGo') {
    contextValues.League = Number(a) ? 'Sunday league' : 'Sample league';
    page = Number(b);
    tab = '';
    render();
  } else if (act === 'writing') {
    modal(
      'Writing Assistant (TASK-13, TASK-13.1–13.3)',
      `<div style="display:grid;gap:12px">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <label style="flex:1">Provider<select><option>Codex (Server-managed · Ready)</option><option>Claude</option></select></label>
          <label style="flex:1">Model<input value="${esc(workflowModel)}"></label>
        </div>
        <div style="padding:10px;background:var(--good-bg);color:var(--good);border-radius:6px">
          <strong>✓ Context sharing approved for Codex</strong> · Uses current Week 7 owned roster and completed scores.
        </div>
        <label>Suggested team take for ${esc(order[selected])}
          <textarea id="modal-take-suggestion" rows="4">Another strong scoring week keeps ${esc(order[selected])} firmly in top-seed contention. Their RB depth chart gives them a high floor heading into Week 8.</textarea>
        </label>
        <div class="actions">
          <button type="button" class="primary" data-action="applySuggestion">Apply to team take</button>
        </div>
      </div>`,
    );
  } else if (act === 'applySuggestion') {
    const val = $('#modal-take-suggestion')?.value;
    if (val) draftValues['Team take ' + order[selected]] = val;
    $('#dialog').close();
    render();
    toast('Applied suggestion to team take.');
  } else if (act === 'copy') {
    modal(
      'Copy Content from Previous Edition (TASK-23)',
      `<p>Independently choose which fields to copy from 2025 · Week 6. Unmatched teams stay preserved.</p>
      <div style="display:grid;gap:8px;margin:12px 0">
        <label style="display:flex;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" checked style="width:16px;height:16px"> Copy team ranking order</label>
        <label style="display:flex;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" checked style="width:16px;height:16px"> Copy team commentary</label>
        <label style="display:flex;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" style="width:16px;height:16px"> Copy opening take</label>
      </div>
      <button type="button" class="primary" onclick="document.querySelector('#dialog').close()">Confirm copy</button>`,
    );
  } else if (act === 'revision') {
    modal(
      'Revision History (TASK-19, TASK-83)',
      `${table(
        ['Revision', 'Saved at', 'Summary', 'Action'],
        [
          ['#14 (Current)', 'Today 10:42 AM', '6 teams · 4 takes ready', 'Active'],
          ['#13', 'Today 10:26 AM', 'Initial power-based order', '<button type="button" class="link" onclick="document.querySelector(\'#dialog\').close()">Restore as #15</button>'],
        ],
      )}`,
    );
  } else if (act === 'shortcuts') {
    modal(
      'Keyboard Shortcuts (TASK-33)',
      table(
        ['Shortcut', 'Action'],
        [
          ['Space / Enter', 'Lift or drop focused team row'],
          ['Arrow Up / Down', 'Move lifted team up or down'],
          ['Escape', 'Cancel keyboard reorder and restore position'],
        ],
      ),
    );
  } else if (act === 'share') {
    modal(
      'Share Public Report & Frozen Snapshots (TASK-1, TASK-54)',
      `<p>Create a live report link or a frozen 10-day ESPN snapshot (never exposes private cookies).</p>
      <div class="actions" style="margin-top:12px">
        <button type="button" class="primary" onclick="document.querySelector('#dialog').close()">Copy public report link</button>
        <button type="button" onclick="document.querySelector('#dialog').close()">Create frozen snapshot</button>
        <button type="button" onclick="document.querySelector('#dialog').close()">Revoke public access</button>
      </div>`,
    );
  } else if (act === 'livePlayer') {
    modal(`${a} — Live Player Status`, `<p>Week 7 live stats, remaining game-time fraction, and league scoring breakdown for <strong>${esc(a)}</strong>.</p>`);
  } else if (act === 'readyState') {
    state = 'Ready';
    $('#state').value = 'Ready';
    render();
  } else {
    toast('Action triggered in mockup preview.');
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'state') {
    state = e.target.value;
    render();
    return;
  }
  if (e.target.id === 'ux-toggle') {
    showUxNotes = e.target.checked;
    render();
    return;
  }
  if (e.target.hasAttribute('data-h-mgr')) {
    hState.manager = Number(e.target.value);
    render();
    return;
  }
  if (e.target.hasAttribute('data-h-year')) {
    hState.focusYear = e.target.value;
    render();
    return;
  }
  const f = e.target.dataset.field;
  if (f) {
    if (['League', 'Season', 'Week', 'Show league'].includes(f)) {
      contextValues[f] = e.target.value;
      render();
    } else {
      draftValues[f] = e.target.value;
    }
    return;
  }
  const an = e.target.dataset.analyticsSelect;
  if (an) {
    analyticsState[an] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    render();
    return;
  }
  const dec = e.target.dataset.decisionField;
  if (dec) {
    if (dec === 'player-position') decisionPosition = e.target.value;
    if (dec === 'range-start') decisionRange[0] = Number(e.target.value);
    if (dec === 'range-end') decisionRange[1] = Number(e.target.value);
    if (dec === 'idea-team') decisionTeamIds[0] = Number(e.target.value);
    if (dec.startsWith('trade-team-')) decisionTeamIds[Number(dec.slice(-1))] = Number(e.target.value);
    if (dec === 'slots') decisionSlots = Math.max(0, Number(e.target.value));
    if (dec === 'confirm') decisionConfirmed = e.target.checked;
    render();
  }
});

document.addEventListener('input', (e) => {
  const f = e.target.dataset.field;
  if (f) {
    draftValues[f] = e.target.value;
  }
  if (e.target.hasAttribute('data-decision-search')) {
    decisionQuery = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const inp = $('[data-decision-search]');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(pos, pos);
    }
  }
  if (e.target.hasAttribute('data-decision-roster')) {
    const q = e.target.value.toLowerCase();
    e.target
      .closest('section')
      .querySelectorAll('[data-decision-row]')
      .forEach((r) => {
        r.hidden = !r.textContent.toLowerCase().includes(q);
      });
  }
});

function positionHelp(trigger) {
  const content = trigger.closest('.help-tip')?.querySelector('.help-content');
  if (!content) return;
  const rect = trigger.getBoundingClientRect();
  content.style.left = Math.max(12, Math.min(rect.left, innerWidth - 334)) + 'px';
  content.style.top = Math.max(12, Math.min(rect.bottom + 6, innerHeight - content.offsetHeight - 12)) + 'px';
}
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest('[data-help]');
  if (t) positionHelp(t);
});
document.addEventListener('focusin', (e) => {
  const t = e.target.closest('[data-help]');
  if (t) positionHelp(t);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('#account-menu')?.removeAttribute('open');
    document.querySelectorAll('.help-open').forEach((x) => x.classList.remove('help-open'));
  }
});
$('#close')?.addEventListener('click', () => $('#dialog').close());
