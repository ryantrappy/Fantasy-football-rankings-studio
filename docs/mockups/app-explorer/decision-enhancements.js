// Interactive fixtures for design review only; never submits provider transactions.
const decisionFixture = [
  ['Jalen Hurts', 'QB', 23.1, 'Starter'],
  ['James Cook', 'RB', 16.2, 'Starter'],
  ['Breece Hall', 'RB', 0, 'Bye'],
  ['Justin Jefferson', 'WR', 20.4, 'Starter'],
  ['Jayden Reed', 'WR', 19.1, 'Bench'],
  ['George Kittle', 'TE', 12.3, 'Game locked'],
  ['Jordan Addison', 'WR', 13.4, 'Available'],
  ['Tyjae Spears', 'RB', 10.8, 'Available'],
  ['Garrett Wilson', 'WR', 18.3, 'Starter'],
  ['Josh Allen', 'QB', 24.4, 'Starter'],
  ['Trey McBride', 'TE', 15.2, 'Bench'],
  ['Derrick Henry', 'RB', 18.1, 'Starter'],
  ['Dalton Kincaid', 'TE', 16, 'Starter'],
].map(([name, pos, proj, status], id) => ({ name, pos, proj, status, id }));
const decisionRosters = [
  [0, 1, 2, 3, 4, 5],
  [8, 9, 10, 11, 6, 12],
  [1, 3, 5, 7, 9],
  [0, 2, 4, 8, 10],
  [1, 5, 9, 11],
  [0, 3, 8, 10],
];
let decisionCompare = new Set([3, 8]),
  decisionQuery = '',
  decisionPosition = '',
  decisionRange = [1, 6],
  decisionTeamIds = [0, 1],
  decisionSends = [new Set(), new Set()],
  decisionSlots = 0,
  decisionConfirmed = false,
  decisionDialog = '',
  decisionLeague = 0,
  decisionWaiverPos = '',
  decisionCandidate = 6,
  decisionDrop = 4,
  decisionRefreshed = false,
  decisionExcluded = new Set(),
  decisionDismissed = new Set();
const decisionButton = (label, action, extra = '') =>
  `<button data-decision="${action}" ${extra}>${label}</button>`;
const decisionHelp = (label, copy) =>
  typeof helpTip === 'function'
    ? helpTip(label, copy)
    : `<span title="${esc(copy)}">${esc(label)}</span>`;
const decisionSelect = (label, key, options, value) =>
  `<label>${label}<select data-decision-field="${key}">${options.map(([v, l]) => `<option value="${v}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
const decisionPoints = (n) => (Number.isFinite(n) ? n.toFixed(1) : 'Unavailable');
const decisionSign = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;
const decisionProfileButton = (id) =>
  decisionButton(decisionFixture[id].name, `profile:${id}`, 'class="link"');
