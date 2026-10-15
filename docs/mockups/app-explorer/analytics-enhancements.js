// Focused, illustrative analytics views. No production reports or calculations are changed.
const analyticsState = {
  positionMode: 'Projected remaining weeks',
  positionSort: 'Total points',
  scoringTeam: 'All teams',
  former: false,
  metric: 'Make playoffs',
  cutoff: '6',
  advanced: 'Convergence',
  calibrated: false,
  calibrationRuns: 0,
  scheduleTeam: teams[0],
};
const analyticsColors = ['#3949ab', '#176b50', '#b55d14', '#9d4282', '#267b9d', '#7b641a'];
const analyticsPositions = ['QB', 'RB', 'WR', 'TE'];
const analyticsWeeks = [1, 2, 3, 4, 5, 6];
const analyticsSelect = (label, options, key) =>
  `<label>${label}<select data-analytics-select="${key}" aria-label="${esc(label)}">${options.map((value) => `<option ${analyticsState[key] === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>`;
const analyticsButton = (text, action, extra = '') =>
  `<button data-analytics="${action}" ${extra}>${text}</button>`;
const analyticsTable = (title, heads, rows) =>
  `<section class="analytics-table" aria-label="${esc(title)}">${head(title, '', mockCsvButton())}${table(heads, rows)}</section>`;
const analyticsTip = (label, text) => `${label} ${helpTip(label, text)}`;
function analyticsSeriesChart(series, label, percentage = false) {
  const max = percentage ? 100 : Math.ceil(Math.max(...series.flatMap((s) => s.values)) / 25) * 25;
  return `<div class="analytics-chart"><svg viewBox="0 0 760 240" role="img" aria-label="${esc(label)}. Exact values follow in the table.">${[0, 1, 2, 3, 4].map((i) => `<path d="M45 ${195 - i * 40} H730" stroke="#dce2ee"/><text x="4" y="${199 - i * 40}">${((max * i) / 4).toFixed(max < 1 ? 2 : 0)}${percentage ? '%' : ''}</text>`).join('')}${series.map((s, i) => `<polyline points="${s.values.map((v, w) => `${50 + w * 134},${195 - (v / max) * 160}`).join(' ')}" fill="none" stroke="${analyticsColors[i]}" stroke-width="2.5" ${i > 2 ? 'stroke-dasharray="6 3"' : ''}/>${s.values.map((v, w) => `<circle cx="${50 + w * 134}" cy="${195 - (v / max) * 160}" r="3" fill="${analyticsColors[i]}"><title>${esc(s.name)} week ${w + 1}: ${v}${percentage ? '%' : ''}</title></circle>`).join('')}`).join('')}${analyticsWeeks.map((w, i) => `<text x="${42 + i * 134}" y="225">W${w}</text>`).join('')}</svg><ul class="analytics-legend">${series.map((s, i) => `<li><span style="background:${analyticsColors[i]}"></span>${esc(s.name)}</li>`).join('')}</ul></div>`;
}
function analyticsScores() {
  return teams.flatMap((name, i) =>
    analyticsWeeks.map((week) => {
      const actual = +(112 + ((week * 13 + i * 7) % 37) - i * 4).toFixed(1);
      const projected = +(118 + ((week * 5 + i * 3) % 19) - i * 3).toFixed(1);
      const best = +(actual + 4 + ((week + i) % 12)).toFixed(1);
      const retained = 7 + ((week + i) % 3);
      return { name, week, actual, projected, best, retained, slots: 9 };
    }),
  );
}
function expandedInsights() {
  const navigation = tabs([
    'Team scoring',
    'Weekly trends',
    'Roster strength',
    'Remaining schedule',
    'Manager report card',
    'Trades',
    'Pickups',
  ]);
  let body = '';
  if (tab === 'Team scoring') {
    body = analyticsTable(
      'Who delivers every week?',
      [
        'Team',
        'Avg. points',
        'Best week',
        'Above median',
        'Avg. vs. projection',
        'Beat projection',
        'Best legal / wk',
        'Start accuracy',
      ],
      teams.map((name, i) => [
        `${analyticsButton(name, 'team:' + i)}<small>${managers[i]}</small>`,
        (124.8 - i * 5.6).toFixed(1),
        (146.8 - i * 5).toFixed(1),
        `${Math.max(1, 5 - i)} / 6`,
        (8.4 - i * 2.1).toFixed(1),
        `${Math.max(1, 4 - i)} / 6`,
        (141.2 - i * 4).toFixed(1),
        `${(((48 - i) / 54) * 100).toFixed(1)}% (${48 - i} / 54)`,
      ]),
    );
    body += `<p>${analyticsTip('Best legal / wk', 'Highest scoring lineup using eligible starters and bench, respecting roster slots.')} ${analyticsTip('Start accuracy', 'Actual starters retained in the best legal lineup divided by legal slots, weighted across covered weeks.')}</p>`;
    body += detail(
      'Lineup coverage',
      'Six illustrative completed weeks per team; best-lineup totals and accuracy remain unavailable if player scores, position eligibility or roster slots are missing. Zero and negative points remain valid.',
    );
  } else if (tab === 'Weekly trends') {
    const rows = analyticsScores().filter(
      (r) => analyticsState.scoringTeam === 'All teams' || r.name === analyticsState.scoringTeam,
    );
    const names = [...new Set(rows.map((r) => r.name))];
    body =
      head(
        'Weekly scoring',
        'Actual starter scoring, with every legal-lineup detail one click away.',
      ) +
      analyticsSelect('Team', ['All teams', ...teams], 'scoringTeam') +
      analyticsSeriesChart(
        names.map((name) => ({
          name,
          values: rows.filter((r) => r.name === name).map((r) => r.actual),
        })),
        'Completed-week actual scores',
      );
    body += analyticsTable(
      'Exact weekly scores',
      [
        'Team',
        'Week',
        'Actual points',
        'Projected points',
        'Difference',
        'Best legal lineup',
        'Missed points',
        'Start accuracy',
      ],
      rows.map((r) => [
        r.name,
        r.week,
        r.actual.toFixed(1),
        r.projected.toFixed(1),
        (r.actual - r.projected).toFixed(1),
        r.best.toFixed(1),
        (r.best - r.actual).toFixed(1),
        `${((r.retained / r.slots) * 100).toFixed(1)}% (${r.retained} / ${r.slots})`,
      ]),
    );
  } else if (tab === 'Roster strength') {
    body = analyticsRosterStrength();
  } else if (tab === 'Remaining schedule') {
    body = analyticsSchedule();
  } else if (tab === 'Manager report card') {
    const names = analyticsState.former ? [...managers, 'Morgan Patel (former)'] : managers;
    body =
      head(
        'Who is winning the season?',
        'Compare scoring and decisions over the same covered weeks.',
      ) +
      `<label class="analytics-check"><input type="checkbox" data-analytics-select="former" ${analyticsState.former ? 'checked' : ''}> Include former managers in summary</label>`;
    body += analyticsTable(
      'Manager report card',
      [
        'Manager',
        'Weeks covered',
        'Avg. vs. median',
        'Trade value / wk',
        'Graded trades',
        'Pickup lift / start',
        'Rated pickups',
        'Best legal / wk',
        'Start accuracy',
      ],
      names.map((name, i) => [
        name,
        i === 6 ? '3 / 6' : '6 / 6',
        (12.8 - i * 4.2).toFixed(1),
        i < 4 ? (5.6 - i).toFixed(1) : 'Unavailable',
        i < 4 ? 4 - i : 0,
        (6.4 - i * 0.9).toFixed(1),
        7 - i,
        (141.2 - i * 4).toFixed(1),
        `${88 - i * 2}%`,
      ]),
    );
    body += detail(
      'Leader thresholds & coverage',
      'Trade leaders require at least 3 graded trades, pickup leaders at least 5 rated pickups, and scoring leaders at least 4 weeks. Move quality is measured per move rather than rewarding volume. Ownership changes and missing windows stay explicit.',
    );
  } else if (tab === 'Trades') {
    body =
      analyticsTable(
        'Trade results',
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
      ) +
      detail(
        'Assessment rules',
        'Equal first four post-trade weeks, positional median starter baselines, player scoring including bench points, draft picks excluded, and explicit insufficient-data / too-close-to-call verdicts.',
      );
  } else {
    const rows = [
      ['Jayden Reed', teams[0], '3', 'WR median starter', '16.2', '9.8', '+6.4', '3'],
      ['Jordan Addison', teams[2], '4', 'WR median starter', '14.0', '9.8', '+4.2', '2'],
    ].filter(
      (r) => analyticsState.scoringTeam === 'All teams' || r[1] === analyticsState.scoringTeam,
    );
    body =
      analyticsSelect('Team', ['All teams', ...teams], 'scoringTeam') +
      analyticsTable(
        'Pickup value',
        [
          'Pickup',
          'Team',
          'Added week',
          'Baseline',
          'Avg. player points',
          'Avg. baseline points',
          'Lift / start',
          'Retained starts',
        ],
        rows,
      ) +
      detail(
        'Pickup coverage',
        'Only starts while the player remained on the acquiring team count. At least two comparable starts are required. Coverage gaps and baseline limits remain explicit.',
      );
  }
  return (
    heading(
      'Season insights',
      'Scoring, roster strength and decisions, one focused view at a time.',
      btn('Refresh report', 'refresh') +
        btn('Share report', 'share') +
        btn('Export report', 'export'),
    ) +
    context() +
    `<section class="workspace analytics-workspace">${navigation}<div class="analytics-content">${body}${method}</div></section>`
  );
}
function analyticsRosterStrength() {
  const completed = analyticsState.positionMode === 'Completed weeks only';
  const rows = teams.map((name, i) => ({
    name,
    i,
    points: analyticsPositions.map((_, p) =>
      Math.round((completed ? 120 : 155) + ((i * 37 + p * 53) % 130)),
    ),
  }));
  const p = analyticsPositions.indexOf(analyticsState.positionSort.replace(' strength', ''));
  rows.sort((a, b) =>
    p < 0
      ? b.points.reduce((x, y) => x + y) - a.points.reduce((x, y) => x + y)
      : b.points[p] - a.points[p],
  );
  const rank = (r, p) => 1 + rows.filter((other) => other.points[p] > r.points[p]).length;
  return (
    head(
      'Roster strength',
      completed
        ? 'Actual starters through week 6, grouped by primary position.'
        : 'Best legal projected lineups across remaining regular-season weeks.',
    ) +
    `<div class="tools">${analyticsSelect('Scoring window', ['Projected remaining weeks', 'Completed weeks only'], 'positionMode')}${analyticsSelect('Sort charts by', ['Total points', ...analyticsPositions.map((p) => p + ' strength')], 'positionSort')}</div><p class="analytics-note">${completed ? 'Weeks 1–6 · actual starter points · 6 / 6 covered weeks' : 'Weeks 7–14 · sample provider projections · refreshed just now'} · PPR scoring. Rank 1 is strongest; tied values share rank.</p>` +
    analyticsTable(
      'Position group rankings',
      ['Team', ...analyticsPositions],
      rows.map((r) => [
        r.name,
        ...r.points.map(
          (value, p) =>
            `<span class="analytics-rank" style="--rank-fill:${0.08 + (7 - rank(r, p)) * 0.06}"><strong>#${rank(r, p)}</strong><small>${value} pts</small></span>`,
        ),
      ]),
    ) +
    `<section class="analytics-stacked" aria-label="${completed ? 'Actual' : 'Projected'} roster totals"><h3>${completed ? 'Completed scoring' : 'Remaining roster projections'}</h3><ul class="analytics-legend">${analyticsPositions.map((p, i) => `<li><span style="background:${analyticsColors[i]}"></span>${p}</li>`).join('')}</ul>${rows.map((r) => `<div class="analytics-stack-row"><span>${r.name}</span><div class="analytics-stack" style="width:${((r.points.reduce((a, b) => a + b, 0) / Math.max(...rows.map((x) => x.points.reduce((a, b) => a + b, 0)))) * 100).toFixed(1)}%">${r.points.map((value, i) => `<span style="flex:${value};background:${analyticsColors[i]}" title="${analyticsPositions[i]} ${value} points">${analyticsPositions[i]} ${value}</span>`).join('')}</div><strong>${r.points.reduce((a, b) => a + b)} pts</strong></div>`).join('')}</section>` +
    detail(
      'Projection and coverage rules',
      completed
        ? 'Actual starters only; flex is grouped by primary position once. Historical roster data is used, without current-roster forecasts. Coverage starts at the configured reporting start; missing opening/intermediate weeks leave affected teams unranked.'
        : 'Current starters and bench are optimized into legal weekly slots. Availability, bye weeks and flex eligibility are respected; reserves excluded. Missing projections remain unavailable rather than zero. Unsupported positions are identified separately; historical seasons never use current forecasts.',
    )
  );
}
function analyticsSchedule() {
  const opponentTeam = teams.indexOf(analyticsState.scheduleTeam);
  return (
    head('Remaining schedule', 'Which teams have the clearest path from week 7 through week 14?') +
    `<p class="analytics-note">${analyticsTip('Difficulty in points per week', 'Average remaining opponent strength minus the league baseline for the same weeks. Lower is easier; zero means league average.')} · Sample provider projections, refreshed just now.</p>` +
    analyticsTable(
      'Remaining schedule difficulty',
      [
        'Team',
        'Easiest-first rank',
        'Difficulty · pts / week',
        'Measured opponent weeks',
        'Historical fallback',
      ],
      teams.map((name, i) => [
        name + (i === 0 ? '<small>Your team</small>' : ''),
        '#' + (i + 1),
        (i * 3.2 - 8).toFixed(1),
        '8 / 8',
        '0 weeks',
      ]),
    ) +
    analyticsSelect('Weekly opponents for', teams, 'scheduleTeam') +
    analyticsTable(
      analyticsState.scheduleTeam + ' remaining opponents',
      ['Week', 'Opponent', 'Expected points', 'League baseline', 'Difference', 'Source'],
      Array.from({ length: 8 }, (_, w) => [
        w + 7,
        teams[(opponentTeam + (w % 5) + 1) % 6],
        (119 + opponentTeam * 3.2 + w).toFixed(1),
        (127 + w).toFixed(1),
        (opponentTeam * 3.2 - 8).toFixed(1),
        'Sample weekly projections',
      ]),
    ) +
    detail(
      'Schedule rules & unavailable states',
      'Only uncompleted known regular-season matchups count. Repeated opponents and multiweek games follow league rules. Unknown playoff opponents are excluded. Missing schedules/projections stay unranked; no remaining games displays season complete. Historical-strength fallback and as-of cutoff are disclosed per opponent.',
    )
  );
}
function analyticsProbabilities(metric) {
  const ends =
    metric === 'Win title'
      ? [26, 22, 19, 16, 11, 6]
      : metric === 'Reach semifinal'
        ? [68, 58, 47, 40, 25, 12]
        : [92, 86, 72, 58, 32, 14];
  return teams.map((name, i) => ({
    name,
    values: analyticsWeeks.map(
      (w) => +Math.max(0, ends[i] + (w - 6) * (i < 3 ? 3.1 : -2.2)).toFixed(1),
    ),
  }));
}
function expandedPlayoffs() {
  const navigation = tabs(['Forecast table', 'Week-by-week chart', 'Advanced']);
  let body;
  if (tab === 'Forecast table') {
    const cutoff = Number(analyticsState.cutoff);
    const series = analyticsProbabilities('Make playoffs');
    body =
      head(
        'The playoff field',
        'Qualification and every configured round, from the selected cutoff.',
      ) + analyticsSelect('Forecast through week', ['6', '5', '4', '3', '2', '1'], 'cutoff');
    if (cutoff < 3)
      body +=
        '<p class="analytics-warning" role="note">Early-season estimate: only ' +
        cutoff +
        ' completed scoring weeks. Small samples make these forecasts especially uncertain.</p>';
    body += analyticsTable(
      'Playoff probabilities',
      [
        'Team',
        'Projected record',
        'Make playoffs',
        'Earn bye',
        'Reach semifinal',
        'Reach final',
        'Win title',
      ],
      teams.map((name, i) => [
        name,
        `${(9.6 - i * 0.8 + (cutoff - 6) * 0.1).toFixed(1)}–${(4.4 + i * 0.8 - (cutoff - 6) * 0.1).toFixed(1)}`,
        series[i].values[cutoff - 1] + '%',
        [44, 30, 16, 8, 2, 0][i] + '%',
        Math.min(series[i].values[cutoff - 1], [68, 58, 47, 40, 25, 12][i]) + '%',
        [45, 39, 34, 29, 20, 10][i] + '%',
        [26, 22, 19, 16, 11, 6][i] + '%',
      ]),
    );
    body += detail(
      'Forecast assumptions & projection coverage',
      'Illustrative six-team field, four playoff places, two byes, 14 regular-season weeks. Actual implementation reads season-specific provider rules, divisions, tiebreakers, reseeding and round lengths. Unsupported formats are unavailable with a reason. Advancement probabilities are unconditional. Real schedules and best legal weekly projected lineups use starters AND bench; missing coverage falls back visibly to historical scoring. Cutoff-only data prevents future leakage.',
    );
    body += `<details><summary>Weekly lineup projection coverage</summary>${analyticsTable(
      'Weekly lineup coverage',
      ['Team', 'Week', 'Legal slots covered', 'Bench replacements', 'Fallback'],
      teams.map((name, i) => [name, '7', '9 / 9', i % 3, 'None']),
    )}<p>Availability and bye exclusions, scoring settings and provider freshness remain visible.</p></details>`;
  } else if (tab === 'Week-by-week chart') {
    const series = analyticsProbabilities(analyticsState.metric);
    body =
      head('How the forecast changed', 'Every team at every completed-week cutoff.') +
      analyticsSelect('Metric', ['Make playoffs', 'Reach semifinal', 'Win title'], 'metric') +
      analyticsSeriesChart(series, analyticsState.metric + ' probabilities', true) +
      analyticsTable(
        'Exact weekly percentages',
        ['Week', ...teams],
        analyticsWeeks.map((w, i) => [w, ...series.map((s) => s.values[i] + '%')]),
      ) +
      detail(
        'Cutoff integrity',
        'Every completed regular-season week is calculated with only inputs available at that cutoff. Toggling the metric preserves selected context and cached results.',
      );
  } else body = analyticsCalibration();
  return (
    heading(
      'Playoff simulation',
      'Follow the field. Open Advanced when you want to evaluate the model.',
      btn('Share report', 'share') + btn('Export report', 'export'),
    ) +
    context() +
    `<section class="workspace analytics-workspace">${navigation}<div class="analytics-content">${body}<p class="analytics-note">Illustrative forecasts, not calibrated odds. Sampling noise and real-world uncertainty remain separate; 0% and 100% are not official elimination or clinching claims.</p></div></section>`
  );
}
function analyticsCalibration() {
  let body =
    head(
      'Historical calibration',
      'Replay prior seasons using only information available at each cutoff.',
    ) +
    `<div class="actions">${analyticsButton(analyticsState.calibrated ? 'Rerun sample calibration' : 'Run sample calibration', 'calibrate')}${analyticsButton('Download sample calibration JSON', 'json', analyticsState.calibrated ? '' : 'disabled')}</div><p class="analytics-note">Sample workflow only. Current projections and injuries are excluded. Predictive evaluation excludes final known-outcome cutoffs.</p>`;
  if (!analyticsState.calibrated)
    return (
      body +
      '<p class="analytics-empty">Run sample calibration to explore convergence, diagnostics, reliability and final seeding checks.</p>'
    );
  body += `<p role="status">Sample calibration complete · 3 seasons · 252 team-week predictions · run ${analyticsState.calibrationRuns}</p><div class="analytics-local-tabs" aria-label="Calibration views">${['Convergence', 'Weekly diagnostics', 'Season comparisons', 'Reliability', 'Final seeding'].map((name) => analyticsButton(name, 'advanced:' + name, `aria-pressed="${analyticsState.advanced === name}"`)).join('')}</div>`;
  if (analyticsState.advanced === 'Convergence')
    body +=
      analyticsSeriesChart(
        [
          { name: 'Model Brier error × 100', values: [22, 20, 18, 15, 13, 11] },
          { name: 'Standings benchmark × 100', values: [24, 23, 21, 18, 16, 15] },
          { name: 'Equal-chance baseline × 100', values: [25, 25, 25, 25, 25, 25] },
        ],
        'Predictive convergence; lower Brier error is better',
      ) +
      analyticsTable(
        'Convergence exact values',
        ['Week', 'Model Brier', 'Standings Brier', 'Equal-chance Brier', 'Evaluated predictions'],
        analyticsWeeks.map((w, i) => [
          w,
          [0.22, 0.2, 0.18, 0.15, 0.13, 0.11][i].toFixed(3),
          [0.24, 0.23, 0.21, 0.18, 0.16, 0.15][i].toFixed(3),
          '.250',
          '42',
        ]),
      );
  else if (analyticsState.advanced === 'Weekly diagnostics')
    body += analyticsTable(
      'Weekly playoff forecast accuracy',
      [
        'Week',
        'Model Brier',
        'Standings Brier',
        'Equal-chance Brier',
        'Model log loss',
        'Standings log loss',
        'Equal-chance log loss',
        'Qualification accuracy',
        'Predictions',
      ],
      analyticsWeeks.map((w, i) => [
        w,
        (0.24 - i * 0.025).toFixed(3),
        (0.25 - i * 0.018).toFixed(3),
        '.250',
        (0.68 - i * 0.04).toFixed(3),
        (0.69 - i * 0.03).toFixed(3),
        '.693',
        `${67 + i * 4}%`,
        42,
      ]),
    );
  else if (analyticsState.advanced === 'Season comparisons')
    body += analyticsTable(
      'Playoff accuracy by season',
      [
        'Season',
        'Predictive cutoffs',
        'Model Brier',
        'Standings Brier',
        'Skill vs. standings',
        'Model log loss',
        'Known qualifiers',
        'Coverage',
      ],
      [2024, 2023, 2022].map((year, i) => [
        year,
        13,
        (0.17 + i * 0.01).toFixed(3),
        (0.2 + i * 0.01).toFixed(3),
        '+15%',
        (0.51 + i * 0.02).toFixed(3),
        '4 / 4',
        'Complete',
      ]),
    );
  else if (analyticsState.advanced === 'Reliability')
    body += analyticsTable(
      'Cutoff-specific reliability',
      ['Probability band', 'Forecasts', 'Mean probability', 'Observed qualification', 'Coverage'],
      [
        ['0–20%', 28, '12%', '14%', '3 seasons'],
        ['20–40%', 36, '31%', '33%', '3 seasons'],
        ['40–60%', 40, '51%', '48%', '3 seasons'],
        ['60–80%', 30, '71%', '70%', '3 seasons'],
        ['80–100%', 24, '91%', '88%', '3 seasons'],
      ],
    );
  else
    body += analyticsTable(
      'Final seeding rules checks',
      [
        'Season',
        'Known qualifiers',
        'Model final qualifiers',
        'Provider agreement',
        'Predictive sample',
      ],
      [2024, 2023, 2022].map((year) => [
        year,
        '4',
        '4',
        '4 / 4',
        'Excluded: outcomes already known',
      ]),
    );
  return (
    body +
    detail(
      'Interpretation & sample limitations',
      'Brier is mean squared probability error; log loss penalizes confident mistakes. Lower is better. The standings benchmark preserves banked wins, points and schedule while equalizing future scoring strength. Final seeding checks test rules, not prediction. Teams within a season are dependent, and a few seasons do not establish calibration. Missing outcomes are excluded with explicit coverage.',
    )
  );
}
document.addEventListener('change', (event) => {
  const key = event.target.dataset.analyticsSelect;
  if (!key) return;
  analyticsState[key] =
    event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  render();
});
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-analytics]');
  if (!button) return;
  const [action, value] = button.dataset.analytics.split(':');
  if (action === 'team') {
    analyticsState.scoringTeam = teams[Number(value)];
    tab = 'Weekly trends';
    render();
  }
  if (action === 'calibrate') {
    analyticsState.calibrated = true;
    analyticsState.calibrationRuns++;
    render();
  }
  if (action === 'advanced') {
    analyticsState.advanced = value;
    render();
  }
  if (action === 'json') {
    const sample = {
      sample: true,
      note: 'Illustrative mockup payload, not a production calibration replay',
      context: {
        league: contextValues.League || 'Sample league',
        season: contextValues.Season || '2025',
        modelVersion: 'design-sample',
        runs: analyticsState.calibrationRuns,
      },
      coverage: {
        seasons: [2024, 2023, 2022],
        notes: [
          'No credentials or private roster details',
          'Final known-outcome cutoffs excluded from predictive diagnostics',
        ],
      },
      predictions: analyticsProbabilities('Make playoffs').flatMap((series, i) =>
        series.values.map((value, w) => ({
          team: series.name,
          week: w + 1,
          playoffProbability: value / 100,
          qualified: i < 4,
          standingsProbability: (value * 0.8 + 10) / 100,
        })),
      ),
      weeklyMetrics: analyticsWeeks.map((week, i) => ({
        week,
        modelBrier: 0.24 - i * 0.025,
        standingsBrier: 0.25 - i * 0.018,
        equalChanceBrier: 0.25,
        modelLogLoss: 0.68 - i * 0.04,
        standingsLogLoss: 0.69 - i * 0.03,
        equalChanceLogLoss: 0.693,
        predictions: 42,
      })),
      seasonMetrics: [2024, 2023, 2022].map((season, i) => ({
        season,
        predictiveCutoffs: 13,
        modelBrier: 0.17 + i * 0.01,
        standingsBrier: 0.2 + i * 0.01,
        knownQualifiers: 4,
      })),
      historicalInputs: {
        scores: analyticsScores(),
        schedule: teams.map((name, i) => ({
          team: name,
          opponents: analyticsWeeks.map((w) => teams[(i + w) % teams.length]),
        })),
        rules: { playoffTeams: 4, regularSeasonEnd: 14 },
      },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-playoff-calibration.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Sample calibration JSON downloaded.');
  }
});
renderers[5] = expandedInsights;
renderers[6] = expandedPlayoffs;
