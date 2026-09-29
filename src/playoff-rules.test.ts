import {
  seedPlayoffTeams,
  playoffRulesReason,
  type PlayoffRules,
  type StandingsState,
} from './playoff-rules';

const rules = (overrides: Partial<PlayoffRules> = {}): PlayoffRules => ({
  provider: 'ESPN',
  season: 2025,
  tiebreakers: ['head-to-head', 'points-for', 'division-record', 'points-against'],
  divisionByTeam: {},
  divisionWinnersFirst: false,
  roundWeeks: [
    [14, 15],
    [16, 17],
  ],
  reseed: false,
  ...overrides,
});
const state = (n: number): StandingsState => ({
  wins: Array(n).fill(7),
  points: Array(n).fill(1000),
  against: Array(n).fill(1000),
  meetings: Array.from({ length: n }, () => Array(n).fill(0)),
  headToHead: Array.from({ length: n }, () => Array(n).fill(0)),
});
const played = (s: StandingsState, a: number, b: number) => {
  s.meetings[a][b]++;
  s.meetings[b][a]++;
  s.headToHead[a][b]++;
};
it('uses the historical division winners before league-wide wildcards (ESPN 2025 regression)', () => {
  const s = state(8);
  s.wins = [4, 3, 7, 4, 7, 10, 8, 9];
  s.points = [1567.26, 1459.44, 1639.12, 1550.58, 1822, 1816.76, 1713.74, 1810.52];
  const ids = Array.from({ length: 8 }, (_, i) => String(i + 1));
  const r = rules({
    divisionWinnersFirst: true,
    divisionByTeam: Object.fromEntries(ids.map((id) => [id, Number(id) <= 4 ? 'East' : 'West'])),
  });
  expect(
    seedPlayoffTeams(
      ids,
      4,
      s,
      r,
      ids.map(() => 0),
    ).map((i) => ids[i]),
  ).toEqual(['6', '3', '8', '7']);
  expect(
    seedPlayoffTeams(
      ids,
      4,
      s,
      rules(),
      ids.map(() => 0),
    ).map((i) => ids[i]),
  ).toEqual(['6', '8', '7', '5']);
});
it('restarts a multi-team head-to-head tie after each seed instead of pairwise sorting', () => {
  const s = state(3);
  played(s, 0, 1);
  played(s, 1, 2);
  played(s, 2, 0);
  s.points = [1200, 900, 1100];
  // Initially a circular 1–1 tie: A wins on points. B then beats C directly,
  // although C scored more points than B during the season.
  expect(seedPlayoffTeams(['A', 'B', 'C'], 3, s, rules(), [0, 0, 0])).toEqual([0, 1, 2]);
});
it('skips unequal head-to-head schedules and honors the configured first tiebreaker', () => {
  const s = state(3);
  played(s, 0, 1);
  played(s, 1, 2);
  played(s, 2, 0);
  played(s, 0, 1);
  s.points = [900, 1000, 1200];
  expect(seedPlayoffTeams(['A', 'B', 'C'], 1, s, rules(), [0, 0, 0])).toEqual([2]);
  const two = state(2);
  played(two, 0, 1);
  two.points = [900, 1200];
  expect(seedPlayoffTeams(['A', 'B'], 1, two, rules(), [0, 0])).toEqual([0]);
  expect(
    seedPlayoffTeams(
      ['A', 'B'],
      1,
      two,
      rules({ tiebreakers: ['points-for', 'head-to-head'] }),
      [0, 0],
    ),
  ).toEqual([1]);
});
it('uses tied games, division record and higher points against before a coin flip', () => {
  const s = state(3);
  played(s, 0, 2);
  played(s, 2, 1);
  const r = rules({ divisionByTeam: { A: 'East', B: 'East', C: 'East' } });
  expect(seedPlayoffTeams(['A', 'B', 'C'], 1, s, r, [0, 1, 0])).toEqual([0]);
  const two = state(2);
  two.meetings = [
    [0, 1],
    [1, 0],
  ];
  two.headToHead = [
    [0, 0.5],
    [0.5, 0],
  ];
  two.against = [900, 1000];
  expect(seedPlayoffTeams(['A', 'B'], 1, two, rules(), [1, 0])).toEqual([1]);
  expect(
    seedPlayoffTeams(
      ['A', 'B'],
      1,
      two,
      rules({ provider: 'Sleeper', tiebreakers: ['points-for', 'points-against'] }),
      [1, 0],
    ),
  ).toEqual([1]);
});
it('rejects unknown rules, missing historical divisions and invalid round schedules', () => {
  expect(
    playoffRulesReason(['A', 'B'], 2, 13, rules({ unsupportedReason: 'Unknown custom seeding' })),
  ).toMatch(/Unknown/);
  expect(playoffRulesReason(['A', 'B'], 2, 13, rules({ divisionWinnersFirst: true }))).toMatch(
    /division/,
  );
  expect(playoffRulesReason(['A', 'B'], 2, 13, rules({ roundWeeks: [[14, 16]] }))).toMatch(
    /schedule/,
  );
  expect(playoffRulesReason(['A', 'B', 'C', 'D'], 4, 13, rules())).toBeUndefined();
});
