import { calculateInsights } from './server/insights/calculate';
import { summarizeLeague, luckIndex, visibleManagers } from './league-summary';
import type { ScoreWeek } from './insights';
const make = (weeks = 1) =>
  calculateInsights({
    completedWeek: weeks,
    teams: ['a', 'b', 'c', 'd'].map((teamId) => ({
      teamId,
      managerKey: teamId,
      managerName: teamId,
      teamName: teamId,
    })),
    scores: Array.from({ length: weeks }, (_, i) =>
      ['a', 'b', 'c', 'd'].map((teamId, j): ScoreWeek => ({
        teamId,
        week: i + 1,
        actual: [80, 60, 100, 120][j],
        opponentTeamId: ['b', 'a', 'd', 'c'][j],
        projected: null,
        starters: [],
      })),
    ).flat(),
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  });
it('measures schedule luck relative to all-play, including unfavorable wins/losses', () => {
  const rows = summarizeLeague([{ year: 2025, data: make() }]);
  expect(rows[0].actualWins).toBe(1);
  expect(rows[0].expectedWins).toBeCloseTo(1 / 3);
  expect(luckIndex(rows[0])).toBeCloseTo(200 / 3);
  expect(rows.reduce((sum, r) => sum + r.actualWins - r.expectedWins, 0)).toBeCloseTo(0);
});
it('weights history by measured games and keeps identity across renamed teams', () => {
  const older = make(2),
    newer = make();
  newer.teams[0].managerName = 'Renamed';
  newer.scores[0].actual = 130;
  const row = summarizeLeague([
    { year: 2024, data: older },
    { year: 2025, data: newer },
  ]).find((r) => r.key === 'a')!;
  expect(row.seasons).toEqual([2024, 2025]);
  expect(row.managerName).toBe('Renamed');
  expect(row.luckGames).toBe(3);
  expect(luckIndex(row)).toBeCloseTo(400 / 9);
});
it('counts ties as half and excludes missing opponents or incomplete league weeks', () => {
  const data = make(3);
  data.scores.filter((s) => s.week === 1).forEach((s) => (s.actual = 100));
  data.scores.filter((s) => s.week === 2).forEach((s) => (s.opponentTeamId = null));
  data.scores = data.scores.filter((s) => !(s.week === 3 && s.teamId === 'd'));
  const row = summarizeLeague([{ year: 2025, data }])[0];
  expect(row.luckGames).toBe(1);
  expect(row.actualWins).toBe(0.5);
  expect(luckIndex(row)).toBe(0);
});
it('hides former managers without changing historical comparison baselines', () => {
  const rows = summarizeLeague([{ year: 2025, data: make() }]);
  expect(visibleManagers(rows, ['a'], false)).toEqual([rows[0]]);
  expect(visibleManagers(rows, ['a'], true)).toEqual(rows);
  expect(visibleManagers(rows, ['a'], false)[0].expectedWins).toBeCloseTo(1 / 3);
});
it('leaves unavailable luck empty and never merges unknown owners across seasons', () => {
  const data = make();
  data.teams.forEach((t) => delete t.managerKey);
  data.scores.forEach((s) => delete s.opponentTeamId);
  const rows = summarizeLeague([
    { year: 2024, data },
    { year: 2025, data },
  ]);
  expect(rows).toHaveLength(8);
  expect(luckIndex(rows[0])).toBeNull();
});
it('summarizes graded move quality without counting ungraded trades as losses', () => {
  const data = make();
  const side = { teamId: 'a', received: [], sent: [], receivedValue: 4, sentValue: 1, gain: 3 };
  data.tradeComparisons = [
    {
      id: 'win',
      week: 1,
      weeks: [2, 3],
      possibleWeeks: 2,
      verdict: 'leader',
      winner: 'a',
      sides: [side],
    },
    {
      id: 'close',
      week: 1,
      weeks: [2, 3],
      possibleWeeks: 2,
      verdict: 'close',
      winner: null,
      sides: [{ ...side, gain: 1 }],
    },
    {
      id: 'unknown',
      week: 1,
      weeks: [],
      possibleWeeks: 2,
      verdict: 'insufficient',
      winner: null,
      sides: [{ ...side, gain: null }],
    },
  ];
  const row = summarizeLeague([{ year: 2025, data }])[0];
  expect(row).toMatchObject({
    trades: 3,
    gradedTrades: 2,
    tradeWins: 1,
    tradeLosses: 0,
    tradeTies: 1,
    tradeGainTotal: 4,
  });
});

it('aggregates finish achievements by manager with independent coverage and excludes unknown seasons', () => {
  const older = make(),
    newer = make(),
    ongoing = make();
  older.results = [{ teamId: 'a', playoff: true, champion: true, lastPlace: false, finish: 1 }];
  newer.results = [{ teamId: 'a', playoff: false, champion: false, lastPlace: true, finish: 4 }];
  newer.teams[0].managerName = 'Renamed';
  const row = summarizeLeague([
    { year: 2024, data: older },
    { year: 2025, data: newer },
    { year: 2026, data: ongoing },
  ]).find((r) => r.key === 'a')!;
  expect(row).toMatchObject({
    playoffAppearances: 1,
    playoffSeasons: 2,
    championships: 1,
    championshipSeasons: 2,
    lastPlaces: 1,
    lastPlaceSeasons: 2,
    finishTotal: 5,
    finishSeasons: 2,
  });
  expect(row.seasons).toHaveLength(3);
});

it('keeps changed co-owner groups separate while renamed teams retain their history', () => {
  const first = make(),
    second = make(),
    third = make();
  first.teams[0].managerKey = 'sleeper:a,b';
  second.teams[0].managerKey = 'sleeper:a,b';
  second.teams[0].teamName = 'Renamed';
  third.teams[0].managerKey = 'sleeper:a,c';
  const rows = summarizeLeague([
    { year: 2023, data: first },
    { year: 2024, data: second },
    { year: 2025, data: third },
  ]);
  expect(rows.find((r) => r.key === 'sleeper:a,b')).toMatchObject({
    seasons: [2023, 2024],
    teamName: 'Renamed',
  });
  expect(rows.find((r) => r.key === 'sleeper:a,c')?.seasons).toEqual([2025]);
});
