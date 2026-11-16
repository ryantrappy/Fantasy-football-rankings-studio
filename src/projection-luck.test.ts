import type { ScoreWeek } from './insights';
import { calculateInsights } from './server/insights/calculate';
import { MATCHUP_REPLAYS, projectionLuck } from './projection-luck';

function report() {
  return calculateInsights({
    completedWeek: 3,
    reportingStartWeek: 1,
    teams: ['a', 'b'].map((id) => ({ teamId: id, teamName: id, managerName: id })),
    scores: [1, 2, 3].flatMap((week) =>
      ['a', 'b'].map((teamId): ScoreWeek => {
        const actual = teamId === 'a' ? [8, 12, 20][week - 1] : [12, 8, 5][week - 1];
        return {
          teamId,
          week,
          actual,
          projected: 10,
          opponentTeamId: teamId === 'a' ? 'b' : 'a',
          lineupAvailable: true,
          starters: [{ playerId: teamId, points: actual, projected: 10, position: 'RB' }],
        };
      }),
    ),
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  });
}

it('uses earlier player residuals, replays each eligible pair exactly 100 times and balances win credits', () => {
  const result = projectionLuck(report());
  expect(MATCHUP_REPLAYS).toBe(100);
  expect(result.matchups).toHaveLength(3);
  expect(result.matchups[0]).toMatchObject({ wins: null, homeExpectedWin: null });
  expect(result.matchups[0].reason).toContain('Insufficient');
  expect(result.players.find((p) => p.playerId === 'a' && p.week === 3)).toMatchObject({
    variance: 8,
    samples: 2,
    basis: 'player',
    difference: 10,
  });
  expect(result.players.find((p) => p.playerId === 'a' && p.week === 2)).toMatchObject({
    variance: 8,
    samples: 2,
    basis: 'position',
  });
  for (const matchup of result.matchups.slice(1)) {
    expect(matchup.wins! + matchup.losses! + matchup.ties!).toBe(100);
    expect(matchup.homeExpectedWin).toBe((matchup.wins! + matchup.ties! / 2) / 100);
  }
  expect(result.teams.map((t) => t.measured)).toEqual([2, 2]);
  expect(result.teams.reduce((sum, t) => sum + t.expectedWins!, 0)).toBeCloseTo(2);
  expect(result.teams.reduce((sum, t) => sum + t.extraWins!, 0)).toBeCloseTo(0);
  expect(result.teams[0].difference).toBe(6);
  expect(result.teams[0].opponentDifference).toBe(-3.5);
});

it('never lets this week, future outcomes, input order or team-level projections affect earlier variance and draws', () => {
  const input = report();
  const original = projectionLuck(input);
  const changed = structuredClone(input);
  changed.scores.reverse();
  changed.scores.forEach((s) => {
    s.projected = 999999;
    if (s.week === 3) s.actual = s.starters[0].points = 20000;
  });
  changed.scores.push({ ...changed.scores[0], week: 4, actual: 999999 });
  const revised = projectionLuck(changed);
  expect(revised.matchups.slice(0, 2)).toEqual(original.matchups.slice(0, 2));
  expect(revised.matchups[2].wins).toBe(original.matchups[2].wins);
  expect(revised.players.map((p) => p.variance)).toEqual(original.players.map((p) => p.variance));
  expect(projectionLuck(input)).toEqual(original);
});

it('measures forecast error variance rather than variation in weekly projections or point totals', () => {
  const data = report();
  for (const s of data.scores.filter((s) => s.teamId === 'a')) {
    const projected = s.week * 100;
    s.starters[0].projected = projected;
    s.actual = s.starters[0].points = projected + (s.week === 1 ? -2 : 2);
  }
  expect(
    projectionLuck(data).players.find((p) => p.playerId === 'a' && p.week === 3)?.variance,
  ).toBe(8);
});

it('retains zero and negative forecasts, zero variance and half-credit ties', () => {
  const data = report();
  for (const s of data.scores) {
    s.actual = s.starters[0].points = s.starters[0].projected = s.teamId === 'a' ? 0 : -2;
  }
  let game = projectionLuck(data).matchups[2];
  expect(game).toMatchObject({ wins: 100, ties: 0, losses: 0, homeExpectedWin: 1 });
  expect(game.away.projected).toBe(-2);
  for (const s of data.scores) s.actual = s.starters[0].points = s.starters[0].projected = 0;
  game = projectionLuck(data).matchups[2];
  expect(game).toMatchObject({
    wins: 0,
    ties: 100,
    losses: 0,
    homeExpectedWin: 0.5,
    homeActualWin: 0.5,
  });
});

it.each(['missing', 'nonfinite', 'lineup', 'override', 'duplicate-starter'])(
  'shows unavailable instead of fabricating a replay for %s data',
  (kind) => {
    const data = report();
    const score = data.scores.find((s) => s.teamId === 'a' && s.week === 3)!;
    if (kind === 'missing') delete score.starters[0].projected;
    if (kind === 'nonfinite') score.starters[0].projected = Infinity;
    if (kind === 'lineup') score.lineupAvailable = false;
    if (kind === 'override') score.actual += 10;
    if (kind === 'duplicate-starter') score.starters.push({ ...score.starters[0] });
    const result = projectionLuck(data);
    expect(result.matchups[2].homeExpectedWin).toBeNull();
    expect(result.matchups[2].reason).toBeTruthy();
    expect(result.teams[0].measured).toBe(1);
    expect(result.teams[0].games).toBe(3);
  },
);

