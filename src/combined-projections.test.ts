import {
  sleeperProjectionRules,
  espnProjectionRules,
  scoreProjection,
  combinePlayerProjection,
} from './combined-projections';
import { adviseLineup } from './lineup-advisor';
it('applies custom league weights and position overrides rather than provider fantasy totals', () => {
  const rules = espnProjectionRules(
    [
      { statId: 24, points: 0.2 },
      { statId: 53, points: 1, pointsOverrides: { '4': 1.5 } },
    ],
    'TE',
  );
  expect(scoreProjection({ rush_yd: 10, rec_yd: 20, rec: 4 }, rules, 'TE')).toBe(8);
  expect(
    scoreProjection(
      { rush_yd: 100, rec: 2 },
      sleeperProjectionRules({ rush_yd: 0.1, rec: 0.5 }),
      'RB',
    ),
  ).toBe(11);
});
it('blocks unsupported bonuses, malformed stats, empty projections and missing core coverage', () => {
  expect(
    scoreProjection(
      { rec_yd: 60, rec: 4 },
      sleeperProjectionRules({ rec_yd: 0.1, bonus_rec_te: 1 }),
      'TE',
    ),
  ).toBeUndefined();
  expect(scoreProjection({ rec_yd: 60 }, sleeperProjectionRules({ rec: 1 }), 'WR')).toBeUndefined();
  expect(scoreProjection({}, sleeperProjectionRules({ rush_yd: 0.1 }), 'RB')).toBeUndefined();
  expect(
    scoreProjection({ rush_yd: NaN }, sleeperProjectionRules({ rush_yd: 0.1 }), 'RB'),
  ).toBeUndefined();
  expect(espnProjectionRules([{ statId: 17, points: 3 }], 'QB').unsupported).toHaveLength(1);
});
it('reports source disagreement, preserves native fallback and does not mutate a roster', () => {
  const player = {
    id: '1',
    name: 'Player',
    starter: true,
    locked: true,
    points: 7,
    projectedPoints: 10,
  };
  const sources = [
    { provider: 'ESPN' as const, playerId: '2', points: 14, capturedAt: 'now' },
    { provider: 'Sleeper' as const, playerId: '1', points: 10, capturedAt: 'now' },
  ];
  expect(combinePlayerProjection(player, 'Sleeper', sources)).toMatchObject({
    projectedPoints: 12,
    projectionSpread: 4,
    projectionMethod: 'mean',
    starter: true,
    locked: true,
    points: 7,
  });
  expect(combinePlayerProjection(player, 'Sleeper', sources.slice(0, 1)).projectedPoints).toBe(10);
  expect(player.projectedPoints).toBe(10);
});
it('uses combined estimates in the lineup decision and explains their provenance', () => {
  const common = { position: 'RB', points: null, locked: false, availability: null, bye: false };
  const sources = [
    { provider: 'ESPN' as const, playerId: '2', points: 20, capturedAt: 'now' },
    { provider: 'Sleeper' as const, playerId: '1', points: 8, capturedAt: 'now' },
  ];
  const players = [
    { ...common, id: 'a', name: 'Starter', starter: true, lineupSlot: 'RB', projectedPoints: 10 },
    combinePlayerProjection(
      { ...common, id: '1', name: 'Bench', starter: false, projectedPoints: 8 },
      'Sleeper',
      sources,
    ),
  ];
  const result = adviseLineup(players, ['RB']);
  expect(result.starts.map((player) => player.name)).toEqual(['Bench']);
  expect(result.difference).toBe(4);
  expect(result.notices.join(' ')).toContain('equal-weight ESPN/Sleeper');
});

it('changes only the shared part of a Sleeper projection with native-only scoring', () => {
  const rules = sleeperProjectionRules({
    rec_yd: 0.1,
    rec: 1,
    bonus_rec_yd_100: 2,
    bonus_rec_yd_200: 5,
    fum_rec: 2,
    fum_rec_td: 6,
  });
  expect(rules.unsupported).toEqual([]);
  // The average yardage alone does not award either receiving-yard bonus.
  expect(scoreProjection({ rec_yd: 150, rec: 5 }, rules, 'WR')).toBe(20);
  expect(scoreProjection({ rec_yd: 150, rec: 5, rec_td: Number.NaN }, rules, 'WR')).toBe(20);
  expect(rules.nativeOnly).toHaveLength(4);
  const player = { id: '1', name: 'Receiver', starter: true, points: null, projectedPoints: 22 };
  const sources = [
    { provider: 'ESPN' as const, playerId: '2', points: 16, capturedAt: 'now' },
    { provider: 'Sleeper' as const, playerId: '1', points: 20, capturedAt: 'now' },
  ];
  const blended = combinePlayerProjection(player, 'Sleeper', sources, undefined, rules.nativeOnly);
  expect(blended).toMatchObject({
    projectedPoints: 20,
    projectionMethod: 'partial-mean',
    projectionSpread: 4,
  });
  expect(blended.projectionSources?.map((source) => source.scope)).toEqual([
    'shared-stats',
    'shared-stats',
  ]);
  expect(blended.projectionNote).toContain('100–199 receiving-yard bonus');

  const missing = combinePlayerProjection(
    { ...player, projectedPoints: undefined },
    'Sleeper',
    sources,
    undefined,
    rules.nativeOnly,
  );
  expect(missing.projectedPoints).toBeUndefined();
  expect(missing.projectionNote).toContain('requires both shared projections and a native total');
  expect(
    combinePlayerProjection(player, 'Sleeper', sources.slice(0, 1), undefined, rules.nativeOnly),
  ).toMatchObject({
    projectedPoints: 22,
    projectionMethod: 'native',
  });
});