const decisionEvidence = () => decisionButton('Sources & coverage', 'sources', 'class="link"');
function decisionSources() {
  return `<p>Illustrative Week 7 snapshot, captured October 13 at 9:45 PM. Values below are fixtures for this mockup, not fetched forecasts.</p>${table(
    ['Source', 'Coverage', 'Scoring'],
    [
      ['Sleeper', '13 of 13 fixture players', 'Selected league rules'],
      ['ESPN', '13 of 13 fixture players', 'Selected league rules'],
    ],
  )}<p>Comparable sources are averaged. Ownership and locks stay league-authoritative. Missing projections remain unavailable. Current-week estimates are not season-long trade values.</p>`;
}
function decisionPlayerEvidence(id) {
  const p = decisionFixture[id],
    values = Array.from({ length: 6 }, (_, w) => +(p.proj + ((w % 3) - 1) * 2.2).toFixed(1)),
    scores = values.slice(decisionRange[0] - 1, decisionRange[1]),
    total = scores.reduce((a, b) => a + b, 0);
  return `<article class="decision-profile"><div class="sectionhead"><h3>${esc(p.name)}</h3>${decisionButton('Remove', `compare:${id}`)}</div><p>${p.pos} · ${p.status === 'Available' ? 'Unowned' : teams[id % teams.length]} · ${p.status}</p>${strip(
    [
      ['Observed total', decisionPoints(total)],
      ['Average', decisionPoints(total / scores.length)],
      ['Coverage', `${scores.length} of ${scores.length} weeks`],
    ],
  )}${kv('Week 7 projection', decisionPoints(p.proj))}${kv('Source disagreement', '1.2 pts')}<div class="decision-source-line">Sleeper ${decisionPoints(p.proj - 0.6)} · ESPN ${decisionPoints(p.proj + 0.6)} ${decisionEvidence()}</div>${table(
    ['Week', 'Observed points'],
    scores.map((v, i) => [decisionRange[0] + i, decisionPoints(v)]),
  )}</article>`;
}
function decisionPlayers() {
  const list = decisionFixture.filter(
    (p) =>
      (!decisionPosition || p.pos === decisionPosition) &&
      `${p.name} ${p.pos} ${p.id} ${teams[p.id % teams.length]}`
        .toLowerCase()
        .includes(decisionQuery.toLowerCase()),
  );
  return (
    heading(
      'Players',
      'Search, compare, and inspect league-scored evidence.',
      btn('Refresh players', 'refresh'),
    ) +
    context() +
    `<section class="workspace"><div class="content"><div class="decision-controls"><label>Find a player<input data-decision-search value="${esc(decisionQuery)}" placeholder="Name, team, position or ID"></label>${decisionSelect('Position', 'player-position', [['', 'All positions'], ...['QB', 'RB', 'WR', 'TE'].map((p) => [p, p])], decisionPosition)}${decisionButton('Reset filters', 'filters-reset')}${btn('Include verified unowned pool', 'pool')}</div><div class="decision-player-browser">${list.map((p) => `<div class="rankrow"><div class="team">${decisionProfileButton(p.id)}<small>${p.pos} · ${p.status} · ${decisionPoints(p.proj)} projected</small></div>${decisionButton(decisionCompare.has(p.id) ? 'Remove' : 'Compare', `compare:${p.id}`, `aria-pressed="${decisionCompare.has(p.id)}"`)}</div>`).join('') || '<p>No matching players. Reset filters to browse again.</p>'}</div><div class="sectionhead"><h2>Selected players (${decisionCompare.size})</h2>${decisionButton('Clear selection', 'compare-clear', decisionCompare.size ? '' : 'disabled')}</div><div class="league-list">${[...decisionCompare].map((id) => decisionButton(decisionFixture[id].name + ' ×', `compare:${id}`)).join('')}</div><div class="decision-controls">${decisionSelect(
      'First week',
      'range-start',
      Array.from({ length: 6 }, (_, i) => [i + 1, i + 1]),
      decisionRange[0],
    )}${decisionSelect(
      'Last week',
      'range-end',
      Array.from({ length: 6 }, (_, i) => [i + 1, i + 1]),
      decisionRange[1],
    )}${decisionEvidence()}</div>${decisionRange[0] > decisionRange[1] ? '<p role="alert">Choose a first week no later than the last week.</p>' : `<div class="decision-profile-grid">${[...decisionCompare].map(decisionPlayerEvidence).join('') || '<p>Select a player above to open their profile. Add more to compare.</p>'}</div>`}</div></section>`
  );
}
function decisionCoverage(ids) {
  return ['QB', 'RB', 'WR', 'TE']
    .map((pos) => `${pos} ${ids.filter((id) => decisionFixture[id].pos === pos).length}`)
    .join(' · ');
}
function decisionBest(ids) {
  return ['QB', 'RB', 'WR', 'TE'].reduce(
    (total, pos) =>
      total +
      Math.max(
        0,
        ...ids
          .filter((id) => decisionFixture[id].pos === pos)
          .map((id) => decisionFixture[id].proj),
      ),
    0,
  );
}
function decisionTradeSide(side) {
  const own = decisionRosters[decisionTeamIds[side]],
    outgoing = [...decisionSends[side]],
    incoming = [...decisionSends[1 - side]],
    after = own.filter((id) => !outgoing.includes(id)).concat(incoming),
    beforeScore = decisionBest(own),
    afterScore = decisionBest(after);
  return { own, outgoing, incoming, after, beforeScore, afterScore };
}
function decisionTradeIdeas() {
  const own = decisionRosters[decisionTeamIds[0]],
    ideas = [];
  decisionRosters.forEach((other, partner) => {
    if (partner === decisionTeamIds[0]) return;
    own.forEach((send) =>
      other.forEach((receive) => {
        if (
          own.includes(receive) ||
          other.includes(send) ||
          decisionFixture[send].status === 'Game locked' ||
          decisionFixture[receive].status === 'Game locked'
        )
          return;
        const ownAfter = own.filter((id) => id !== send).concat(receive),
          otherAfter = other.filter((id) => id !== receive).concat(send),
          before = [decisionBest(own), decisionBest(other)],
          after = [decisionBest(ownAfter), decisionBest(otherAfter)];
        if (after[0] > before[0] && after[1] > before[1])
          ideas.push({ partner, send, receive, before, after, ownAfter, otherAfter });
      }),
    );
  });
  ideas.sort(
    (a, b) =>
      Math.min(b.after[0] - b.before[0], b.after[1] - b.before[1]) -
      Math.min(a.after[0] - a.before[0], a.after[1] - a.before[1]),
  );
  return `<div class="content">${head('Find trade ideas', 'Current-week fixture ideas, ranked by the smaller of both managers’ gains.')}${decisionSelect(
    'Your team',
    'idea-team',
    teams.map((t, i) => [i, t]),
    decisionTeamIds[0],
  )}<div class="decision-ideas">${
    ideas
      .slice(0, 5)
      .map(
        (d) =>
          `<article class="decision-profile"><h3>${teams[d.partner]}</h3><p>You send <strong>${decisionFixture[d.send].name}</strong>; receive <strong>${decisionFixture[d.receive].name}</strong>.</p>${table(
            ['Manager', 'Before', 'After', 'Fixture gain'],
            [0, 1].map((side) => [
              teams[side ? d.partner : decisionTeamIds[0]],
              decisionPoints(d.before[side]),
              decisionPoints(d.after[side]),
              decisionSign(d.after[side] - d.before[side]),
            ]),
          )}<p><strong>Your benefit:</strong> ${decisionFixture[d.receive].name} improves your best available starting lineup.</p><p><strong>Partner benefit:</strong> ${decisionFixture[d.send].name} fills a more useful starting position than the player sent.</p><p>Your coverage: ${decisionCoverage(own)} → ${decisionCoverage(d.ownAfter)}<br>Partner coverage: ${decisionCoverage(decisionRosters[d.partner])} → ${decisionCoverage(d.otherAfter)}</p><div class="actions">${decisionButton('Inspect trade', `inspect:${d.partner}:${d.send}:${d.receive}`, 'class="primary"')}${decisionEvidence()}</div></article>`,
      )
      .join('') ||
    '<p>No mutually beneficial trades in this fixture snapshot. Try another team or build your own scenario.</p>'
  }</div><p class="muted">A projected benefit does not predict willingness to accept. Illustrative slot optimization; inspect provider eligibility before acting.</p></div>`;
}
function decisionTrades() {
  const view = tabs(['Build a trade', 'Find trade ideas']);
  if (tab === 'Find trade ideas')
    return (
      heading('Trade analyzer', 'Explore exchanges without changing either provider roster.') +
      context() +
      `<section class="workspace">${view}${decisionTradeIdeas()}</section>`
    );
  const counts = decisionSends.map((s) => s.size),
    gain = counts[0] === counts[1] ? -1 : counts[0] > counts[1] ? 1 : 0,
    needed = Math.abs(counts[0] - counts[1]),
    ready = counts.every(Boolean) && (gain < 0 || (decisionSlots >= needed && decisionConfirmed));
  return (
    heading(
      'Trade analyzer',
      'Choose players, then compare both legal lineup scenarios.',
      `${decisionEvidence()}${decisionButton('Reset trade', 'trade-reset')}`,
    ) +
    context() +
    `<section class="workspace">${view}<div class="content">${gain < 0 ? '' : `<div class="notice"><strong>${teams[decisionTeamIds[gain]]} receives ${needed} extra player${needed === 1 ? '' : 's'}.</strong><div class="decision-controls"><label>Available open roster slots for ${teams[decisionTeamIds[gain]]}<input type="number" min="0" data-decision-field="slots" value="${decisionSlots}"></label><label class="decision-check"><input type="checkbox" data-decision-field="confirm" ${decisionConfirmed ? 'checked' : ''}> I confirm this roster space is available.</label></div></div>`}<div class="decision-trade-grid">${[
      0, 1,
    ]
      .map((side) => {
        const d = decisionTradeSide(side);
        return `<section class="decision-trade-side">${decisionSelect(
          side ? 'Trade partner' : 'Your team',
          `trade-team-${side}`,
          teams.map((t, i) => [i, t]).filter(([i]) => i !== decisionTeamIds[1 - side]),
          decisionTeamIds[side],
        )}<div class="decision-impact"><h3>Week 7 lineup impact ${decisionHelp('ⓘ', 'Illustrative best legal lineup for one QB, RB, WR and TE slot. Production must retain the selected league’s complete slot rules, locks and availability.')}</h3>${ready ? `${kv('Before → After', `${decisionPoints(d.beforeScore)} → ${decisionPoints(d.afterScore)}`)}${kv('Change', decisionSign(d.afterScore - d.beforeScore))}` : '<p>Select players on both sides and confirm any needed roster space.</p>'}<p>Before: ${decisionCoverage(d.own)}<br>After: ${decisionCoverage(d.after)}</p><p>Active roster: ${d.own.length} → ${d.after.length}</p></div><p><strong>Sending:</strong> ${d.outgoing.map((id) => decisionFixture[id].name).join(', ') || 'No players selected'}<br><strong>Receiving:</strong> ${d.incoming.map((id) => decisionFixture[id].name).join(', ') || 'No players selected'}</p><label>Find a player<input data-decision-roster="${side}" placeholder="Search name or position"></label><div class="decision-roster">${d.own
          .map((id) => {
            const p = decisionFixture[id];
            return `<div class="rankrow" data-decision-row><div class="team">${decisionProfileButton(id)}<small>${p.pos} · ${p.status} · ${decisionPoints(p.proj)} projected</small></div>${decisionButton(decisionSends[side].has(id) ? 'Remove' : 'Send', `send:${side}:${id}`, `aria-pressed="${decisionSends[side].has(id)}" ${p.status === 'Game locked' ? 'title="Game locked; verify provider trade eligibility"' : ''}`)}</div>`;
          })
          .join('')}</div></section>`;
      })
      .join(
        '',
      )}</div><p class="muted">Sample scenario only. No trade offers are sent. Draft picks, FAAB, and long-term value are excluded.</p></div></section>`
  );
}
function decisionLineup() {
  const roster = decisionRosters[decisionLeague ? 3 : 0],
    available = roster.filter((id) => !decisionExcluded.has(id)),
    best = decisionBest(available),
    base = decisionBest(roster.filter((id) => decisionFixture[id].status !== 'Bench'));
  return `<p>Sample Week 7 roster · Captured 9:45 PM ${decisionEvidence()}</p>${strip([
    ['Submitted', decisionPoints(base)],
    ['Proposed', decisionPoints(best)],
    ['Change', decisionSign(best - base)],
  ])}${table(
    ['Slot', 'Proposed starter', 'Projection'],
    ['QB', 'RB', 'WR', 'TE'].map((pos) => {
      const p = available
        .map((id) => decisionFixture[id])
        .filter((p) => p.pos === pos)
        .sort((a, b) => b.proj - a.proj)[0];
      return [
        pos,
        p ? decisionProfileButton(p.id) : 'Unfilled',
        p ? decisionPoints(p.proj) : 'Unavailable',
      ];
    }),
  )}<h3>Try an alternative</h3><div class="decision-exclusions">${roster
    .map((id) => {
      const p = decisionFixture[id];
      return `<label class="decision-check"><input type="checkbox" data-decision-exclude="${id}" ${decisionExcluded.has(id) ? 'checked' : ''} ${p.status === 'Game locked' ? 'disabled' : ''}> Exclude ${p.name} <small>${p.status}</small></label>`;
    })
    .join(
      '',
    )}</div><p class="muted">Read-only fixture scenario. Locked players stay included; byes project zero. Unknown locks and incomplete projections must remain explicit in production.</p>`;
}
function decisionWaivers() {
  const pool = [6, 7],
    roster = decisionRosters[decisionLeague ? 3 : 0],
    p = decisionFixture[decisionCandidate],
    drop = decisionFixture[decisionDrop],
    before = decisionBest(roster),
    after = decisionBest(roster.filter((id) => id !== decisionDrop).concat(decisionCandidate)),
    valid = drop && roster.includes(drop.id) && drop.pos === p.pos && drop.status !== 'Game locked';
  return `<div class="sectionhead"><p>Week 7 · Ownership checked ${decisionRefreshed ? 'just now' : '9:45 PM'}<br>Sample rosters: 12 of 12 covered</p>${decisionButton('Refresh available players', 'waiver-refresh')}</div><div class="decision-controls">${decisionSelect(
    'Available-player position',
    'waiver-position',
    [
      ['', 'All positions'],
      ['WR', 'WR'],
      ['RB', 'RB'],
    ],
    decisionWaiverPos,
  )}${decisionSelect(
    'Unowned candidate',
    'candidate',
    pool
      .filter((id) => !decisionWaiverPos || decisionFixture[id].pos === decisionWaiverPos)
      .map((id) => [
        id,
        `${decisionFixture[id].name} · ${decisionFixture[id].pos} · ${decisionPoints(decisionFixture[id].proj)} projected`,
      ]),
    decisionCandidate,
  )}${decisionSelect('Hypothetical roster drop', 'drop', [['', 'Choose same-position drop'], ...roster.filter((id) => decisionFixture[id].pos === p.pos && decisionFixture[id].status !== 'Game locked').map((id) => [id, decisionFixture[id].name])], valid ? decisionDrop : '')}</div>${
    valid
      ? `${strip([
          ['Before', decisionPoints(before)],
          ['After', decisionPoints(after)],
          ['Fixture lineup change', decisionSign(after - before)],
        ])}<p>Add ${decisionProfileButton(p.id)}; drop ${decisionProfileButton(drop.id)}.</p>`
      : '<p role="status">Choose a same-position, unlocked roster drop to inspect the scenario.</p>'
  }${decisionEvidence()}<p class="muted">Illustrative current-week optimization. Verify provider restrictions, locks, roster limits and availability before acting. Reserve/taxi and unsupported scoring rules remain explicit in production. No transaction is submitted.</p>`;
}
function decisionOverview() {
  return (
    heading(
      'My weekly overview',
      'All your matchups, with advice ready when you need it.',
      btn('Refresh all leagues', 'refresh'),
    ) +
    `<div class="overview-league-grid">${[0, 3]
      .map((gameIndex, i) => {
        const g = sampleGames[gameIndex];
        return `<section class="workspace overview-league"><div class="content">${head(g.league, 'Week 7 · Sample roster captured 5 minutes ago', `<span class="pill">${i ? 'ESPN' : 'Sleeper'}</span>`)}${select('Managed team in ' + g.league, [g.home, ...teams.filter((t) => t !== g.home)])}${strip(
          [
            ['Record', i ? '3–3' : '5–1'],
            ['Power rank', i ? '5' : '1'],
            ['Playoff estimate', i ? '52%' : '92%'],
          ],
        )}<div class="overview-matchup"><div><small>Your team</small><h3>${g.home}</h3><strong>${g.homeScore.toFixed(1)}</strong><small>Projected ${(g.homeScore + 24.2).toFixed(1)}</small></div><span>vs.</span><div><small>Opponent</small><h3>${g.away}</h3><strong>${g.awayScore.toFixed(1)}</strong><small>Projected ${(g.awayScore + 27.3).toFixed(1)}</small></div></div>${!i && !decisionDismissed.has(i) ? `<div class="notice"><strong>Breece Hall is on bye</strong><p>Review your RB slot before kickoff.</p>${decisionButton('Review lineup', `lineup:${i}`)} ${decisionButton('Dismiss alert', `dismiss:${i}`)}</div>` : ''}<div class="decision-advice-actions">${decisionButton('Lineup advisor', `lineup:${i}`)}${decisionButton('Waiver advisor', `waiver:${i}`)}${decisionButton('Dismissed alerts', `alerts:${i}`)}</div><div class="actions">${btn('Rankings', 'overviewGo:' + i + ':0')}${btn('Season insights', 'overviewGo:' + i + ':5')}${btn('Playoffs', 'overviewGo:' + i + ':6')}${btn('Live matchup', 'overviewGo:' + i + ':4')}</div><p class="muted">Playoff estimates are not calibrated odds.</p></div></section>`;
      })
      .join('')}</div>`
  );
}
function decisionShowDialog() {
  const content = decisionDialog === 'waiver' ? decisionWaivers() : decisionLineup(),
    title = decisionDialog === 'waiver' ? 'Waiver advisor' : 'Lineup advisor';
  if ($('#dialog').open) $('#dialog-body').innerHTML = `<h2>${title}</h2>${content}`;
  else modal(title, content);
}
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-decision]');
  if (!target) return;
  const [action, a, b, c] = target.dataset.decision.split(':');
  if (action === 'sources') {
    if ($('#dialog').open) {
      $('#dialog-body').innerHTML =
        `<h2>Projection sources & coverage</h2>${decisionSources()}${decisionDialog ? decisionButton('Back to advice', 'advice-back') : ''}`;
    } else modal('Projection sources & coverage', decisionSources());
    return;
  }
  if (action === 'advice-back') {
    decisionShowDialog();
    return;
  }
  if (action === 'profile') {
    modal(decisionFixture[+a].name, decisionPlayerEvidence(+a));
    return;
  }
  if (action === 'compare') {
    decisionCompare.has(+a) ? decisionCompare.delete(+a) : decisionCompare.add(+a);
    if ($('#dialog').open) $('#dialog').close();
  }
  if (action === 'compare-clear') decisionCompare.clear();
  if (action === 'filters-reset') {
    decisionQuery = '';
    decisionPosition = '';
  }
  if (action === 'send') {
    decisionSends[+a].has(+b) ? decisionSends[+a].delete(+b) : decisionSends[+a].add(+b);
    decisionConfirmed = false;
  }
  if (action === 'trade-reset') {
    decisionSends = [new Set(), new Set()];
    decisionSlots = 0;
    decisionConfirmed = false;
  }
  if (action === 'inspect') {
    decisionTeamIds = [decisionTeamIds[0], +a];
    decisionSends = [new Set([+b]), new Set([+c])];
    decisionSlots = 0;
    decisionConfirmed = false;
    tab = 'Build a trade';
  }
  if (action === 'lineup' || action === 'waiver') {
    decisionLeague = +a;
    decisionDialog = action;
    decisionExcluded.clear();
    decisionCandidate = 6;
    decisionDrop = decisionRosters[decisionLeague ? 3 : 0].find(
      (id) => decisionFixture[id].pos === 'WR',
    );
    decisionShowDialog();
    return;
  }
  if (action === 'waiver-refresh') {
    decisionRefreshed = true;
    decisionShowDialog();
    return;
  }
  if (action === 'dismiss') decisionDismissed.add(+a);
  if (action === 'alerts') {
    modal(
      'Dismissed alerts',
      decisionDismissed.has(+a)
        ? `<p>Breece Hall · Week 7 bye</p>${decisionButton('Restore alert', `restore:${a}`)}`
        : '<p>No dismissed alerts for this team.</p>',
    );
    return;
  }
  if (action === 'restore') {
    decisionDismissed.delete(+a);
    $('#dialog').close();
  }
  render();
});
document.addEventListener('change', (e) => {
  if (e.target.dataset.decisionExclude !== undefined) {
    const id = +e.target.dataset.decisionExclude;
    e.target.checked ? decisionExcluded.add(id) : decisionExcluded.delete(id);
    decisionShowDialog();
    return;
  }
  const key = e.target.dataset.decisionField;
  if (!key) return;
  if (key === 'player-position') decisionPosition = e.target.value;
  if (key === 'range-start') decisionRange[0] = +e.target.value;
  if (key === 'range-end') decisionRange[1] = +e.target.value;
  if (key === 'idea-team' || key.startsWith('trade-team-')) {
    decisionTeamIds[key === 'idea-team' ? 0 : +key.slice(-1)] = +e.target.value;
    decisionSends = [new Set(), new Set()];
    decisionConfirmed = false;
  }
  if (key === 'slots') {
    decisionSlots = Math.max(0, +e.target.value);
    decisionConfirmed = false;
  }
  if (key === 'confirm') decisionConfirmed = e.target.checked;
  if (key === 'waiver-position') {
    decisionWaiverPos = e.target.value;
    decisionCandidate = decisionWaiverPos === 'RB' ? 7 : 6;
    decisionDrop = -1;
  }
  if (key === 'candidate') {
    decisionCandidate = +e.target.value;
    decisionDrop = -1;
  }
  if (key === 'drop') decisionDrop = e.target.value === '' ? -1 : +e.target.value;
  if (['waiver-position', 'candidate', 'drop'].includes(key)) {
    decisionShowDialog();
    return;
  }
  render();
});
document.addEventListener('input', (e) => {
  if (e.target.hasAttribute('data-decision-search')) {
    decisionQuery = e.target.value;
    const start = e.target.selectionStart;
    render();
    const input = $('[data-decision-search]');
    input.focus();
    input.setSelectionRange(start, start);
  }
  if (e.target.hasAttribute('data-decision-roster'))
    e.target
      .closest('.decision-trade-side')
      .querySelectorAll('[data-decision-row]')
      .forEach(
        (row) =>
          (row.hidden = !row.textContent.toLowerCase().includes(e.target.value.toLowerCase())),
      );
});
renderers[1] = decisionPlayers;
renderers[2] = decisionTrades;
renderers[3] = decisionOverview;
