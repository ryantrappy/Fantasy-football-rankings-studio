import { playoffClinch, type PlayoffClinch } from './playoff-clinch';
import type { PlayoffRules, StandingsState } from './playoff-rules';

const teams = ['a', 'b', 'c', 'd'];
const rules: PlayoffRules = {
  provider: 'Sleeper',
  season: 2026,
  tiebreakers: ['points-for'],
  divisionByTeam: {},
  divisionWinnersFirst: false,
  roundWeeks: [[5]],
  reseed: false,
};
const matrix = () => teams.map(() => teams.map(() => 0));

function results(
  wins: number[],
  fixtures: [number, number][] | undefined,
  options: Partial<PlayoffRules> = {},
  past?: Pick<StandingsState, 'headToHead' | 'meetings'>,
): PlayoffClinch[] {
  const steps = playoffClinch(
    teams,
    2,
    {
      wins,
      points: [400, 300, 200, 100],
      against: [0, 0, 0, 0],
      ...(past ?? { meetings: matrix(), headToHead: matrix() }),
    },
    { ...rules, ...options },
    fixtures,
  );
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

it('counts the fewest winning games that guarantee qualification and reports eliminated teams', () => {
  expect(
    results(
      [3, 2, 2, 0],
      [
        [0, 3],
        [1, 2],
      ],
    ),
  ).toEqual([
    { status: 'clinched' },
    { status: 'wins-needed', wins: 1 },
    { status: 'wins-needed', wins: 1 },
    { status: 'eliminated' },
  ]);
});

it('requires a guarantee regardless of which opponents the team beats', () => {
  expect(
    results(
      [2, 2, 2, 0],
      [
        [0, 1],
        [2, 3],
        [0, 3],
        [1, 2],
      ],
    )[0],
  ).toEqual({
    status: 'wins-needed',
    wins: 2,
  });
});

it('keeps point tiebreakers open until scores are final', () => {
  expect(
    results(
      [3, 2, 1, 0],
      [
        [0, 2],
        [1, 3],
      ],
    )[2],
  ).toEqual({ status: 'needs-help' });
  expect(results([3, 2, 2, 1], [])[2]).toEqual({ status: 'eliminated' });
});

it('uses completed head-to-head results ahead of an unresolved points tiebreaker', () => {
  const meetings = matrix();
  meetings[1][2] = meetings[2][1] = 1;
  const headToHead = matrix();
  headToHead[2][1] = 1;
  expect(
    results(
      [3, 2, 1, 0],
      [
        [0, 2],
        [1, 3],
      ],
      { tiebreakers: ['head-to-head', 'points-for'] },
      { meetings, headToHead },
    )[2],
  ).toEqual({ status: 'needs-help' });
  expect(
    results(
      [3, 2, 2, 0],
      [],
      { tiebreakers: ['head-to-head', 'points-for'] },
      { meetings, headToHead },
    )[2],
  ).toEqual({ status: 'clinched' });
});

it('accounts for a reserved division berth even below the overall playoff cutoff', () => {
  expect(
    results([3, 3, 1, 0], [], {
      divisionByTeam: { a: 'east', b: 'east', c: 'west', d: 'west' },
      divisionWinnersFirst: true,
    }),
  ).toEqual([
    { status: 'clinched' },
    { status: 'eliminated' },
    { status: 'clinched' },
    { status: 'eliminated' },
  ]);
});

it('requires the actual remaining fixtures for a guarantee', () => {
  expect(results([3, 2, 1, 0], undefined)).toEqual(teams.map(() => ({ status: 'unavailable' })));
});
