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
const teams = [
    'Sunday Strategists',
    'Fourth & Forever',
    'The Waiver Wire',
    'Red Zone Regulars',
    'Bench Mob',
    'Goal Line Stand',
  ],
  managers = [
    'Alex Morgan',
    'Blair Davis',
    'Casey Brooks',
    'Devon Lee',
    'Jordan Ellis',
    'Taylor Reed',
  ],
  players = ['Justin Jefferson', 'Ja’Marr Chase', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Puka Nacua'];
const contextValues = {};
const draftValues = {};
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
let page = Math.max(0, screens.indexOf(decodeURIComponent(location.hash.slice(1)))),
  tab = '',
  selected = 0,
  state = 'Ready',
  order = [...teams],
  compared = new Set([0, 1]),
  sent = [new Set([0]), new Set([1])];
const btn = (t, a = '', c = '') => `<button class="${c}" data-action="${a}">${t}</button>`;
const field = (l, v = '', type = 'text') =>
  `<label>${l}<input data-field="${esc(l)}" type="${type}" value="${esc(draftValues[l] ?? v)}"></label>`;
const select = (l, opts) =>
  `<label>${l}<select aria-label="${esc(l)}" data-field="${esc(l)}">${opts.map((o) => `<option ${contextValues[l] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
const kv = (l, v) => `<div class="kv"><span>${l}</span><strong>${v}</strong></div>`;
const detail = (t, b) => helpTip(t, b);
const tabs = (names) => {
  if (!names.includes(tab)) tab = names[0];
  return `<div class="tabs" aria-label="${screens[page]} views">${names.map((n) => `<button data-tab="${n}" aria-pressed="${n === tab}">${n}</button>`).join('')}</div>`;
};
const heading = (h, p, a = '') =>
  `<div class="heading"><div><h1>${h}</h1><p>${p}</p></div><div class="actions">${a}</div></div>`;
const head = (h, p, a = '') =>
  `<div class="sectionhead"><div><h2>${h}</h2><p>${p}</p></div>${a}</div>`;
const context = (week = false) =>
  `<section class="context" aria-label="League context">${select('League', ['Sample league', 'Sunday league'])}${select('Season', ['2025', '2024', '2023'])}${week ? select('Week', ['7', '6', '5', '4']) : ''}<span class="fresh good">✓ ${page === 4 ? 'Sample scores updated 20 seconds ago' : 'Sample data through week 6'}</span></section>`;
const identity = (n, sub, stats) =>
  `<div class="identity"><span class="avatar">${n
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join(
      '',
    )}</span><div><h2>${n}</h2><small>${sub}</small></div><div class="stats">${stats.map(([l, v]) => `<div><span>${l}</span><strong>${v}</strong></div>`).join('')}</div></div>`;
const strip = (rows) =>
  `<div class="summary-strip">${rows.map(([l, v, s]) => `<div><span>${l}</span><strong>${v}</strong><small>${s || ''}</small></div>`).join('')}</div>`;
const split = (b, a) =>
  `<div class="split"><section class="content">${b}</section><aside class="aside">${a}</aside></div>`;
const table = (heads, rows) =>
  `<div class="table-wrap"><table><thead><tr>${heads.map((h, i) => `<th scope="col" class="${i ? 'num' : ''}"><button class="link" data-action="sort:${i}" aria-label="Sort by ${h}">${h}</button></th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr class="${i === selected ? 'selected' : ''}">${r.map((c, j) => `<td class="${j ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const chart = (l = 'Weekly scoring') =>
  `<svg class="trend" viewBox="0 0 660 160" role="img" aria-label="${l}: illustrative series across six completed weeks"><path d="M35 25H640 M35 65H640 M35 105H640" stroke="#dce2ee"/><text x="0" y="29">150</text><text x="0" y="69">100</text><text x="7" y="109">50</text><path d="M45 80L160 48L275 65L390 22L505 41L630 29" fill="none" stroke="#3949ab" stroke-width="3"/><path d="M45 97L160 71L275 49L390 80L505 55L630 60" fill="none" stroke="#176b50" stroke-width="2" stroke-dasharray="5 4"/>${[1, 2, 3, 4, 5, 6].map((n, i) => `<text x="${40 + i * 117}" y="145">W${n}</text>`).join('')}</svg>`;
const method = detail(
  'How this is calculated',
  'Only available, completed scoring weeks are included. Missing data stays unavailable, never zero. This concept uses illustrative data; existing calculations and coverage rules remain unchanged.',
);
const scoreboard = () =>
  `<div class="scoreboard"><div><h3>${teams[0]}</h3><strong>108.4</strong><small>Projected 132.6</small></div><span class="muted">vs.</span><div><h3>${teams[1]}</h3><strong>96.8</strong><small>Projected 124.1</small></div></div>`;
const sampleGames = Array.from({ length: 6 }, (_, i) => ({
  league: i < 3 ? 'Sample league' : 'Sunday league',
  home: teams[i === 3 ? 3 : (i * 2) % 6],
  away: teams[i === 3 ? 4 : (i * 2 + 1) % 6],
  homeScore: [108.4, 86.2, 110.8, 94.6, 121.2, 88.4][i],
  awayScore: [96.8, 92.4, 71.6, 103.2, 106.4, 90.2][i],
}));
let highlightedGames = [0, 1, 3, 4];
function exportDocument() {
  const content = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="original-export.css"><style>body{margin:0}*{box-sizing:border-box}</style></head><body><div class="ranking-preview"><h2 class="export-title">${esc(draftValues['Edition title'] ?? 'Week 7: The contenders emerge')}</h2><p class="export-introduction">${esc(draftValues['Opening take'] ?? 'Six weeks in, the standings are finally separating.')}</p><table class="export-table"><colgroup><col class="export-rank-column"><col class="export-team-column"><col class="export-trend-column"><col class="export-comments-column"></colgroup><thead><tr><th>Rank</th><th>Team / Record</th><th>Trending</th><th>Comments</th></tr></thead><tbody>${order.map((n, i) => `<tr><td class="export-rank"><span class="export-rank-circle ${i < Math.ceil(order.length / 2) ? 'top-half' : 'bottom-half'}">${i + 1}</span></td><td><div class="export-team-name">${esc(n)}</div><div class="export-team-details"><span>${managers[teams.indexOf(n)]}</span><span>${Math.max(0, 5 - i)}-${i + 1}</span></div></td><td class="export-trend"><div class="export-movement ${i % 2 ? 'down' : 'up'}">${i % 2 ? '▼' : '▲'} 1</div><div class="export-last-week">Last Week: ${i + 2}</div></td><td class="export-comments">${esc(draftValues['Team take ' + n] ?? (i === 0 ? 'The most complete team in the league right now.' : 'A new week and another chance to climb.'))}</td></tr>`).join('')}</tbody></table></div></body></html>`;
  return `<div class="original-export-host"><iframe class="original-export" title="Original rankings export preview" srcdoc="${esc(content)}"></iframe></div>`;
}
function rankings() {
  let t = tabs(['Edit rankings', 'Preview & export']);
  let body =
    tab === 'Edit rankings'
      ? split(
          `<div class="fieldstack">${field('Edition title', 'Week 7: The contenders emerge')}<label>Opening take<textarea data-field="Opening take">${esc(draftValues['Opening take'] ?? 'Six weeks in, the standings are finally separating. Here’s who has earned their place.')}</textarea></label></div><div style="height:22px"></div>${head('Team order', 'Select a team to write its take. Use the arrows to change its rank.')}${order.map((n, i) => `<div class="rankrow ${i === selected ? 'selected' : ''}"><span class="rank">${i + 1}</span><div class="team">${btn(n, 'pick:' + i, 'link')}<small>${Math.max(0, 5 - i)}–${i + 1} · ${i === 0 ? 'Take ready' : 'Add or edit take'}</small></div><div class="move"><button data-action="up:${i}" aria-label="Move ${n} up" ${i === 0 ? 'disabled' : ''}>↑</button><button data-action="down:${i}" aria-label="Move ${n} down" ${i === order.length - 1 ? 'disabled' : ''}>↓</button></div></div>`).join('')}${detail('Edition tools', 'Copy an earlier edition, restore a saved revision, or review shortcuts.')}<div class="actions">${btn('Copy edition', 'copy')}${btn('Revision history', 'revision')}${btn('Keyboard shortcuts', 'shortcuts')}</div>`,
          `<small>Writing for rank ${selected + 1}</small><h3>${order[selected]}</h3><p>Keep the matchup context beside your take.</p>${kv('Last week', 'Won 128.4–112.6')}${kv('Points per week', '124.8')}${kv('Power rank change', 'Up 1 place')}<label style="margin-top:18px">Team take<textarea data-field="Team take ${esc(order[selected])}">${esc(draftValues['Team take ' + order[selected]] ?? 'The most complete team in the league right now. Another convincing win keeps them at the top.')}</textarea></label><div style="margin-top:12px">${btn('Writing assistant', 'writing')}</div>${detail('Writing context & consent', 'Review which team, matchup, score, and ranking information is shared with your chosen assistant before generating. Suggestions remain editable.')}<p>No writing request is sent in this mockup.</p>`,
        )
      : split(
          `${head('Edition preview', 'Original export layout and colors, unchanged by the workspace redesign.')}${exportDocument()}`,
          `<h3>Export & share</h3><p>Original and compact image layouts stay available.</p><div class="fieldstack">${btn('Export original PNG', 'export')}${btn('Export compact PNG', 'export')}${btn('Publish edition', 'publish', 'primary')}${btn('Copy public link', 'share')}${btn('Unpublish edition', 'unpublish')}</div>${detail('Publication status', 'Review the saved revision before publishing. Existing public links and unpublishing behavior are preserved.')}`,
        );
  return (
    heading(
      'Rankings studio',
      'Set the order. Write the story. Share this week’s edition.',
      `<span class="good">✓ All changes saved</span>${btn('Preview & export', 'preview', 'primary')}`,
    ) +
    context(true) +
    `<section class="workspace">${t}${body}</section>`
  );
}
function playerPage() {
  let t = tabs(['Player profile', 'Compare players']);
  return (
    heading(
      'Players',
      'Find a player, inspect the weekly evidence, and compare like for like.',
      btn('Refresh players', 'refresh'),
    ) +
    context() +
    `<section class="workspace">${identity(
      players[selected] || players[0],
      'Wide receiver · Sample roster',
      [
        ['Avg. points', '19.8'],
        ['Starts', '6'],
        ['Position rank', '3'],
      ],
    )}${t}${split(
      `${head(tab, tab === 'Player profile' ? 'Search by name or position, then select a player.' : 'Keep selected players while adjusting the scoring window.')}<div class="tools"><label>Find a player<input id="search" placeholder="Search players"></label>${select('Position', ['All positions', 'WR', 'RB', 'QB', 'TE'])}</div>${tab === 'Compare players' ? `<div class="league-list">${[...compared].map((i) => btn(players[i] + ' ×', 'compare:' + i)).join('')}</div>` : ''}${table(
        ['Player', 'Avg. points', 'Total', 'Compare'],
        players.map((p, i) => [
          `${btn(p, 'pick:' + i, 'link')}<small>WR · ${teams[i]}</small>`,
          (19.8 - i * 1.2).toFixed(1),
          (118.8 - i * 7.2).toFixed(1),
          `<button data-action="compare:${i}" aria-pressed="${compared.has(i)}" aria-label="${compared.has(i) ? 'Remove' : 'Add'} ${p} ${compared.has(i) ? 'from' : 'to'} comparison">${compared.has(i) ? '✓ Added' : '+ Add'}</button>`,
        ]),
      )}${tab === 'Compare players' ? chart('Player scoring comparison') : ''}${btn('Include verified unowned pool', 'pool')}${method}`,
      `<h3>${tab === 'Compare players' ? 'Comparison window' : players[selected] || players[0]}</h3><p>Weekly scoring stays close to the profile and comparison controls.</p><div class="fieldstack">${select('From week', ['1', '2', '3'])}${select('Through week', ['6', '5', '4'])}</div>${chart()}${kv('Ownership', 'Sunday Strategists')}${kv('Status / bye', 'Available / No')}${kv('Week 7 projection', '20.4 pts')}${kv('Best week', '28.6 pts')}${kv('Lowest week', '11.2 pts')}${kv('Available weeks', '6 of 6')}${detail('Exact weekly scores', 'Week 1: 17.4 • Week 2: 23.1 • Week 3: 19.2 • Week 4: 28.6 • Week 5: 11.2 • Week 6: 19.3.')}`,
    )}</section>`
  );
}
function trades() {
  let t = tabs(['Build a trade', 'Find trade ideas']);
  let rosters = `${head('Build a trade', 'Choose teams and the players each would send.', btn('Reset trade', 'reset'))}<div class="twocol">${[0, 1].map((s) => `<section class="roster">${select(s ? 'Trade partner' : 'Your team', s ? [teams[1], teams[2]] : [teams[0], teams[3]])}${strip([['Sends', sent[s].size + (sent[s].size === 1 ? ' player' : ' players'), 'Projected lineup ' + (s ? '+2.1' : '+3.4') + ' pts']])}<label>Find a player<input data-roster="${s}" placeholder="Search roster"></label>${(s ? ['Breece Hall', 'Garrett Wilson', 'Trey McBride', 'Josh Allen'] : players.slice(0, 4)).map((p, i) => `<div class="rankrow"><div class="team"><strong>${p}</strong><small>${s ? ['RB', 'WR', 'TE', 'QB'][i] : 'WR'} · ${(18 - i * 2.1).toFixed(1)} projected pts</small></div><button data-action="send:${s}:${i}" aria-pressed="${sent[s].has(i)}" aria-label="${sent[s].has(i) ? 'Remove' : 'Send'} ${p}">${sent[s].has(i) ? 'Remove' : 'Send'}</button></div>`).join('')}</section>`).join('')}</div>`;
  return (
    heading(
      'Trade analyzer',
      'Compare the exchange and what it changes in each lineup.',
      btn('Refresh rosters', 'refresh'),
    ) +
    context() +
    `<section class="workspace">${t}${split(
      tab === 'Build a trade'
        ? rosters
        : `${head('Find trade ideas', 'Start with roster needs, then inspect an editable scenario.')}${select('Your team', teams)}${table(
            ['Trade partner', 'You send', 'You receive', 'Scenario'],
            teams
              .slice(1, 4)
              .map((n, i) => [
                n,
                players[i],
                ['Breece Hall', 'Garrett Wilson', 'Trey McBride'][i],
                btn('Inspect trade', 'scenario', 'link'),
              ]),
          )}`,
      `<h3>Lineup impact</h3><p>Compare starters before and after the exchange, including open roster slots.</p>${kv(teams[0], '+3.4 pts')}${kv(teams[1], '+2.1 pts')}${field('Open roster slots', '1', 'number')}${detail('Before & after starters', 'Inspect which starter changes in each lineup, with original and new projected points. Existing eligibility and replacement calculations remain in place.')}${detail('Projection source & limits', 'Uses current weekly projections and the selected roster snapshot. Missing projections stay unavailable. Draft picks, FAAB, and long-term dynasty value are excluded.')}`,
    )}</section>`
  );
}
function overview() {
  return (
    heading(
      'My weekly overview',
      'All your matchups, across your leagues. Open advice within each team.',
      btn('Refresh all leagues', 'refresh'),
    ) +
    `<div class="overview-league-grid">${[0, 3]
      .map((gameIndex, i) => {
        const g = sampleGames[gameIndex];
        return `<section class="workspace overview-league" aria-label="${g.league} weekly overview"><div class="content">${head(g.league, 'Week 7 · Sample roster captured 5 minutes ago', `<span class="pill">${i ? 'ESPN' : 'Sleeper'}</span>`)}${select('Managed team in ' + g.league, [g.home, ...teams.filter((t) => t !== g.home)])}${strip(
          [
            ['Record', i ? '3–3' : '5–1'],
            ['Power rank', i ? '5' : '1'],
            ['Playoff estimate', i ? '52%' : '92%'],
          ],
        )}<div class="overview-matchup"><div><small>Your team</small><h3>${g.home}</h3><strong>${g.homeScore.toFixed(1)}</strong><small>Projected ${(g.homeScore + 24.2).toFixed(1)}</small></div><span class="muted">vs.</span><div><small>Opponent</small><h3>${g.away}</h3><strong>${g.awayScore.toFixed(1)}</strong><small>Projected ${(g.awayScore + 27.3).toFixed(1)}</small></div></div>${i ? '' : `<div class="notice"><strong>Breece Hall is on bye</strong>Review your RB slot before kickoff.<div class="actions" style="margin-top:8px">${btn('Review lineup', 'lineup:' + i)}${btn('Dismiss alert', 'dismiss')}</div></div>`}<details id="overview-lineup-${i}"><summary>Lineup advisor</summary>${table(
          ['Slot', 'Current starter', 'Suggestion', 'Gain'],
          [
            ['RB', 'Breece Hall · Bye', 'James Cook', '+14.2'],
            ['Flex', 'Bench receiver', 'Jayden Reed', '+3.6'],
          ],
        )}<p>Suggestions retain roster eligibility, locks, freshness, and missing projections.</p></details><details><summary>Waiver advisor</summary>${table(
          ['Available player', 'Position', 'Projection', 'Roster fit'],
          [
            ['Jordan Addison', 'WR', '13.4', 'Flex depth'],
            ['Tyjae Spears', 'RB', '10.8', 'Bye cover'],
          ],
        )}<p>Coverage and roster-capacity limits remain visible.</p></details><details><summary>Dismissed alerts</summary><p>Restore this team’s dismissed alerts.</p>${btn('Restore alerts', 'restore')}</details><div class="actions" style="margin-top:16px">${btn('Rankings', 'overviewGo:' + i + ':0')}${btn('Season insights', 'overviewGo:' + i + ':5')}${btn('Playoffs', 'overviewGo:' + i + ':6')}${btn('Live matchup', 'overviewGo:' + i + ':4')}</div><p class="muted" style="margin-top:14px">Playoff estimates are not calibrated odds.</p></div></section>`;
      })
      .join('')}</div>`
  );
}
function liveRoster(team, score, index, away = false) {
  const starters = away
    ? [
        ['QB', 'Josh Allen'],
        ['SFLEX', 'Matthew Stafford'],
        ['RB', 'Breece Hall'],
        ['RB', 'Derrick Henry'],
        ['WR', 'Garrett Wilson'],
        ['WR', 'CeeDee Lamb'],
        ['TE', 'Trey McBride'],
        ['Flex', 'Puka Nacua'],
        ['K', 'Jake Bates'],
        ['DST', 'Las Vegas Raiders'],
      ]
    : [
        ['QB', 'Jalen Hurts'],
        ['SFLEX', 'Kyler Murray'],
        ['RB', 'James Cook'],
        ['RB', 'Kenneth Walker'],
        ['WR', 'Justin Jefferson'],
        ['WR', 'Ladd McConkey'],
        ['TE', 'George Kittle'],
        ['Flex', 'Jayden Reed'],
        ['K', 'Brandon Aubrey'],
        ['DST', 'Cincinnati Bengals'],
      ];
  const bench = away
    ? [
        ['QB', 'Kirk Cousins'],
        ['RB', 'Brian Robinson'],
        ['RB', 'Emanuel Wilson'],
        ['WR', 'RJ Harvey'],
        ['WR', 'Luther Burden'],
        ['TE', 'Jake Ferguson'],
        ['K', '—'],
        ['DST', '—'],
      ]
    : [
        ['QB', 'Daniel Jones'],
        ['RB', 'Keaton Mitchell'],
        ['RB', 'Zach Charbonnet'],
        ['WR', 'DeVaughn Vele'],
        ['WR', 'Jameson Williams'],
        ['WR', 'Jordan Addison'],
        ['TE', 'Dalton Kincaid'],
        ['DST', 'Houston Texans'],
      ];
  const rows = (players, isBench) =>
    players
      .map(([slot, name], i) => {
        const points =
          name === '—'
            ? '—'
            : Math.max(0, (isBench ? 9 : 24) - i * 1.9 - index - (away ? 2 : 0)).toFixed(2);
        return `<tr><td class="roster-position">${slot}</td><td>${name === '—' ? '—' : `<button class="roster-player" data-action="livePlayer:${name}" aria-label="View ${name} player profile">${name}</button>`}</td><td class="roster-points">${points}</td></tr>`;
      })
      .join('');
  return `<section class="live-team-roster" aria-label="${team} roster"><div class="live-team-total"><h3>${team}</h3><strong>${score.toFixed(2)}</strong></div><table class="dense-roster-table"><caption>Starters</caption><tbody>${rows(starters, false)}</tbody></table><table class="dense-roster-table"><caption><span>Bench</span><span>${(18.4 + index).toFixed(2)}</span></caption><tbody>${rows(bench, true)}</tbody></table></section>`;
}
function matchupQuarter(index) {
  const g = sampleGames[index];
  return `<article class="matchup-quarter" data-game="${index}" aria-label="${g.home} versus ${g.away}"><div class="quarter-heading"><div class="quarter-game-title"><small>${g.league} · Week 7</small><h2>${g.home} vs. ${g.away}</h2></div><div class="quarter-win"><span>Estimated win chance</span><strong>${[64, 42, 86, 38, 72, 48][index]}%</strong><small>Uncalibrated</small></div><button data-action="highlight:${index}" aria-label="Remove matchup ${g.home} versus ${g.away}">×</button></div><div class="quarter-rosters" tabindex="0" role="region" aria-label="${g.home} and ${g.away} starters and bench">${liveRoster(g.home, g.homeScore, index)}${liveRoster(g.away, g.awayScore, index, true)}</div></article>`;
}
function live() {
  const filter = contextValues['Show league'] ?? 'All leagues';
  return `<section class="live-review-workspace"><aside class="workspace live-game-picker"><div class="content"><div class="live-sidebar-heading"><h1>Live matchups</h1>${btn('Refresh', 'refresh')}</div><p class="live-selection-count">${highlightedGames.length} of 4 selected</p><p class="muted live-update">Sample data · Updated 20 seconds ago<br>Refreshes every minute in the app.</p>${select('Show league', ['All leagues', 'Sample league', 'Sunday league'])}${[
    'Sample league',
    'Sunday league',
  ]
    .filter((l) => filter === 'All leagues' || filter === l)
    .map(
      (l) =>
        `<h2 class="live-league-name">${l}</h2><p class="muted">${l === 'Sample league' ? 'Sleeper' : 'ESPN'} · 2025 · Week 7</p>${sampleGames.map((g, i) => (g.league !== l ? '' : `<div class="matchup"><button data-action="highlight:${i}" aria-pressed="${highlightedGames.includes(i)}" ${highlightedGames.length === 4 && !highlightedGames.includes(i) ? 'disabled' : ''}><span class="compact-team">${g.home}</span><span class="compact-score">${g.homeScore.toFixed(2)} – ${g.awayScore.toFixed(2)}</span><span class="compact-team compact-away">${g.away}</span></button></div>`)).join('')}`,
    )
    .join(
      '',
    )}${detail('Win estimate & coverage', 'Uncalibrated estimates use current scores, starters’ projections, and remaining NFL game time. Missing values remain unavailable. Select up to four matchups across leagues.')}</div></aside><div class="matchup-four-grid" aria-label="Four matchup sections">${Array.from({ length: 4 }, (_, slot) => (highlightedGames[slot] === undefined ? `<section class="matchup-quarter quarter-empty"><h2>Matchup slot ${slot + 1}</h2><p>Select a game from the matchup list.</p></section>` : matchupQuarter(highlightedGames[slot]))).join('')}</div></section>`;
}
function insights() {
  let t = tabs(['Team scoring', 'Weekly trends', 'Trades', 'Pickups']);
  let body =
    tab === 'Team scoring'
      ? `${head('Who delivers every week?', 'Select a team to inspect its scoring profile.')}${table(
          ['Team', 'Avg. points', 'Best week', 'Above median', 'Avg. vs. projection'],
          teams.map((n, i) => [
            `${btn(n, 'pick:' + i, 'link')}<small>${managers[i]}</small>`,
            (124.8 - i * 5.6).toFixed(1),
            (146.8 - i * 5).toFixed(1),
            `${5 - Math.min(i, 4)} of 6`,
            (8.4 - i * 2.1).toFixed(1),
          ]),
        )}`
      : tab === 'Weekly trends'
        ? `${head('Weekly scoring', 'Choose one team or compare the whole league.')}${select('Team', ['All teams', ...teams])}${chart()}${detail('Exact weekly scores', 'The existing sortable table of completed-week scores stays available, including unavailable values and coverage.')}`
        : tab === 'Trades'
          ? `${head('Trade results', 'Equal post-trade windows keep comparisons fair.')}${table(
              ['Exchange', 'Scoring leader', 'Window', 'Evidence'],
              [
                [
                  'Jefferson for Hall',
                  teams[0],
                  'Weeks 3–6',
                  btn('View comparison', 'tradeEvidence', 'link'),
                ],
                [
                  'Wilson for Reed',
                  'Too close to call',
                  'Weeks 4–6',
                  btn('View comparison', 'tradeEvidence', 'link'),
                ],
              ],
            )}`
          : `${head('Pickup value', 'Starts while retained, compared with positional baselines.')}${select('Team', ['All teams', ...teams])}${table(
              ['Pickup', 'Team', 'Lift per start', 'Starts'],
              [
                ['Jayden Reed', teams[0], '+6.4 pts', '3'],
                ['Jordan Addison', teams[2], '+4.2 pts', '2'],
              ],
            )}`;
  return (
    heading(
      'Season insights',
      'Follow scoring, trends, and the moves that changed the season.',
      btn('Refresh report', 'refresh') +
        btn('Share report', 'share') +
        btn('Export report', 'export'),
    ) +
    context() +
    `<section class="workspace">${identity(
      teams[selected] || teams[0],
      'Selected team · 6 completed weeks',
      [
        ['Avg. points', (124.8 - selected * 5.6).toFixed(1)],
        ['Record', '5–1'],
        ['Beat projection', '4 of 6'],
      ],
    )}${t}${split(body + method, `<h3>${teams[selected] || teams[0]}</h3><p>Selected-team evidence follows you between scoring and trends.</p>${kv('Points scored', '748.8')}${kv('Points against', '649.2')}${kv('Best week', '146.8')}${kv('Beat projection', '4 of 6')}${kv('Best lineup / week', '141.2')}${kv('Start accuracy', '88.4%')}${chart()}${detail('Assessment rules', 'Existing equal windows, positional baselines, coverage thresholds, no-call outcomes, and draft-pick exclusions remain intact. Pickup values count retained starts.')}${detail('Report sharing', 'Share a current report link or create a frozen snapshot. Image exports keep the existing report calculations.')}`)}</section>`
  );
}
function playoffs() {
  let t = tabs(['Forecast table', 'Week-by-week chart', 'Forecast reliability']);
  let body =
    tab === 'Forecast table'
      ? `${head('Forecast table', 'Select a team to inspect its path.')}${select('Forecast through week', ['6', '5', '4', '3', '2', '1'])}${table(
          ['Team', 'Make playoffs', 'Earn bye', 'Win title'],
          teams.map((n, i) => [
            `${btn(n, 'pick:' + i, 'link')}<small>${managers[i]}</small>`,
            `<strong>${[92, 86, 72, 58, 32, 14][i]}%</strong><div class="bar"><i style="width:${[92, 86, 72, 58, 32, 14][i]}%"></i></div>`,
            `${[44, 30, 16, 8, 2, 0][i]}%`,
            `${[26, 22, 19, 16, 11, 6][i]}%`,
          ]),
        )}`
      : tab === 'Week-by-week chart'
        ? `${head('How the forecast changed', 'Keep team context while exploring earlier completed weeks.')}${select('Metric', ['Make playoffs', 'Earn bye', 'Win title'])}${chart('Forecast through completed weeks')}${table(
            ['Week', 'Make playoffs', 'Earn bye'],
            [
              ['4', '76%', '24%'],
              ['5', '84%', '32%'],
              ['6', '92%', '44%'],
            ],
          )}`
        : `${head('Forecast reliability', 'Review historical results before interpreting an estimate.')}${table(
            ['Probability band', 'Forecasts', 'Observed outcome'],
            [
              ['70–80%', '24', '75%'],
              ['80–90%', '18', '83%'],
              ['90–100%', '12', '92%'],
            ],
          )}${detail('Historical coverage', 'Show existing sample counts, backtest exclusions, and forecast coverage. Small samples do not establish calibrated odds.')}`;
  return (
    heading(
      'Playoff simulation',
      'Explore the field and the evidence behind each estimate.',
      btn('Share report', 'share') + btn('Export report', 'export'),
    ) +
    context() +
    `<section class="workspace">${identity(
      'The playoff picture',
      'Sample league · 6 playoff places',
      [
        ['Completed weeks', '6'],
        ['Regular season', '14 weeks'],
      ],
    )}${t}${split(body, `<h3>${teams[selected] || teams[0]}</h3><p>Forecasts are estimates, not calibrated odds.</p>${kv('Current record', '5–1')}${kv('Projected wins', '9.6')}${kv('Playoff places', '6')}${kv('Tie-break rules', 'League settings')}${detail('Forecast assumptions & coverage', 'Retain existing simulation settings, scoring strength model, schedule, tie-break rules, early-season uncertainty, and missing-data notices.')}${detail('Weekly lineup projection coverage', 'Inspect available projections, locked starters, missing inputs, and scoring-week exclusions.')}${method}`)}</section>`
  );
}
function leagues() {
  return (
    heading(
      'Manage leagues',
      'Keep league names, provider connections, and access in one place.',
      btn('Connect league', 'go:8', 'primary'),
    ) +
    `<section class="workspace">${split(
      `${head('Connected leagues', 'Select a league to review or change its connection.')}${table(
        ['League', 'Provider', 'Season', 'Settings'],
        [
          ['Sample league', 'Sleeper', '2025', btn('Manage', 'pick:0', 'link')],
          ['Sunday league', 'ESPN', '2025', btn('Manage', 'pick:1', 'link')],
        ],
      )}${detail('No connected leagues', 'Connect a Sleeper or ESPN league to start ranking teams and exploring results.')}`,
      `<h3>${selected ? 'Sunday league' : 'Sample league'}</h3><p>League identity and provider settings stay together.</p><div class="fieldstack">${field('League name', selected ? 'Sunday league' : 'Sample league')}${btn('Save name', 'save', 'primary')}${field('Provider league ID', '123456789012345678')}${btn('Update connection', 'save')}${btn('ESPN settings', 'espn')}</div>${detail('Remove league', 'Removal is separate from connection editing. Enter the league name to confirm. Cancellation returns to this panel.')}${btn('Remove league', 'removeLeague')}`,
    )}</section>`
  );
}
function connect() {
  let t = tabs(['Sleeper', 'ESPN']);
  return (
    heading('Connect a league', 'Choose your provider, then add your league details.') +
    `<section class="workspace">${t}${split(`<div class="settings">${head('Connect ' + tab, 'Review the details before creating your league connection.')}<div class="fieldstack">${field('Provider league ID')}${field('League name')}${select('Season', ['2025', '2024', '2023'])}</div><p class="muted" style="margin-top:14px">${tab === 'Sleeper' ? 'Find the number after /leagues/ in your Sleeper league URL.' : 'Find the leagueId number in the ESPN league URL. Private leagues need saved ESPN cookies.'}</p><div class="bottom-actions">${btn('Cancel', 'go:7')}${btn('Connect league', 'connected', 'primary')}</div></div>`, `<h3>What happens next</h3><p>Your teams and scoring schedule become available in the rankings studio.</p>${kv('Suggested initial order', 'Power-based')}${kv('Your ranking order', 'Always editable')}${tab === 'ESPN' ? btn('Set ESPN cookies', 'espn') : ''}${detail('Starting order method', 'Completed scoring and point margin inform the suggested order, with early results pulled toward the league average. It remains a starting point for your judgment.')}`)}</section>`
  );
}
function profile() {
  let t = tabs(['Profile details', 'Writing connections', 'ESPN settings']);
  let body =
    tab === 'Profile details'
      ? `${head('Profile details', 'Your nickname appears where manager names are shown.')}<div class="fieldstack">${field('Name', 'Alex Morgan')}${field('Nickname', 'Alex')}${btn('Save profile', 'save', 'primary')}</div>`
      : tab === 'Writing connections'
        ? `${head('Writing assistant connections', 'Review services or manage your own keys.')}<div class="fieldstack">${kv('Codex account', 'Not connected')}${btn('Connect Codex account', 'credential')}${kv('OpenAI API key', 'Saved')}${field('Replace OpenAI API key', '', 'password')}${btn('Save OpenAI key', 'credential')}${btn('Remove OpenAI key', 'credential')}${kv('Anthropic API key', 'Not saved')}${field('Anthropic API key', '', 'password')}${btn('Save Anthropic key', 'credential')}</div>`
        : `${head('ESPN settings', 'Private leagues use these saved account cookies.')}<div class="fieldstack">${field('espn_s2', '', 'password')}${field('SWID', '', 'password')}${btn('Save ESPN settings', 'credential', 'primary')}${btn('Remove ESPN settings', 'credential')}</div>${detail('Find ESPN cookies', 'The existing setup instructions remain available here. Cookies are sensitive and are never displayed after saving.')}`;
  return (
    heading('Your profile', 'Manage your identity and the connections you use to write and play.') +
    `<section class="workspace">${identity('Alex Morgan', 'Your account', [['Connected leagues', '2']])}${t}${split(`<div class="settings">${body}</div>`, `<h3>${tab === 'Profile details' ? 'Account details' : 'Connection privacy'}</h3><p>${tab === 'Profile details' ? 'Use a recognizable name in league reports and rankings.' : 'Saved secrets are encrypted and never shown again. Review context sharing in the rankings studio before generating suggestions.'}</p>${btn('Manage leagues', 'go:7')}${detail('Connection status', 'Loading, expired, missing, and failed connections retain retry and reconnect actions. This prototype does not connect accounts or save credentials.')}`)}</section>`
  );
}
function leagueHistory() {
  return `<iframe class="history-explorer-frame" title="League history Manager Explorer" src="league-history.html"></iframe>`;
}
function otherTools() {
  return (
    heading('Other tools', 'Player research and trade planning, when you need them.') +
    `<section class="workspace tools-directory"><article><span class="tool-symbol" aria-hidden="true">♙</span><div><h2>Players</h2><p>Search players, inspect scoring history, and compare performances.</p>${btn('Open Players', 'go:1', 'primary')}</div></article><article><span class="tool-symbol" aria-hidden="true">⇄</span><div><h2>Trade analyzer</h2><p>Build a trade, compare lineup impact, and explore roster needs.</p>${btn('Open Trade analyzer', 'go:2', 'primary')}</div></article></section>`
  );
}
const renderers = [
  rankings,
  playerPage,
  trades,
  overview,
  live,
  insights,
  playoffs,
  leagues,
  connect,
  profile,
  leagueHistory,
  otherTools,
];
function render() {
  $('#main').classList.toggle('live-mockup', page === 4);
  document.body.classList.toggle('live-review', page === 4);
  const navigation = [
    [0, 'Rankings studio'],
    [3, 'Weekly overview'],
    [4, 'Live matchups'],
    [5, 'Season insights'],
    [6, 'Playoff simulator'],
    [10, 'League history'],
    [11, 'Other tools'],
  ];
  const activePage = [1, 2].includes(page) ? 11 : page;
  $('#nav').innerHTML = navigation
    .map(
      ([i, n]) =>
        `<button data-page="${i}" ${i === activePage ? 'aria-current="page"' : ''}>${n}</button>`,
    )
    .join('');
  $('#account-menu').open = false;
  let html = renderers[page]();
  if (state !== 'Ready')
    html =
      heading(screens[page], 'League and season context remain available.') +
      context() +
      `<section class="workspace state">${state === 'Loading' ? '<h2>Loading this view…</h2><p>Fetching the selected league’s data.</p><div class="skeleton"></div><div class="skeleton" style="width:65%"></div>' : state === 'Empty' ? `<h2>No data for this selection</h2><p>Choose a different season or connect a league to get started. Unavailable values are not shown as zero.</p>${btn('Connect a league', 'go:8', 'primary')}` : `<h2>This view couldn’t be refreshed</h2><p>Your league selection is preserved. Try again to fetch the latest data.</p>${btn('Try again', 'retry', 'primary')}`}</section>`;
  if ([1, 2].includes(page))
    html =
      `<div class="tool-breadcrumb">${btn('Other tools', 'go:11', 'link')}<span aria-hidden="true"> / </span><span>${screens[page]}</span></div>` +
      html;
  $('#main').innerHTML =
    html +
    `<div class="footer"><span>Design concept · Sample data, not live results</span><span>${page + 1} of ${screens.length} screens · Same league context across views</span></div>`;
  const historyFrame = $('.history-explorer-frame');
  if (window.historyResize) window.historyResize.disconnect();
  if (historyFrame)
    historyFrame.addEventListener('load', () => {
      const fit = () => {
        historyFrame.style.height =
          historyFrame.contentDocument.documentElement.scrollHeight + 'px';
      };
      fit();
      window.historyResize = new ResizeObserver(fit);
      window.historyResize.observe(historyFrame.contentDocument.body);
    });
  const frame = $('.original-export');
  if (window.exportResize) window.exportResize.disconnect();
  if (frame) {
    const fit = () => {
      frame.style.zoom = Math.min(1, frame.parentElement.clientWidth / 1304);
      if (frame.contentDocument?.body)
        frame.style.height = frame.contentDocument.documentElement.scrollHeight + 'px';
    };
    frame.addEventListener('load', fit);
    window.exportResize = new ResizeObserver(fit);
    window.exportResize.observe(frame.parentElement);
  }
  location.hash = encodeURIComponent(screens[page]);
  requestAnimationFrame(() => {
    const nav = $('#nav'),
      active = nav.querySelector('[aria-current=page]');
    if (active)
      nav.scrollLeft = Math.max(
        0,
        active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2,
      );
  });
}
function modal(t, b) {
  $('#dialog-body').innerHTML = `<h2>${t}</h2>${b}`;
  $('#dialog').showModal();
}
function toast(t) {
  $('#toast').textContent = t;
  $('#toast').style.display = 'block';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => ($('#toast').style.display = 'none'), 3200);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.page !== undefined) {
    page = +b.dataset.page;
    selected = 0;
    tab = '';
    state = 'Ready';
    $('#state').value = state;
    render();
    return;
  }
  if (b.dataset.tab) {
    tab = b.dataset.tab;
    render();
    return;
  }
  if (!b.dataset.action) return;
  const [a, x, y] = b.dataset.action.split(':');
  if (a === 'sort') {
    const body = b.closest('table').tBodies[0];
    const rows = [...body.rows];
    const reverse = b.dataset.desc === 'true';
    rows.sort(
      (r1, r2) =>
        r1.cells[+x].textContent.localeCompare(r2.cells[+x].textContent, undefined, {
          numeric: true,
        }) * (reverse ? -1 : 1),
    );
    rows.forEach((r) => body.append(r));
    b.dataset.desc = String(!reverse);
    toast('Table sorted by ' + b.textContent + '.');
  } else if (a === 'go') {
    page = +x;
    selected = 0;
    tab = '';
    state = 'Ready';
    $('#state').value = state;
    if ($('#dialog').open) $('#dialog').close();
    render();
  } else if (a === 'pick') {
    selected = +x;
    render();
    if (innerWidth < 720 && [0, 5, 6, 7].includes(page))
      $('.aside').scrollIntoView({ behavior: 'instant' });
  } else if (a === 'up' || a === 'down') {
    let i = +x,
      j = i + (a === 'up' ? -1 : 1);
    if (j >= 0 && j < order.length) {
      [order[i], order[j]] = [order[j], order[i]];
      selected = j;
      render();
      toast(`Moved ${order[j]} to rank ${j + 1}.`);
    }
  } else if (a === 'compare') {
    compared.has(+x) ? compared.delete(+x) : compared.add(+x);
    tab = 'Compare players';
    render();
  } else if (a === 'send') {
    sent[+x].has(+y) ? sent[+x].delete(+y) : sent[+x].add(+y);
    render();
    toast('Sample trade updated.');
  } else if (a === 'reset') {
    sent = [new Set(), new Set()];
    render();
  } else if (a === 'scenario') {
    tab = 'Build a trade';
    render();
  } else if (a === 'preview') {
    tab = 'Preview & export';
    render();
  } else if (a === 'lineup') {
    const advice = $('#overview-lineup-' + x);
    if (advice) {
      advice.open = true;
      advice.scrollIntoView({ block: 'nearest' });
    }
  } else if (a === 'dismiss') {
    b.closest('.notice').remove();
    toast('Alert dismissed in this preview.');
  } else if (a === 'restore') {
    render();
    toast('Sample alerts restored.');
  } else if (a === 'retry') {
    state = 'Ready';
    $('#state').value = state;
    render();
  } else if (a === 'livePlayer') {
    modal(
      x + ' profile preview',
      '<p>In the app, player names open their profile while preserving league and season context.</p>' +
        btn('Open Players mockup', 'go:1'),
    );
  } else if (a === 'highlight') {
    const id = +x;
    if (highlightedGames.includes(id)) highlightedGames = highlightedGames.filter((v) => v !== id);
    else if (highlightedGames.length < 4) highlightedGames.push(id);
    render();
  } else if (a === 'overviewGo') {
    contextValues.League = +x ? 'Sunday league' : 'Sample league';
    page = +y;
    tab = '';
    selected = 0;
    render();
  } else if (a === 'espn') {
    page = 9;
    tab = 'ESPN settings';
    render();
  } else if (a === 'share') {
    modal(
      'Share report',
      '<p>Choose a current report link or a frozen snapshot.</p><div class="fieldstack">' +
        btn('Copy current report link', 'sample') +
        btn('Create frozen snapshot', 'sample') +
        '</div><p class="muted" style="margin-top:16px">Preview only. No link is created or published.</p>',
    );
  } else if (a === 'copy') {
    modal(
      'Copy an edition',
      select('Source week', ['Week 6', 'Week 5', 'Week 4']) +
        detail(
          'What to copy',
          'Retain existing choices for copying team order, commentary, and edition details.',
        ) +
        btn('Review copy', 'sample'),
    );
  } else if (a === 'pool') {
    modal(
      'Verified unowned pool',
      '<p>Include provider-verified unowned players when a managed team and supported coverage are available. Loading, refresh, and partial coverage remain explicit.</p>' +
        btn('Refresh unowned players', 'refresh'),
    );
  } else if (a === 'revision') {
    modal(
      'Revision history',
      '<p>Select a saved revision to review before restoring.</p>' +
        kv('Today, 10:42 AM', 'Current version') +
        kv('Today, 10:26 AM', 'Previous revision') +
        btn('Preview revision', 'sample'),
    );
  } else if (a === 'writing') {
    modal(
      'Writing assistant',
      '<p>Choose your connected assistant and review the context you want to share.</p>' +
        select('Assistant', ['Codex', 'Claude']) +
        '<label style="margin-top:12px"><span><input type="checkbox" style="width:auto"> Include selected team’s matchup context</span></label>' +
        detail(
          'Shared context',
          'Review league, team, score, and ranking data before generating.',
        ) +
        btn('Preview suggestion', 'sample'),
    );
  } else if (a === 'removeLeague') {
    modal(
      'Remove league',
      '<p>Enter the league name before confirming removal.</p>' +
        field('Type league name to confirm') +
        '<p class="muted" style="margin-top:12px">This mockup cannot delete a league.</p>',
    );
  } else if (a === 'connected') {
    modal(
      'League connection preview',
      '<p>After validation, open Rankings studio with your league and suggested starting order.</p>' +
        btn('Open sample rankings', 'go:0', 'primary'),
    );
  } else if (a === 'tradeEvidence') {
    modal(
      'Post-trade scoring evidence',
      '<p>Jefferson for Hall · Weeks 3–6</p>' +
        table(
          ['Asset', 'Points above baseline', 'Common weeks'],
          [
            ['Justin Jefferson', '+24.2', '4'],
            ['Breece Hall', '+31.8', '4'],
          ],
        ) +
        method,
    );
  } else if (a === 'refresh' || a === 'save') {
    toast(
      a === 'save'
        ? 'Saved in this mockup only.'
        : 'Sample view refreshed. No live data requested.',
    );
  } else {
    const descriptions = {
      export: [
        'Export preview',
        'Existing original and compact ranking images, or the selected report image, remain available. This mockup does not export a production report.',
      ],
      publish: [
        'Publish edition',
        'Review the saved revision and public-link status before publishing. This preview does not publish anything.',
      ],
      unpublish: [
        'Unpublish edition',
        'Review publication status before removing public access. This preview does not unpublish anything.',
      ],
      credential: [
        'Connection preview',
        'Existing save, remove, and account connection flows stay available. Credentials entered here are not sent or stored.',
      ],
      shortcuts: [
        'Keyboard shortcuts',
        'Existing team navigation, reordering, and save shortcuts remain available. All mockup controls are also reachable with Tab.',
      ],
    };
    if (descriptions[a]) modal(descriptions[a][0], '<p>' + descriptions[a][1] + '</p>');
    else toast('Preview interaction only. No external action taken.');
  }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('select[data-field]')) {
    contextValues[e.target.dataset.field] = e.target.value;
    if (e.target.dataset.field === 'Show league') render();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.dataset.field && e.target.type !== 'password')
    draftValues[e.target.dataset.field] = e.target.value;
  if (e.target.id === 'search')
    document
      .querySelectorAll('tbody tr')
      .forEach(
        (r) =>
          (r.hidden = !r.cells[0].textContent.toLowerCase().includes(e.target.value.toLowerCase())),
      );
  if (e.target.dataset.roster !== undefined)
    e.target
      .closest('.roster')
      .querySelectorAll('.rankrow')
      .forEach(
        (r) => (r.hidden = !r.textContent.toLowerCase().includes(e.target.value.toLowerCase())),
      );
});
$('#state').addEventListener('change', (e) => {
  state = e.target.value;
  render();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#account-menu')) $('#account-menu').open = false;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $('#account-menu').open = false;
});
$('#close').addEventListener('click', () => $('#dialog').close());
window.addEventListener('hashchange', () => {
  const next = screens.indexOf(decodeURIComponent(location.hash.slice(1)));
  if (next >= 0 && next !== page) {
    page = next;
    tab = '';
    selected = 0;
    state = 'Ready';
    $('#state').value = state;
    render();
  }
});