it('excludes duplicate team-weeks and duplicate-starter calibration without inventing complete coverage', () => {
  const data = report();
  data.scores.push({ ...data.scores[0] });
  let result = projectionLuck(data);
  expect(result.duplicateTeamWeeks).toBe(1);
  expect(result.matchups).toHaveLength(2);
  expect(result.teams[0].unmatchedWeeks).toBe(1);
  const clean = report();
  clean.scores[0].starters.push({ ...clean.scores[0].starters[0], points: 1000000 });
  result = projectionLuck(clean);
  expect(result.players.find((p) => p.playerId === 'a' && p.week === 2)?.variance).toBeNull();
  expect(result.players.find((p) => p.playerId === 'a' && p.week === 3)).toMatchObject({
    basis: 'position',
    samples: 3,
  });
});

it('excludes byes and nonreciprocal opponents and discloses unmatched weeks', () => {
  const data = report();
  data.scores[0].opponentTeamId = null;
  data.scores[2].opponentTeamId = 'unknown';
  const result = projectionLuck(data);
  expect(result.matchups).toHaveLength(1);
  expect(result.teams[0]).toMatchObject({ games: 1, unmatchedWeeks: 2 });
});

it('does not borrow another position or use observations before the reporting start', () => {
  const data = report();
  data.reportingStartWeek = 3;
  const result = projectionLuck(data);
  expect(result.matchups).toHaveLength(1);
  expect(result.matchups[0].homeExpectedWin).toBeNull();
  const other = report();
  other.scores.forEach((s) => {
    s.starters[0].position = s.teamId === 'a' ? 'RB' : 'QB';
  });
  expect(projectionLuck(other).matchups[1].homeExpectedWin).toBeNull();
});

it('counts a published multiweek matchup once and a verified playoff matchup without reciprocal weekly IDs', () => {
  const data = report();
  data.completedWeek = 4;
  data.scores.push(
    ...structuredClone(data.scores.filter((s) => s.week === 3)).map((s) => ({ ...s, week: 4 })),
  );
  data.scores
    .filter((s) => s.week >= 3)
    .forEach((s) => {
      s.matchupWeeks = [3, 4];
    });
  let result = projectionLuck(data);
  const final = result.matchups.at(-1)!;
  expect(result.matchups).toHaveLength(3);
  expect(final.weeks).toEqual([3, 4]);
  expect(final.home.actual).toBe(40);
  expect(final.home.projected).toBe(20);
  expect(final.wins! + final.losses! + final.ties!).toBe(100);
  data.scores
    .filter((s) => s.week >= 3)
    .forEach((s) => {
      s.opponentTeamId = null;
    });
  data.playoffGames = [
    {
      id: 'final',
      homeTeamId: 'a',
      awayTeamId: 'b',
      weeks: [3, 4],
      homePoints: 40,
      awayPoints: 10,
      elimination: true,
    },
  ];
  result = projectionLuck(data);
  expect(result.matchups.at(-1)).toEqual(final);
});

it('does not split unknown or unfinished multiweek periods into fabricated results', () => {
  const data = report();
  data.scores
    .filter((s) => s.week === 3)
    .forEach((s) => {
      s.matchupWeeks = [3, 4];
    });
  expect(projectionLuck(data).matchups).toHaveLength(2);
  data.scores
    .filter((s) => s.week === 3)
    .forEach((s) => {
      s.matchupWeeks = [];
    });
  expect(projectionLuck(data).matchups).toHaveLength(2);
});

it('does not fabricate player points or real outcomes from nonfinite scores', () => {
  const data = report();
  data.scores.find((s) => s.teamId === 'a' && s.week === 3)!.starters[0].points = NaN;
  let result = projectionLuck(data);
  expect(result.players.find((p) => p.playerId === 'a' && p.week === 3)?.actual).toBeNull();
  expect(result.matchups.at(-1)?.homeExpectedWin).toBeNull();
  data.scores.find((s) => s.teamId === 'a' && s.week === 3)!.actual = NaN;
  result = projectionLuck(data);
  expect(result.matchups).toHaveLength(2);
  expect(result.teams[0].unmatchedWeeks).toBe(1);
});

it('retains real multiweek ties when decimal score sums have floating-point differences', () => {
  const data = report();
  for (const s of data.scores.filter((s) => s.week >= 2)) {
    s.matchupWeeks = [2, 3];
    s.actual = s.starters[0].points =
      s.teamId === 'a' ? (s.week === 2 ? 0.1 : 0.2) : s.week === 2 ? 0.3 : 0;
  }
  expect(projectionLuck(data).matchups.at(-1)).toMatchObject({ homeActualWin: 0.5 });
});
