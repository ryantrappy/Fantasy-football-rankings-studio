/* Interactive history design fixtures. All data and public links are local previews. */
const historyDemo = {
  group: 'Competition',
  view: 'Rivalries',
  manager: '0',
  league: 'Sample league',
  years: ['2025', '2024', '2023'],
  year: '2025',
  donor: '1',
  opponent: '1',
  minimum: '3',
  matrix: false,
  search: '',
  category: 'Closest games',
  cohort: 'Scoring + margin',
  window: '6 weeks',
  eraYears: '3',
  eraTitles: '2',
  eraWins: '70',
  playoffMin: '3',
  scope: 'Personal recap',
  consent: false,
  sharing: true,
  snapshot: false,
  evidence: '',
  sort: -1,
  descending: false,
  archive: '',
  archiveStatus: '',
  imported: [],
};
const historyGroups = {
  Competition: ['Rivalries', 'Schedule & luck', 'Elo', 'Playoffs'],
  Seasons: ['Season results', 'Manager comparison', 'Achievements'],
  Moments: [
    'Monday miracles',
    'Probability replay',
    'Draft skill',
    'Dropped breakouts',
    'Lineup regrets',
    'Trade impact',
    'Trade network',
    'Archive tools',
  ],
  Profile: [
    'Activity',
    'Player impact',
    'Player loyalty',
    'Draft overlap',
    'Archetypes',
    'Wrapped',
  ],
  'League archive': ['Hall of Fame', 'Hall of Shame', 'Eras', 'Record book', 'Pain Index'],
};
const historyGames = [];
for (const year of [2023, 2024, 2025]) {
  for (let week = 1; week <= 16; week++) {
    for (let a = 0; a < 3; a++) {
      const rounds = [
        [
          [0, 5],
          [1, 4],
          [2, 3],
        ],
        [
          [0, 4],
          [5, 3],
          [1, 2],
        ],
        [
          [0, 3],
          [4, 2],
          [5, 1],
        ],
        [
          [0, 2],
          [3, 1],
          [4, 5],
        ],
        [
          [0, 1],
          [2, 5],
          [3, 4],
        ],
      ];
      const [home, away] = rounds[(week - 1) % 5][a];
      historyGames.push({
        id: `${year}-${week}-${a}`,
        year,
        week,
        a: home,
        b: away,
        sa: +(92 + ((week * 17 + a * 11 + year) % 62) + a / 10).toFixed(1),
        sb: +(87 + ((week * 13 + a * 19 + year) % 65) + week / 10).toFixed(1),
        playoff: week >= 15,
      });
    }
  }
}
const hNames = [
  'Alex Morgan',
  'Blair Davis',
  'Casey Brooks',
  'Devon Lee',
  'Jordan Ellis',
  'Taylor Reed',
];
const hPlayers = [
  'Justin Jefferson',
  'Ja’Marr Chase',
  'CeeDee Lamb',
  'Puka Nacua',
  'Breece Hall',
  'Josh Allen',
];
const hEsc = (value) => esc(value);
const hButton = (label, action, value = '', extra = '') =>
  `<button type="button" data-history="${action}" data-value="${hEsc(value)}" ${extra}>${label}</button>`;
const hTip = (label, text) =>
  typeof helpTip === 'function'
    ? helpTip(label, text)
    : `<span class="h-help" tabindex="0" role="note" aria-label="${hEsc(text)}">${label}<span>${hEsc(text)}</span></span>`;
const hSelect = (label, key, options) =>
  `<label>${label}<select data-history-field="${key}">${options
    .map((item) => {
      const [value, text] = Array.isArray(item) ? item : [item, item];
      return `<option value="${hEsc(value)}" ${String(historyDemo[key]) === String(value) ? 'selected' : ''}>${hEsc(text)}</option>`;
    })
    .join('')}</select></label>`;
const hInput = (label, key, type = 'number', min = 0, max = 100) =>
  `<label>${label}<input type="${type}" data-history-field="${key}" value="${hEsc(historyDemo[key])}" ${type === 'number' ? `min="${min}" max="${max}"` : ''}></label>`;
const hManagerOptions = () => hNames.map((name, index) => [String(index), name]);
const hName = () => hNames[Number(historyDemo.manager)];
const hYear = () => Number(historyDemo.year);
const hGames = () => historyGames.filter((g) => historyDemo.years.includes(String(g.year)));
const hOwnGames = () =>
  hGames().filter(
    (g) => g.a === Number(historyDemo.manager) || g.b === Number(historyDemo.manager),
  );
