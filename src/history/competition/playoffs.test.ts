import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { historicalPlayoffs } from './playoffs';
import { sleeperPlayoffGames, espnPlayoffGames } from './playoff-games';
it('counts complete multiweek championship series once and excludes placement/bye/incomplete', () => {
  const r = season(2024, [
    [100, 90, 80, 70],
    [80, 80, 120, 60],
  ]);
  const bracket = [
    { m: 1, r: 1, t1: 1, t2: 2, w: 1, l: 2 },
    { m: 2, r: 1, t1: 3, t2: 4, w: 3, l: 4 },
    { m: 3, r: 2, p: 1, t1: 1, t2: 3, w: 3, l: 1, t1_from: { w: 1 }, t2_from: { w: 2 } },
    { m: 4, r: 2, p: 3, t1: 2, t2: 4, w: 2, l: 4 },
  ];
  const scores = r.data.scores.map((s) => ({
    ...s,
    teamId: String(['a', 'b', 'c', 'd'].indexOf(s.teamId) + 1),
  }));
  expect(sleeperPlayoffGames(bracket, [[1], [2]], scores, 2)).toHaveLength(3);
  expect(sleeperPlayoffGames(bracket, [[1], [2]], scores, 1)).toHaveLength(2);
  const final = [{ m: 1, r: 1, p: 1, t1: 1, t2: 2, w: 1, l: 2 }];
  expect(sleeperPlayoffGames(final, [[1, 2]], scores, 2)[0]).toMatchObject({
    homePoints: 180,
    awayPoints: 170,
    weeks: [1, 2],
  });
  scores[0].actual = NaN;
  expect(sleeperPlayoffGames(final, [[1, 2]], scores, 2)).toHaveLength(0);
});
it('requires explicit ESPN winners bracket and published scoring-period mapping', () => {
  const scores = season().data.scores.map((s) => ({
    ...s,
    teamId: String(['a', 'b', 'c', 'd'].indexOf(s.teamId) + 1),
  }));
  const match = {
    home: { teamId: 1 },
    away: { teamId: 2 },
    matchupPeriodId: 3,
    playoffTierType: 'WINNERS_BRACKET',
  };
  expect(espnPlayoffGames([match], { '3': [1, 2] }, scores, 2)[0]).toMatchObject({
    elimination: false,
    homePoints: 180,
  });
  expect(
    espnPlayoffGames([{ ...match, playoffTierType: 'LOSERS_BRACKET' }], { '3': [1, 2] }, scores, 2),
  ).toHaveLength(0);
  expect(espnPlayoffGames([match], undefined, scores, 2)).toHaveLength(0);
});
it('keeps unavailable brackets unknown and labels only sufficient elimination evidence', () => {
  const a = season();
  expect(historicalPlayoffs([a])[0]).toMatchObject({
    playoffGames: 0,
    playoffRate: null,
    label: 'Insufficient elimination-game evidence',
  });
  const records = [2022, 2023, 2024].map((y) => {
    const r = season(y);
    r.data.playoffGames = [
      {
        id: 'final',
        homeTeamId: 'a',
        awayTeamId: 'b',
        weeks: [3],
        homePoints: 110,
        awayPoints: 100,
        elimination: true,
      },
    ];
    return r;
  });
  expect(historicalPlayoffs(records).find((r) => r.key === 'a')).toMatchObject({
    playoffGames: 3,
    mustWinGames: 3,
    label: 'Clutch record',
  });
  expect(historicalPlayoffs(records, 4).find((r) => r.key === 'a')?.label).toBe(
    'Insufficient elimination-game evidence',
  );
});
