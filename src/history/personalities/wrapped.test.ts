import { fixture } from './activity.test';
import { buildWrapped } from './wrapped';
const record = () =>
  fixture({
    scores: [
      { teamId: '1', opponentTeamId: '2', week: 1, actual: 100, projected: 80, starters: [] },
      { teamId: '2', opponentTeamId: '1', week: 1, actual: 90, projected: 110, starters: [] },
    ],
    results: [{ teamId: '1', champion: true }],
    pickups: [{ teamId: '1', player: 'p', lift: 5, baseline: 'position', comparisonWeeks: [2] }],
  });
it('builds personal selected-season record/luck/rivalry/pickup and omits raw identity', () => {
  const recap = buildWrapped(record(), 'a');
  expect(recap.scope).toBe('personal');
  expect(recap.highlights.join(' ')).toMatch(
    /Record: 1–0–0.*Expected wins:.*Best matchup:.*Worst matchup:.*rivalry:.*Best rated pickup:/,
  );
  expect(JSON.stringify(recap)).not.toContain('managerKey');
});
it('builds league champion/upset/closest/blowout/rivalry cards only from evidence', () => {
  const recap = buildWrapped(record());
  expect(recap.highlights.join(' ')).toMatch(
    /Champion: Alex.*Scoring leader:.*Luck extremes:.*Closest game:.*Biggest blowout:.*Projection upset:.*Pickup highlight:.*Rivalry/,
  );
  expect(buildWrapped(fixture()).highlights).toEqual([]);
});
it('includes supported lineup/player/archetype and graded trade highlights', () => {
  const season = record();
  season.data.teams[0].lineupWeeks = 1;
  season.data.teams[0].correctStarts = 1;
  season.data.teams[0].lineupSlots = 2;
  season.data.scores[0].bestLineup = { points: 120, correctStarts: 1, slots: 2 };
  season.data.scores[0].lineupAvailable = true;
  season.data.scores[0].starters = [{ playerId: 'p', points: 30 }];
  season.data.scores[0].players = [{ playerId: 'p', points: 30 }];
  season.data.pickups = Array.from({ length: 10 }, (_, id) => ({
    ...season.data.pickups[0],
    id: String(id),
  }));
  season.data.tradeComparisons = [
    {
      id: 'trade',
      week: 1,
      weeks: [2, 3],
      possibleWeeks: 2,
      verdict: 'leader',
      winner: '1',
      sides: [{ teamId: '1', received: [], sent: [], receivedValue: 30, sentValue: 10, gain: 20 }],
    },
  ];
  expect(buildWrapped(season, 'a').highlights.join(' ')).toMatch(
    /Lineup choices:.*20.0 points left.*Guardian angel:.*Waiver Hawk:/,
  );
  expect(buildWrapped(season).highlights.join(' ')).toMatch(
    /Trade highlight: week 1, Alex led the 2-week assessment/,
  );
});
it.each([NaN, Infinity, undefined])(
  'never treats incomplete/nonfinite score %s as a tie or matchup highlight',
  (actual) => {
    const season = record();
    season.data.scores[1].actual = actual as number;
    const personal = buildWrapped(season, 'a').highlights.join(' '),
      league = buildWrapped(season).highlights.join(' ');
    expect(personal).toContain('Record: 0–0–0 in 0 verified matchups');
    expect(personal).not.toMatch(/Best matchup:|Worst matchup:|Expected wins:|NaN|Infinity/);
    expect(league).not.toMatch(/Closest game:|Biggest blowout:|Projection upset:|NaN|Infinity/);
  },
);
it('excludes duplicated reciprocal scores rather than counting repeated matchups', () => {
  const season = record();
  season.data.scores.push({ ...season.data.scores[0] });
  expect(buildWrapped(season, 'a').highlights.join(' ')).toContain(
    'Record: 0–0–0 in 0 verified matchups',
  );
  expect(buildWrapped(season).highlights.join(' ')).not.toMatch(
    /Closest game:|Biggest blowout:|Projection upset:/,
  );
});
