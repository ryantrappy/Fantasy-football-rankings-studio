import { sleeperResults, espnResults, type BracketMatch } from './results';
const winners: BracketMatch[] = [{ t1: 1, t2: 2, w: 1, l: 2, p: 1 }];
const losers: BracketMatch[] = [
  { t1: 3, t2: 4, w: 3, l: 4 },
  { t1: 5, t2: 6, w: 5, l: 6 },
  { t1: 3, t2: 5, w: 3, l: 5, p: 1, t1_from: { w: 1 }, t2_from: { w: 2 } },
  { t1: 4, t2: 6, w: 4, l: 6, p: 3 },
];
it('records playoff entrants, champions and final consolation placements', () => {
  const results = sleeperResults(['1', '2', '3', '4', '5', '6'], 2, true, winners, losers);
  expect(results[0]).toMatchObject({ playoff: true, finish: 1, champion: true, lastPlace: false });
  expect(results[2]).toMatchObject({ playoff: false, finish: 3 });
  expect(results[5]).toMatchObject({ playoff: false, finish: 6, lastPlace: true });
});
it('uses loser advancement for a toilet bowl and never awards an unfinished season', () => {
  const bowl = losers.map((m) => (m.p === 1 ? { ...m, t1_from: { l: 1 }, t2_from: { l: 2 } } : m));
  const results = sleeperResults(['1', '2', '3', '4', '5', '6'], 2, true, winners, bowl);
  expect(results[4]).toMatchObject({ finish: 6, lastPlace: true });
  const unfinished = sleeperResults(['1', '2', '3', '4', '5', '6'], 2, false, winners, losers);
  expect(
    unfinished.every((r) => r.finish === null && r.champion === null && r.lastPlace === null),
  ).toBe(true);
});
it('retains unknown results for missing or ambiguous brackets, including playoff byes', () => {
  expect(sleeperResults(['1', '2', '3', '4'], 4, true, winners, [])[2]).toMatchObject({
    playoff: null,
    finish: null,
    lastPlace: null,
  });
  const withBye: BracketMatch[] = [
    { t1: 3, t2: 4 },
    { t1: 1, t2: null },
    { t1: 2, t2: null },
  ];
  expect(
    sleeperResults(['1', '2', '3', '4', '5', '6'], 4, false, withBye, []).map((r) => r.playoff),
  ).toEqual([true, true, true, true, false, false]);
  expect(
    sleeperResults(['1', '2', '3', '4'], 2, true, winners, [{ t1: 3, t2: 4, p: 1, w: 3, l: 4 }])[3]
      .finish,
  ).toBeNull();
});
it('reads ESPN final ranks only when complete and identifies championship-bracket participation', () => {
  const data = {
    teams: [
      { id: 1, rankCalculatedFinal: 2 },
      { id: 2, rankCalculatedFinal: 1 },
      { id: 3, rankCalculatedFinal: 3 },
    ],
    settings: { scheduleSettings: { playoffTeamCount: 2 } },
    schedule: [{ playoffTierType: 'WINNERS_BRACKET', home: { teamId: 1 }, away: { teamId: 2 } }],
  };
  expect(espnResults(['1', '2', '3'], data, true, true)).toEqual([
    { teamId: '1', playoff: true, finish: 2, champion: false, lastPlace: false },
    { teamId: '2', playoff: true, finish: 1, champion: true, lastPlace: false },
    { teamId: '3', playoff: false, finish: 3, champion: false, lastPlace: true },
  ]);
  expect(
    espnResults(['1', '2', '3'], data, false, false).every(
      (r) => r.playoff === null && r.finish === null,
    ),
  ).toBe(true);
  data.teams[0].rankCalculatedFinal = 1;
  expect(espnResults(['1', '2', '3'], data, true, true)[1].champion).toBeNull();
});