function hStats(id, games = hGames()) {
  const own = games.filter((g) => g.a === id || g.b === id);
  let wins = 0,
    ties = 0,
    pf = 0,
    pa = 0;
  own.forEach((g) => {
    const a = g.a === id ? g.sa : g.sb,
      b = g.a === id ? g.sb : g.sa;
    wins += a > b ? 1 : 0;
    ties += a === b ? 1 : 0;
    pf += a;
    pa += b;
  });
  return {
    games: own.length,
    wins,
    ties,
    losses: own.length - wins - ties,
    pf,
    pa,
    pct: own.length ? (((wins + ties / 2) / own.length) * 100).toFixed(1) : '0.0',
  };
}
function hTable(headers, rows, note = '') {
  let visible = rows.filter(
    (row) =>
      !historyDemo.search ||
      row
        .join(' ')
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .includes(historyDemo.search.toLowerCase()),
  );
  if (historyDemo.sort >= 0)
    visible = [...visible].sort((a, b) => {
      const clean = (v) => String(v ?? '').replace(/<[^>]*>/g, '');
      const x = clean(a[historyDemo.sort]),
        y = clean(b[historyDemo.sort]);
      const n = parseFloat(x.replaceAll(',', '')) - parseFloat(y.replaceAll(',', ''));
      return (Number.isNaN(n) ? x.localeCompare(y) : n) * (historyDemo.descending ? -1 : 1);
    });
  return `<div class="h-tabletools"><label>Find in this view<input type="search" data-history-search value="${hEsc(historyDemo.search)}" placeholder="Manager, player or season"></label>${hButton('Export visible CSV', 'csv')}</div><div class="table-wrap h-table"><table><thead><tr>${headers.map((header, i) => `<th scope="col">${hButton(hEsc(header) + (historyDemo.sort === i ? (historyDemo.descending ? ' ↓' : ' ↑') : ''), 'sort', i)}</th>`).join('')}</tr></thead><tbody>${visible.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${headers.length}">No matching records. Change the search or selected seasons.</td></tr>`}</tbody></table></div><p class="h-caption">${visible.length} records · ${hEsc(note || 'Illustrative completed-season data; source details open beside each record.')}</p>`;
}
const hEvidenceButton = (title, details) =>
  hButton(hEsc(title), 'evidence', details, 'class="link"');
const hGameName = (game) => `${hNames[game.a].split(' ')[0]} vs ${hNames[game.b].split(' ')[0]}`;
const hGameEvidence = (game) =>
  `${game.year}, week ${game.week}: ${hNames[game.a]} ${game.sa} – ${hNames[game.b]} ${game.sb}. Source: sample ${historyDemo.league} completed matchup. ${game.playoff ? 'Championship bracket; this series consists of one week.' : 'Regular-season matchup.'}`;
const hSeasonLink = (year) => hButton(`${year} season ↗`, 'season', year, 'class="link"');
function hRivalries() {
  const id = Number(historyDemo.manager),
    opponents = hNames.map((name, i) => [name, i]).filter(([, i]) => i !== id);
  const rows = opponents.map(([name, i]) => {
    const games = hOwnGames().filter((g) => g.a === i || g.b === i),
      stats = hStats(id, games);
    const label =
      stats.games < Number(historyDemo.minimum)
        ? 'Insufficient sample'
        : Number(stats.pct) > 60
          ? 'Punching bag'
          : Number(stats.pct) < 40
            ? 'Kryptonite'
            : 'Closest rival';
    return [
      hEvidenceButton(
        name,
        `${hName()} versus ${name}: ${stats.wins}–${stats.losses}–${stats.ties}, ${stats.games} games. ${games.slice(-4).map(hGameEvidence).join(' ')}`,
      ),
      `${stats.wins}–${stats.losses}–${stats.ties}`,
      stats.games,
      `${stats.pct}%`,
      stats.pf.toFixed(1),
      stats.pa.toFixed(1),
      stats.games ? ((stats.pf - stats.pa) / stats.games).toFixed(1) : '—',
      label,
    ];
  });
  const matrix = hNames.map((name, a) => [
    name,
    ...hNames.map((_, b) => {
      if (a === b) return '—';
      const games = hGames().filter((g) => (g.a === a && g.b === b) || (g.a === b && g.b === a)),
        s = hStats(a, games);
      return hButton(
        `${s.wins}–${s.losses}–${s.ties}`,
        'pair',
        `${a},${b}`,
        `class="link" aria-label="${name} versus ${hNames[b]}"`,
      );
    }),
  ]);
  return (
    `<div class="h-controls">${hSelect('Rivalry minimum', 'minimum', ['3', '5', '10'])}${hButton(historyDemo.matrix ? 'Show opponent records' : 'Show league matrix', 'matrix')}${hTip('Rivalry rules', 'Labels require the selected minimum games. Ties count as half a win; absent games never count as losses.')}</div>` +
    (historyDemo.matrix
      ? hTable(['Manager', ...hNames.map((n) => n.split(' ')[0])], matrix)
      : hTable(
          [
            'Opponent',
            'W–L–T',
            'Games',
            'Win %',
            'Points for',
            'Points against',
            'Avg margin',
            'Relationship',
          ],
          rows,
        ))
  );
}
function hSchedule() {
  const yearGames = hGames().filter((g) => g.year === hYear());
  const id = Number(historyDemo.manager),
    donor = Number(historyDemo.donor);
  const weekly = yearGames.filter((g) => g.a === id || g.b === id);
  const rows = weekly.map((g) => {
    const own = g.a === id ? g.sa : g.sb,
      ownOpp = g.a === id ? g.b : g.a;
    const d = yearGames.find((x) => x.week === g.week && (x.a === donor || x.b === donor));
    const opponent = d ? (d.a === donor ? d.b : d.a) : null;
    const score = !d ? null : d.a === donor ? d.sb : d.sa;
    return [
      `Week ${g.week}`,
      own.toFixed(1),
      hNames[ownOpp],
      opponent === null ? 'Unavailable' : hNames[opponent],
      score?.toFixed(1) ?? '—',
      score === null ? 'Unknown' : own > score ? 'Win' : own === score ? 'Tie' : 'Loss',
      hEvidenceButton(
        'Game evidence',
        hGameEvidence(g) + (d ? ' Schedule donor: ' + hGameEvidence(d) : ' Missing donor game.'),
      ),
    ];
  });
  return (
    `<div class="h-controls">${hSelect('Replay season', 'year', historyDemo.years)}${hSelect('Scoring team', 'manager', hManagerOptions())}${hSelect('Schedule donor', 'donor', hManagerOptions())}${hTip('Expected wins', 'Weekly score is compared with every other finite team score, ties half. Actual and expected wins use the same completed weeks. Schedule difficulty uses opponents’ scored points, not opponent record.')}</div>` +
    hTable(
      ['Manager', 'Season', 'Actual wins', 'Expected wins', 'Luck', 'Opponent PPG', 'Usable weeks'],
      hNames.map((name, i) => {
        const s = hStats(i, yearGames),
          ew = +(s.wins + (i % 2 ? -1.4 : 1.2)).toFixed(1);
        return [
          name,
          historyDemo.year,
          s.wins,
          ew,
          (s.wins - ew).toFixed(1),
          s.games ? (s.pa / s.games).toFixed(1) : '—',
          `${s.games}/16`,
        ];
      }),
    ) +
    head('Replay another schedule', `${hName()} scoring against ${hNames[donor]}’s opponents`) +
    hTable(
      [
        'Week',
        'Own score',
        'Original opponent',
        'Donor opponent',
        'Opponent score',
        'Replay result',
        'Source',
      ],
      rows,
      'Same season and scoring rules. Replay is illustrative and does not establish final standings or tiebreakers.',
    )
  );
}
function hElo() {
  const games = hOwnGames();
  let rating = 1500;
  const movement = games.map((g) => {
    const own = g.a === Number(historyDemo.manager) ? g.sa : g.sb,
      other = g.a === Number(historyDemo.manager) ? g.sb : g.sa;
    const previous = rating,
      change = own === other ? 0 : own > other ? 16 : -16;
    rating += change;
    return [
      hSeasonLink(g.year),
      `W${g.week}`,
      hGameName(g),
      previous,
      change > 0 ? '+' + change : change,
      rating,
      hEvidenceButton('Game', hGameEvidence(g)),
    ];
  });
  return (
    hTip(
      'Rating method',
      'Fixture ratings start at 1500 and use a fixed ±16 change against 1500-rated sample opponents (K=32). Production uses chronological opponent ratings and carries across seasons. New managers start at 1500; ties use actual 0.5.',
    ) +
    hTable(
      ['Manager', 'Elo', 'Change', 'Games'],
      hNames.map((name, i) => {
        const s = hStats(i);
        return [name, 1500 + (s.wins - s.losses) * 16, (s.wins - s.losses) * 16, s.games];
      }),
    ) +
    head(`${hName()}’s rating movement`, 'Chronological contributing games') +
    hTable(['Season', 'Week', 'Matchup', 'Before', 'Change', 'After', 'Source'], movement)
  );
}
function hPlayoffs() {
  const rows = hNames.map((name, i) => {
    const regular = hStats(
        i,
        hGames().filter((g) => !g.playoff),
      ),
      post = hStats(
        i,
        hGames().filter((g) => g.playoff),
      );
    return [
      name,
      `${regular.pct}%`,
      `${post.wins}–${post.losses}–${post.ties}`,
      post.games,
      post.games < Number(historyDemo.playoffMin)
        ? 'Insufficient sample'
        : Number(post.pct) > Number(regular.pct)
          ? 'Clutch (+)'
          : 'Under regular rate',
      `${post.pct}%`,
      `${historyDemo.years.length} seasons`,
    ];
  });
  return (
    `<div class="h-controls">${hInput('Minimum playoff games', 'playoffMin', 'number', 1, 20)}${hTip('Postseason definitions', 'Only verified championship-path series count; multiweek series count once. Byes and unknown brackets are not losses. Clutch labels are descriptive and require the minimum sample.')}</div>` +
    hTable(
      [
        'Manager',
        'Regular win %',
        'Playoff W–L–T',
        'Sample',
        'Clutch assessment',
        'Playoff win %',
        'Coverage',
      ],
      rows,
    ) +
    head('Selected manager’s elimination games', hName()) +
    hTable(
      ['Season', 'Week', 'Matchup', 'Score', 'Evidence'],
      hOwnGames()
        .filter((g) => g.playoff)
        .map((g) => [
          hSeasonLink(g.year),
          g.week,
          hGameName(g),
          `${g.sa}–${g.sb}`,
          hEvidenceButton('View game', hGameEvidence(g)),
        ]),
    )
  );
}
function hSeasons() {
  if (historyDemo.view === 'Achievements')
    return hTable(
      ['Season', 'Manager', 'Achievement', 'Value', 'Distinct placement', 'Evidence'],
      historyDemo.years.flatMap((year) => [
        [
          hSeasonLink(year),
          hName(),
          'Scoring leader',
          '2,082.4 pts',
          '1st (shared rank for ties)',
          hEvidenceButton(
            'Season evidence',
            `${year}: all 16 sample weeks loaded, scoring compared across all six managers. Championship placement verified from bracket, not inferred from record.`,
          ),
        ],
        [
          hSeasonLink(year),
          hName(),
          'Best legal lineup week',
          '162.8 pts',
          '2nd',
          hEvidenceButton(
            'Lineup evidence',
            `${year} W8: verified eligibility and starting slots; 162.8 actual, 169.2 optimal legal points.`,
          ),
        ],
      ]),
    );
  if (historyDemo.view === 'Manager comparison')
    return (
      `<div class="h-controls">${hSelect('Compare with', 'opponent', hManagerOptions())}${hTip('Comparison coverage', 'The same selected seasons and scoring context are used. Ties share placement; provider manager IDs connect name changes.')}</div>` +
      hTable(
        ['Metric', hName(), hNames[Number(historyDemo.opponent)], 'Coverage'],
        [
          [
            'Overall win %',
            hStats(Number(historyDemo.manager)).pct + '%',
            hStats(Number(historyDemo.opponent)).pct + '%',
            historyDemo.years.length + ' complete seasons',
          ],
          ['Expected wins', '25.4', '22.6', '48 comparable weeks'],
          ['Championships', '1', '0', '3 verified brackets'],
          ['Weighted start accuracy', '88.4%', '83.6%', '42 eligible weeks'],
          ['Average finish', '2.3', '3.7', 'Distinct final placements'],
        ],
      )
    );
  return hTable(
    [
      'Season',
      'Team / manager',
      'W–L–T',
      'Points for',
      'Points against',
      'Final placement',
      'History coverage',
    ],
    historyDemo.years.map((year, i) => {
      const s = hStats(
        Number(historyDemo.manager),
        hGames().filter((g) => String(g.year) === year),
      );
      return [
        hSeasonLink(year),
        `${hName()} / ${teams[Number(historyDemo.manager)]}`,
        `${s.wins}–${s.losses}–${s.ties}`,
        s.pf.toFixed(1),
        s.pa.toFixed(1),
        i === 0 ? 'Champion' : `${i === 1 ? '2nd' : '3rd'} · verified bracket`,
        `${s.games}/16 completed games; 10 starters per week`,
      ];
    }),
  );
}
function hRecords() {
  const category = historyDemo.category;
  let games = [...hGames()];
  games.sort((a, b) =>
    category === 'Closest games'
      ? Math.abs(a.sa - a.sb) - Math.abs(b.sa - b.sb)
      : category === 'Blowouts'
        ? Math.abs(b.sa - b.sb) - Math.abs(a.sa - a.sb)
        : category === 'Combined weekly scoring'
          ? b.sa + b.sb - a.sa - a.sb
          : Math.min(b.sa, b.sb) - Math.min(a.sa, a.sb),
  );
  const controls = `<div class="h-controls">${hSelect('Record category', 'category', ['Closest games', 'Blowouts', 'Combined weekly scoring', 'Individual weekly scoring', 'Worst beats'])}${hTip('Weekly and series scoring', 'Combined and individual scoring records use individual weeks, including multiweek playoff series. Closest games and blowouts use series totals. Weekly ranks need finite scores for every team; ties share competition rank.')}</div>`;
  if (category === 'Individual weekly scoring') {
    const scores = hGames()
      .flatMap((g) => [
        { g, name: hNames[g.a], pts: g.sa },
        { g, name: hNames[g.b], pts: g.sb },
      ])
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 30);
    return (
      controls +
      hTable(
        ['Manager', 'Season', 'Week', 'Weekly points', 'Evidence'],
        scores.map((r) => [
          r.name,
          hSeasonLink(r.g.year),
          r.g.week,
          r.pts,
          hEvidenceButton('View week', hGameEvidence(r.g)),
        ]),
      )
    );
  }
  if (category === 'Worst beats')
    games = games.filter((g) => {
      const weekly = hGames()
        .filter((x) => x.year === g.year && x.week === g.week)
        .flatMap((x) => [x.sa, x.sb])
        .sort((a, b) => b - a);
      return weekly.indexOf(Math.min(g.sa, g.sb)) + 1 <= Math.ceil(weekly.length / 4);
    });
  return (
    controls +
    hTable(
      [
        'Matchup',
        'Season',
        'Week',
        'Scores',
        category === 'Combined weekly scoring' ? 'Combined weekly points' : 'Margin',
        'Weekly ranks',
        'Evidence',
      ],
      games.slice(0, 30).map((g) => {
        const weekly = hGames()
          .filter((x) => x.year === g.year && x.week === g.week)
          .flatMap((x) => [x.sa, x.sb])
          .sort((a, b) => b - a);
        return [
          hGameName(g),
          hSeasonLink(g.year),
          g.week,
          `${g.sa}–${g.sb}`,
          category === 'Combined weekly scoring'
            ? (g.sa + g.sb).toFixed(1)
            : Math.abs(g.sa - g.sb).toFixed(1),
          `${weekly.indexOf(g.sa) + 1} vs ${weekly.indexOf(g.sb) + 1}`,
          hEvidenceButton('Game', hGameEvidence(g)),
        ];
      }),
    )
  );
}
function hArchiveViews() {
  const view = historyDemo.view;
  if (view === 'Record book') return hRecords();
  if (view === 'Eras')
    return (
      `<div class="h-controls">${hInput('Window (seasons)', 'eraYears', 'number', 2, 5)}${hInput('Minimum titles', 'eraTitles', 'number', 1, 5)}${hInput('Minimum regular win %', 'eraWins', 'number', 0, 100)}${hTip('Era evidence', 'Consecutive calendar seasons only. Missing title or season coverage does not bridge a window. Title runs and sustained win-rate eras are distinct.')}</div>` +
      hTable(
        ['Manager', 'Calendar window', 'Titles', 'Regular win %', 'Qualification', 'Evidence'],
        hNames.map((name, i) => [
          name,
          historyDemo.years.slice().sort().join('–'),
          i === 0 ? 2 : 0,
          74 - i * 6,
          historyDemo.years.length < Number(historyDemo.eraYears)
            ? 'Window incomplete'
            : (i === 0 && Number(historyDemo.eraTitles) <= 2) ||
                74 - i * 6 >= Number(historyDemo.eraWins)
              ? 'Qualifies'
              : 'Below threshold',
          hEvidenceButton(
            'Season evidence',
            `${name}: ${historyDemo.years.join(', ')} complete sample seasons. Titles: ${i === 0 ? '2023 and 2025' : 'none'}. Missing years excluded.`,
          ),
        ]),
      )
    );
  if (view === 'Hall of Fame')
    return (
      hTip(
        'Honor weights',
        'Championships 35%, playoff performance 25%, regular wins 20%, scoring 15%, longevity 5%. Unknown components are excluded and disclosed; this score is descriptive.',
      ) +
      hTable(
        [
          'Manager',
          'Honor score',
          'Championships (35%)',
          'Playoffs (25%)',
          'Wins (20%)',
          'Scoring (15%)',
          'Longevity (5%)',
          'Coverage',
        ],
        hNames.map((name, i) => [
          hEvidenceButton(
            name,
            `${name}: ${historyDemo.years.join(', ')}. Component points: championships ${35 - i * 5}, playoffs ${25 - i * 3}, wins ${20 - i * 2}, scoring ${15 - i}, longevity 5. All sample source records available.`,
          ),
          100 - i * 11,
          35 - i * 5,
          25 - i * 3,
          20 - i * 2,
          15 - i,
          5,
          '5/5 metrics',
        ]),
      )
    );
  if (view === 'Hall of Shame')
    return (
      `<div class="h-controls">${hSelect('Record type', 'category', ['Worst season', 'Longest losing streak', 'Lowest weekly score', 'Biggest collapse'])}</div>` +
      hTable(
        ['Record', 'Manager', 'Season', 'Value', 'Coverage', 'Source'],
        hNames.map((name, i) => [
          historyDemo.category,
          name,
          hSeasonLink(historyDemo.years[i % historyDemo.years.length]),
          historyDemo.category === 'Lowest weekly score'
            ? `${65 + i}.2 pts`
            : historyDemo.category === 'Longest losing streak'
              ? `${6 - (i % 3)} losses`
              : historyDemo.category === 'Biggest collapse'
                ? '4–0 start → 6–8 finish'
                : '3–11 season',
          '16/16 weeks',
          hEvidenceButton(
            'Contributing games',
            `${name}: ${historyDemo.category}. Sample weeks 4–9 support the record; source season and completed game scores verified.`,
          ),
        ]),
      )
    );
  if (view === 'Pain Index')
    return (
      `<div class="h-controls">${hSelect('Comparable components', 'cohort', ['Scoring + margin', 'Scoring + margin + archived forecast'])}${hTip('Pain factors', 'Closeness 30%, own percentile 30%, opponent percentile 20%, archived expectation 20%. Missing factors excluded and remaining weights renormalized. Compare only within the same cohort.')}</div>` +
      hTable(
        [
          'Manager',
          'Season / week',
          'Loss score',
          'Margin',
          'Own percentile',
          'Opponent percentile',
          'Archived expectation',
          'Pain score',
          'Evidence',
        ],
        hOwnGames()
          .filter((g) => (g.a === Number(historyDemo.manager) ? g.sa < g.sb : g.sb < g.sa))
          .slice(-8)
          .map((g, i) => [
            hName(),
            `${g.year} W${g.week}`,
            Math.min(g.sa, g.sb),
            Math.abs(g.sa - g.sb).toFixed(1),
            `${85 - i}%`,
            '92%',
            historyDemo.cohort.includes('forecast') ? '74% win chance' : 'Unavailable · excluded',
            (91 - i * 3).toFixed(1),
            hEvidenceButton(
              'Factors & game',
              hGameEvidence(g) +
                ` Cohort: ${historyDemo.cohort}. Closeness contribution 28.2, own percentile 25.5, opponent percentile 18.4; weights renormalized if archive unavailable.`,
            ),
          ]),
      )
    );
  return '';
}
function hMoments() {
  const view = historyDemo.view;
  const seasonControl = `<div class="h-controls">${hSelect('Story season', 'year', historyDemo.years)}${hTip('Evidence coverage', 'Sample records are independent of real provider archives. Missing ADP, rosters, probabilities or transaction identities stay unknown. No queue intent or future pick value is inferred.')}</div>`;
  if (view === 'Archive tools')
    return `${seasonControl}<label class="h-archiveinput">Archive JSON<textarea data-history-archive aria-label="Archive JSON" rows="9" placeholder='{"version":1,"season":2025,"snapshots":[...] }'>${hEsc(historyDemo.archive)}</textarea></label><div class="h-controls">${hButton('Load sample archive', 'archive-sample')}${hButton('Import archive', 'archive-import')}${hButton('Export archive JSON', 'archive-export')}${hButton('Clear imported archive', 'archive-clear')}</div><p role="status">${hEsc(historyDemo.archiveStatus || 'Imports remain local to this preview until exported. Refreshing discards unsaved imports. No account credentials belong in an archive.')}</p>`;
  if (view === 'Monday miracles' || view === 'Probability replay') {
    const game = historyGames.find(
      (g) =>
        g.year === hYear() &&
        (g.a === Number(historyDemo.manager) || g.b === Number(historyDemo.manager)) &&
        g.week === 8,
    );
    const samples = historyDemo.imported.length
      ? historyDemo.imported
      : [
          { time: 'Mon 18:00', probability: 0.12, player: 'Josh Allen', points: 0 },
          { time: 'Mon 19:00', probability: 0.28, player: 'Josh Allen', points: 11.4 },
          { time: 'Mon 20:00', probability: 0.65, player: 'Josh Allen', points: 26.2 },
          { time: 'Final', probability: 1, player: 'Josh Allen', points: 33.6 },
        ];
    const graph = `<svg viewBox="0 0 640 170" class="h-probability" role="img" aria-label="Archived sample win probability: ${samples.map((s) => Math.round(s.probability * 100) + '%').join(', ')}"><path d="M40 20H620 M40 80H620 M40 140H620" stroke="#dce2ee"/><text x="0" y="24">100%</text><text x="8" y="84">50%</text><text x="16" y="144">0%</text><polyline fill="none" stroke="#3949ab" stroke-width="3" points="${samples.map((s, i) => `${40 + (i * 580) / Math.max(1, samples.length - 1)},${140 - s.probability * 120}`).join(' ')}"/>${samples.map((s, i) => `<circle cx="${40 + (i * 580) / Math.max(1, samples.length - 1)}" cy="${140 - s.probability * 120}" r="4" fill="#3949ab"/>`).join('')}</svg>`;
    return (
      seasonControl +
      `<div class="h-controls">${hInput('Maximum pre-Monday win %', 'minimum', 'number', 1, 50)}${hButton('Open archive tools', 'view', 'Archive tools')}${hTip('Snapshot timing', 'These are archived sample observations, not probabilities reconstructed from final scores. Threshold applies to the pre-Monday snapshot; only a final win qualifies as a miracle.')}</div>` +
      (view === 'Monday miracles'
        ? hTable(
            [
              'Manager',
              'Season / week',
              'Pre-Monday chance',
              'Final result',
              'Contributing player',
              'Source',
            ],
            Number(historyDemo.minimum) >= 12
              ? [
                  [
                    hName(),
                    `${historyDemo.year} W8`,
                    '12%',
                    'Won by 2.4',
                    'Josh Allen · 33.6 pts',
                    hEvidenceButton(
                      'Archived snapshots',
                      `${historyDemo.year} W8: pre-Monday 12%, final win by 2.4. Josh Allen contributed 33.6 points. Source: four timestamped sample archive observations.`,
                    ),
                  ],
                ]
              : [],
            '12% sample comeback qualifies only when threshold is at least 12%.',
          )
        : '') +
      head(
        'Archived win probability',
        `${historyDemo.year} · Week 8 · ${game ? hGameName(game) : hName()}`,
      ) +
      graph +
      hTable(
        ['Snapshot time', 'Win probability', 'Player event', 'Player points'],
        samples.map((s) => [
          hEsc(s.time),
          `${Math.round(s.probability * 100)}%`,
          hEsc(s.player),
          s.points,
        ]),
      ) +
      `<p class="h-caption">4 illustrative observations · Sample archive source · Weeks without archives: 1–7 and 9–16, unavailable.</p>`
    );
  }
  if (view === 'Draft skill')
    return (
      seasonControl +
      `<div class="h-controls">${hSelect('Draft baseline', 'category', ['Draft position expectation', 'Available ADP'])}${hSelect('Pick results', 'cohort', ['All picks', 'Best picks', 'Worst picks'])}${hTip('Draft method', 'Compare observed season production under league scoring with the selected draft-position/ADP baseline. Multi-season skill aggregates comparable picks; missing ADP is excluded rather than guessed.')}</div>` +
      hTable(
        [
          'Season',
          'Manager',
          'Pick / ADP',
          'Player',
          'Season points',
          'Expected points',
          'Value above baseline',
          'Sample',
          'Evidence',
        ],
        hPlayers
          .map((name, i) => [
            historyDemo.year,
            hName(),
            `${12 + i * 14} / ${historyDemo.category === 'Available ADP' && i === 5 ? 'Unavailable' : 15 + i * 13}`,
            name,
            260 - i * 18,
            240 - i * 11,
            20 - i * 7,
            `${historyDemo.years.length} seasons · 6 comparable picks`,
            hEvidenceButton(
              'Pick evidence',
              `${historyDemo.year}: ${name}, pick ${12 + i * 14}, ${260 - i * 18} observed points. Baseline ${240 - i * 11} points in the same league scoring. ADP source: sample draft dataset; no queue data.`,
            ),
          ])
          .filter((r, i) =>
            historyDemo.cohort === 'Best picks'
              ? i < 3
              : historyDemo.cohort === 'Worst picks'
                ? i >= 3
                : true,
          ),
      )
    );
  if (view === 'Dropped breakouts')
    return (
      seasonControl +
      `<div class="h-controls">${hSelect('Scoring window', 'window', ['2 weeks', '4 weeks', '6 weeks'])}</div>` +
      hTable(
        [
          'Manager',
          'Dropped player',
          'Transaction date',
          'Window',
          'Subsequent points',
          'Prior baseline',
          'Availability',
          'Evidence',
        ],
        hPlayers
          .slice(0, 3)
          .map((name, i) => [
            hName(),
            name,
            `${historyDemo.year}-10-${10 + i}`,
            historyDemo.window,
            `${Number(historyDemo.window.split(' ')[0]) * (14 + i)} pts`,
            `${9 + i} PPG`,
            'Unowned 3 days; picked up by Blair',
            hEvidenceButton(
              'Transaction / scoring',
              `Drop ${historyDemo.year}-10-${10 + i}: ${name} released by ${hName()}. Only ${historyDemo.window} after the drop counted. Prior two-week baseline ${9 + i} PPG; source transaction identity and availability verified.`,
            ),
          ]),
      )
    );
  if (view === 'Lineup regrets')
    return (
      seasonControl +
      hTable(
        [
          'Manager',
          'Week',
          'Actual / optimal legal',
          'Missed points',
          'Decision',
          'Would result change?',
          'Evidence',
        ],
        [4, 6, 8].map((week, i) => [
          hName(),
          week,
          `${118 + i * 4} / ${135 + i * 4}`,
          17,
          `${hPlayers[i]} benched for ${hPlayers[i + 3]}`,
          i === 0 ? 'Yes: loss → win' : 'No',
          hEvidenceButton(
            'Legal lineup evidence',
            `${historyDemo.year} W${week}: 1QB, 2RB, 2WR, TE, FLEX, K, DST. ${hPlayers[i]} eligible for WR/FLEX, replacing ${hPlayers[i + 3]} adds 17 pts. Full starters and bench verified; actual ${118 + i * 4}, optimal ${135 + i * 4}. ${i === 0 ? 'Opponent 126; optimal changes loss to win.' : 'Opponent 157; no result change.'}`,
          ),
        ]),
      )
    );
  if (view === 'Trade impact')
    return (
      seasonControl +
      `<div class="h-controls">${hSelect('Evaluation window', 'window', ['2 weeks', '6 weeks', 'Rest of season'])}${hTip('Trade assessment', 'Observed scoring, starts actually made and verified playoff contributions are distinct. Picks and future value are unranked. A close result can remain a no-call.')}</div>` +
      hTable(
        [
          'Trade',
          'Managers',
          'Observed points',
          'Retained starts',
          'Playoff contribution',
          'Assessment',
          'Evidence',
        ],
        hPlayers
          .slice(0, 3)
          .map((name, i) => [
            `${historyDemo.year} W${4 + i}`,
            `${hName()} ↔ ${hNames[(Number(historyDemo.manager) + i + 1) % 6]}`,
            `${72 + i * 14} vs ${68 + i * 16}`,
            `${4 + i} vs ${3 + i}`,
            '1 verified playoff start',
            i === 1 ? 'No call · context dependent' : '+4 observed pts',
            hEvidenceButton(
              'Assets / starts',
              `${historyDemo.window}: ${name} exchanged for ${hPlayers[i + 3]}. Received asset 72 observed points, 4 retained starts, one postseason start. Source transaction ${historyDemo.year}-trade-${i}; picks excluded from winner calculation.`,
            ),
          ]),
      )
    );
  if (view === 'Trade network')
    return (
      seasonControl +
      hTable(
        ['Manager pair', 'Trades', 'Assets', 'Source transactions', 'Follow trade tree'],
        hNames
          .filter((n) => n !== hName())
          .map((name, i) => [
            `${hName()} ↔ ${name}`,
            i + 1,
            `${hPlayers[i]} / ${hPlayers[(i + 2) % 6]}`,
            hEvidenceButton(
              'Transactions',
              `${historyDemo.year}: ${i + 1} verified sample transactions between ${hName()} and ${name}. Transaction IDs ${historyDemo.year}-trade-${i}.`,
            ),
            hEvidenceButton(
              'Asset tree',
              `${hPlayers[i]}: drafted by ${hName()} → ${historyDemo.year} W4 traded to ${name} → W7 traded to ${hNames[(i + 3) % 6]}. Provider asset ID establishes continuity. Included pick: future value unresolved; no fabricated player outcome.`,
            ),
          ]),
      )
    );
  return '';
}
function hWrapped() {
  const league = historyDemo.scope === 'League recap';
  return `<div class="h-controls">${hSelect('Recap scope', 'scope', ['Personal recap', 'League recap'])}${hSelect('Recap season', 'year', historyDemo.years)}${hTip('Recap privacy', 'Only preview cards are shared; raw history, provider IDs and other managers’ profiles are excluded. Public snapshots expire after 10 days and can be revoked.')}</div><article class="h-wrapped" aria-label="Wrapped share preview"><p>Fantasy Wrapped · ${historyDemo.year}</p><h2>${league ? historyDemo.league : hName()}</h2><div class="h-recapcards">${(league
    ? [
        ['Champion', hNames[0]],
        ['Scoring leader', hNames[2] + ' · 2,082.4 pts'],
        ['Luck extremes', 'Alex +2.1 wins; Blair −1.4'],
        ['Upset of the year', 'W8 · 12% archived chance → win'],
        ['Closest game', 'W5 · 126.4–126.1'],
        ['Largest blowout', 'W3 · 153.2–87.1'],
        ['Pickup of the year', 'Puka Nacua · 6 retained starts'],
        ['Trade of the year', 'W4 · 4 observed points gained'],
        ['Rivalry of the year', 'Alex vs Blair · 2–2'],
      ]
    : [
        ['Record', '10–6 · 3rd of 6'],
        ['Expected wins / luck', '8.6 expected · +1.4 actual wins'],
        ['Closest rival', 'Blair Davis · 2–2'],
        ['Best matchup', 'W8 · 153.2–108.4'],
        ['Hardest loss', 'W5 · 126.1–126.4'],
        ['Best pickup', 'Puka Nacua · 6 retained starts'],
        ['Lineup choice', 'W4 · optimal legal lineup'],
        ['Guardian angel', 'Josh Allen · 2 wins supported'],
        ['Manager profile', 'Patient builder · 18 retained weeks'],
      ]
  )
    .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
    .join(
      '',
    )}</div><p class="h-caption">16/16 weeks · full bracket · draft and transaction coverage complete · archived probability in W8 only. Unsupported highlights omitted.</p></article><div class="h-controls"><label class="h-checkbox"><input type="checkbox" data-history-field="consent" ${historyDemo.consent ? 'checked' : ''}>Publish this preview to anyone with its link</label>${hButton('Create public Wrapped snapshot', 'wrapped-share', '', historyDemo.consent ? '' : 'disabled')}${hButton(historyDemo.sharing ? 'Revoke public sharing' : 'Enable public sharing', 'revoke')}</div>${historyDemo.snapshot ? `<p role="status">${historyDemo.sharing ? 'Local preview snapshot created · expires October 23, 2026.' : 'Public access disabled, including previous snapshot links.'} ${hButton('View saved preview', 'snapshot-view')}</p>` : ''}`;
}
function hProfiles() {
  const view = historyDemo.view;
  if (view === 'Wrapped') return hWrapped();
  if (view === 'Activity')
    return (
      `<div class="h-controls"><label class="h-checkbox"><input type="checkbox" data-history-field="labels" ${historyDemo.labels ? 'checked' : ''}>Show playful activity labels</label>${hTip('Activity thresholds', 'Tinkerer: at least 40 moves in a fully covered season; Patient builder: fewer than 25. Unsupported provider categories remain unavailable.')}</div>` +
      hTable(
        ['Season', 'Pickups', 'Drops', 'Trades', 'Waiver claims', 'Label', 'Coverage'],
        historyDemo.years.map((year, i) => [
          hSeasonLink(year),
          28 + i * 6,
          24 + i * 5,
          2 + i,
          12 + i,
          historyDemo.labels ? 'Tinkerer (≥40 moves)' : 'Hidden',
          'Complete transaction ledger; FAAB unavailable',
        ]),
      )
    );
  if (view === 'Player impact')
    return hTable(
      [
        'Player',
        'Relationship',
        'Verified matchups',
        'Points in appearances',
        'Win / loss contribution',
        'Evidence',
      ],
      hPlayers.map((name, i) => [
        name,
        i % 2 ? 'Nemesis' : 'Guardian angel',
        3 + i,
        92 + i * 8,
        i % 2 ? '2 losses with opposing appearance' : '2 wins with own starting appearance',
        hEvidenceButton(
          'Appearance evidence',
          `${name}: verified ${3 + i} league matchups with roster ownership. Counterfactual removes only this player’s scored points; not a claim of sole causality. Manager: ${hName()}.`,
        ),
      ]),
    );
  if (view === 'Player loyalty')
    return hTable(
      ['Player', 'Seasons', 'Weeks rostered', 'Acquisition paths', 'Favorite score', 'Evidence'],
      hPlayers.map((name, i) => [
        name,
        historyDemo.years.join(', '),
        18 + i * 3,
        'Draft → retained; trade in 2024',
        75 - i * 5,
        hEvidenceButton(
          'Ownership history',
          `${hName()} rostered ${name} for ${18 + i * 3} verified weeks in ${historyDemo.years.join(', ')}. Draft 2023 pick ${i + 3}; traded back in 2024 W6. Favorites use draft count, trade count, pickups and duration; partial career ownership is not claimed.`,
        ),
      ]),
    );
  if (view === 'Draft overlap')
    return (
      `<div class="h-controls">${hSelect('Compare drafting with', 'opponent', hManagerOptions())}${hTip('Draft steals', 'Shared draft targets are observed overlap. Draft queue evidence is unavailable in this sample; next-pick timing never establishes a stolen target.')}</div>` +
      hTable(
        [
          'Player',
          hName(),
          hNames[Number(historyDemo.opponent)],
          'Shared seasons',
          'Overlap evidence',
          'Draft steal',
        ],
        hPlayers
          .slice(0, 4)
          .map((name, i) => [
            name,
            'Drafted 2 seasons',
            'Drafted 1 season',
            historyDemo.years[i % historyDemo.years.length],
            hEvidenceButton(
              'Draft records',
              `${name}: ${hName()} pick ${12 + i}; ${hNames[Number(historyDemo.opponent)]} pick ${15 + i} in different completed seasons. Same player identity verified; drafts use comparable snake format.`,
            ),
            'Unsupported · no queue data',
          ]),
      )
    );
  if (view === 'Archetypes')
    return hTable(
      ['Profile', 'Metric inputs', 'Minimum sample', 'Observed sample', 'Assessment', 'Evidence'],
      [
        [
          'Patient builder',
          'Retained player weeks; transactions',
          '2 complete seasons',
          `${historyDemo.years.length} seasons`,
          historyDemo.years.length >= 2 ? 'Supported' : 'Insufficient evidence',
          hEvidenceButton(
            'Profile inputs',
            `${hName()}: 44% of drafted players retained at least 10 weeks; 24 moves per season. Threshold: at least two complete seasons.`,
          ),
        ],
        [
          'Draft specialist',
          'Comparable draft production',
          '20 eligible picks',
          '18 picks',
          'No label · insufficient sample',
          hEvidenceButton(
            'Coverage',
            '18 comparable picks; minimum 20. Missing ADP excluded, not fabricated.',
          ),
        ],
        [
          'Waiver worker',
          'Retained pickup starts',
          '10 pickups / 2 seasons',
          '14 pickups / 3 seasons',
          'Supported',
          hEvidenceButton(
            'Pickup evidence',
            '14 verified pickups contributed 34 retained starts. Acquired players scored only while actually started.',
          ),
        ],
      ],
    );
  return '';
}
function expandedHistory() {
  if (!historyDemo.years.includes(historyDemo.year))
    historyDemo.year = historyDemo.years[0] || '2025';
  const stats = hStats(Number(historyDemo.manager));
  const nav = Object.keys(historyGroups)
    .map((group) => hButton(group, 'group', group, `aria-pressed="${historyDemo.group === group}"`))
    .join('');
  const secondary = historyGroups[historyDemo.group]
    .map((view) => hButton(view, 'view', view, `aria-pressed="${historyDemo.view === view}"`))
    .join('');
  let content = '';
  if (!historyDemo.years.length) content = '<p>Choose at least one season to explore history.</p>';
  else if (historyDemo.group === 'Competition')
    content =
      historyDemo.view === 'Rivalries'
        ? hRivalries()
        : historyDemo.view === 'Schedule & luck'
          ? hSchedule()
          : historyDemo.view === 'Elo'
            ? hElo()
            : hPlayoffs();
  else if (historyDemo.group === 'Seasons') content = hSeasons();
  else if (historyDemo.group === 'Moments') content = hMoments();
  else if (historyDemo.group === 'Profile') content = hProfiles();
  else content = hArchiveViews();
  return `<div class="h-history">${heading('League history', 'Follow a manager through rivalries, seasons and league stories.', hButton('Share report', 'share') + hTip('History coverage', `${historyDemo.years.length} selected sample seasons. Regular season, final placements, draft, transactions and verified roster appearances remain distinct. Unknown provider data is unavailable.`))}<section class="context h-controls" aria-label="History context">${hSelect('League', 'league', ['Sample league', 'Sunday league'])}${hSelect('Manager', 'manager', hManagerOptions())}<fieldset class="h-years"><legend>Seasons</legend>${['2025', '2024', '2023'].map((year) => `<label><input type="checkbox" data-history-year="${year}" ${historyDemo.years.includes(year) ? 'checked' : ''}>${year}</label>`).join('')}</fieldset><span class="fresh good">${stats.games} completed games · ${historyDemo.years.length} seasons</span></section><section class="workspace">${identity(
    hName(),
    'Manager identity linked across team renames',
    [
      ['Record', `${stats.wins}–${stats.losses}–${stats.ties}`],
      ['Win rate', stats.pct + '%'],
      ['Games', stats.games],
    ],
  )}<nav class="tabs h-primary" aria-label="History areas">${nav}</nav><nav class="h-secondary" aria-label="${historyDemo.group} views">${secondary}</nav><div class="h-content"><section>${head(historyDemo.view, `${hName()} · ${historyDemo.years.slice().sort().join(', ')}`)}${content}</section><aside class="h-evidence" aria-label="Selected record evidence"><h3>Record evidence</h3>${historyDemo.evidence ? `<p>${hEsc(historyDemo.evidence)}</p>${hButton('Clear selection', 'evidence', '')}` : `<p>Select a game, source, player or record to inspect its evidence.</p><dl><dt>Selected manager</dt><dd>${hName()}</dd><dt>Selected seasons</dt><dd>${historyDemo.years.join(', ') || 'None'}</dd><dt>Source</dt><dd>Local design fixtures</dd></dl>`}</aside></div></section><p class="h-caption">Interactive design preview · fixture data only. CSV and JSON download locally; public links are simulated.</p></div>`;
}
function hRefresh() {
  if (page === 10) render();
}
function hDownload(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function hResetView() {
  historyDemo.search = '';
  historyDemo.sort = -1;
  historyDemo.evidence = '';
}
function hViewDefaults() {
  const v = historyDemo.view;
  if (v === 'Monday miracles') historyDemo.minimum = '20';
  if (v === 'Rivalries') historyDemo.minimum = '3';
  if (v === 'Draft skill') {
    historyDemo.category = 'Draft position expectation';
    historyDemo.cohort = 'All picks';
  }
  if (v === 'Hall of Shame') historyDemo.category = 'Worst season';
  if (v === 'Record book') historyDemo.category = 'Closest games';
  if (v === 'Pain Index') historyDemo.cohort = 'Scoring + margin';
  if (v === 'Dropped breakouts') historyDemo.window = '4 weeks';
  if (v === 'Trade impact') historyDemo.window = '6 weeks';
}
document.addEventListener(
  'click',
  (event) => {
    const button = event.target.closest('[data-history]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const action = button.dataset.history,
      value = button.dataset.value;
    if (action === 'group') {
      historyDemo.group = value;
      historyDemo.view = historyGroups[value][0];
      hResetView();
      hViewDefaults();
    } else if (action === 'view') {
      historyDemo.view = value;
      for (const [group, views] of Object.entries(historyGroups))
        if (views.includes(value)) historyDemo.group = group;
      hResetView();
      hViewDefaults();
    } else if (action === 'evidence') historyDemo.evidence = value;
    else if (action === 'pair') {
      const [a, b] = value.split(',');
      historyDemo.manager = a;
      historyDemo.opponent = b;
      historyDemo.evidence =
        `${hNames[a]} versus ${hNames[b]}: ` +
        hGames()
          .filter(
            (g) =>
              (g.a === Number(a) && g.b === Number(b)) || (g.a === Number(b) && g.b === Number(a)),
          )
          .slice(-5)
          .map(hGameEvidence)
          .join(' ');
    } else if (action === 'matrix') historyDemo.matrix = !historyDemo.matrix;
    else if (action === 'sort') {
      historyDemo.descending = historyDemo.sort === Number(value) ? !historyDemo.descending : false;
      historyDemo.sort = Number(value);
    } else if (action === 'season') {
      historyDemo.group = 'Seasons';
      historyDemo.view = 'Season results';
      historyDemo.years = [String(value)];
      historyDemo.year = String(value);
      hResetView();
    } else if (action === 'csv') {
      const section = button.closest('section'),
        tables = [...(section?.querySelectorAll('table') || [])];
      const csv = tables
        .map((t) =>
          [...t.rows]
            .map((row) =>
              [...row.cells]
                .map((cell) => '"' + cell.innerText.replaceAll('"', '""') + '"')
                .join(','),
            )
            .join('\n'),
        )
        .join('\n\n');
      hDownload(
        'league-history-' + historyDemo.view.toLowerCase().replaceAll(' ', '-') + '.csv',
        csv,
        'text/csv',
      );
      return;
    } else if (action === 'archive-sample') {
      historyDemo.archive = JSON.stringify(
        {
          version: 1,
          season: hYear(),
          snapshots: [
            { time: 'Mon 18:00', probability: 0.12, player: 'Josh Allen', points: 0 },
            { time: 'Mon 19:00', probability: 0.28, player: 'Josh Allen', points: 11.4 },
            { time: 'Mon 20:00', probability: 0.65, player: 'Josh Allen', points: 26.2 },
            { time: 'Final', probability: 1, player: 'Josh Allen', points: 33.6 },
          ],
        },
        null,
        2,
      );
      historyDemo.archiveStatus =
        'Sample archive loaded. Import to inspect it in probability replay.';
    } else if (action === 'archive-import') {
      try {
        const data = JSON.parse(historyDemo.archive);
        if (
          data.version !== 1 ||
          data.season !== hYear() ||
          !Array.isArray(data.snapshots) ||
          !data.snapshots.length ||
          data.snapshots.some(
            (s) =>
              typeof s.time !== 'string' ||
              !Number.isFinite(s.probability) ||
              s.probability < 0 ||
              s.probability > 1 ||
              typeof s.player !== 'string' ||
              !Number.isFinite(s.points),
          )
        )
          throw Error(
            'Use version 1, the selected season and nonempty snapshots with time, probability (0–1), player and finite points.',
          );
        historyDemo.imported = data.snapshots;
        historyDemo.archiveStatus = `Imported ${data.snapshots.length} snapshots for ${data.season}. Open Probability replay to inspect them.`;
      } catch (error) {
        historyDemo.archiveStatus = 'Import failed: ' + error.message;
      }
    } else if (action === 'archive-clear') {
      historyDemo.archive = '';
      historyDemo.imported = [];
      historyDemo.archiveStatus = 'Imported archive cleared; default fixture snapshots restored.';
    } else if (action === 'archive-export') {
      hDownload(
        `history-archive-${hYear()}.json`,
        historyDemo.archive ||
          JSON.stringify({ version: 1, season: hYear(), snapshots: historyDemo.imported }, null, 2),
        'application/json',
      );
      return;
    } else if (action === 'share') {
      modal(
        'Share league history',
        `<p>${hEsc(historyDemo.league)} · ${historyDemo.years.join(', ')} · ${hName()}</p><p>Current report links use public provider data. Private ESPN sharing creates a stored snapshot of the loaded report, excluding cookies and account details.</p><div class="fieldstack">${hButton('Preview current public report', 'public-view')}${hButton('Create frozen ESPN snapshot', 'snapshot-create')}${hButton(historyDemo.sharing ? 'Disable public access' : 'Enable public access', 'revoke')}</div><p>Sharing is ${historyDemo.sharing ? 'enabled' : 'disabled'}. Snapshots expire after 10 days. These actions simulate the flow locally.</p>`,
      );
      return;
    } else if (action === 'revoke') {
      historyDemo.sharing = !historyDemo.sharing;
      historyDemo.evidence = historyDemo.sharing
        ? 'Public sharing enabled for this local preview.'
        : 'Public sharing disabled. Previously issued report and snapshot links now show access denied in the preview.';
      document.querySelector('#dialog')?.close();
    } else if (action === 'wrapped-share' || action === 'snapshot-create') {
      historyDemo.snapshot = true;
      historyDemo.sharing = true;
      historyDemo.evidence =
        'Preview snapshot saved October 13, 2026; expires October 23, 2026. No provider credentials or private account metadata included.';
      modal(
        'Snapshot preview ready',
        `<p>Saved ${historyDemo.view === 'Wrapped' ? 'Wrapped cards' : 'selected history seasons'} · October 13, 2026 · expires October 23, 2026.</p><label>Preview link<input readonly value="https://preview.invalid/shared/snapshots/history-demo" aria-label="History snapshot preview link"></label>${hButton('Open snapshot preview', 'snapshot-view')}${hButton('Revoke public access', 'revoke')}<p>Local mockup: no real public snapshot was published.</p>`,
      );
      return;
    } else if (action === 'public-view' || action === 'snapshot-view') {
      modal(
        historyDemo.sharing ? 'Shared report preview' : 'Report access disabled',
        historyDemo.sharing
          ? `<h3>${hEsc(historyDemo.league)} · ${historyDemo.years.join(', ')}</h3><p>${action === 'snapshot-view' ? 'Stored sample data saved October 13, 2026. Only saved seasons are available. Expires October 23, 2026.' : 'Anonymous public history view · rankings builder excluded.'}</p>${historyDemo.view === 'Wrapped' ? hWrapped() : `<p>${hName()} · ${hStats(Number(historyDemo.manager)).pct}% win rate</p>${hRivalries()}`}<p>Preview metadata: ${hEsc(historyDemo.league)} league history; verified season results and rivalries. Account IDs and credentials excluded.</p>`
          : '<p>The owner disabled public sharing. Previously issued report and snapshot links are unavailable.</p>',
      );
      return;
    }
    hRefresh();
  },
  true,
);
document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.dataset.historyYear) {
    historyDemo.years = target.checked
      ? [...historyDemo.years, target.dataset.historyYear]
      : historyDemo.years.filter((y) => y !== target.dataset.historyYear);
    historyDemo.snapshot = false;
    hResetView();
    hRefresh();
  }
  if (target.dataset.historyField) {
    const key = target.dataset.historyField;
    historyDemo[key] = target.type === 'checkbox' ? target.checked : target.value;
    if (key === 'year') {
      historyDemo.imported = [];
      historyDemo.archive = '';
      historyDemo.archiveStatus = '';
    }
    if (['manager', 'league', 'year', 'scope'].includes(key)) {
      historyDemo.consent = false;
      historyDemo.evidence = '';
      historyDemo.search = '';
    }
    hRefresh();
  }
});
document.addEventListener('input', (event) => {
  if (event.target.hasAttribute('data-history-archive')) historyDemo.archive = event.target.value;
  if (event.target.hasAttribute('data-history-search')) {
    historyDemo.search = event.target.value;
    const caret = event.target.selectionStart;
    hRefresh();
    const input = document.querySelector('[data-history-search]');
    input?.focus();
    input?.setSelectionRange(caret, caret);
  }
});
renderers[10] = expandedHistory;
if (page === 10) render();
