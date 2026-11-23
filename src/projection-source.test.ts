import type { LivePlayer } from './live-matchups';
import { projectionText, selectPlayerProjection } from './projection-source';

const player: LivePlayer = {
  id: 's1',
  name: 'Receiver',
  starter: true,
  points: 8,
  projectedPoints: 13,
  nativeProjection: { provider: 'Sleeper', points: 11 },
  projectionMethod: 'partial-mean',
  projectionSpread: 4,
  projectionSources: [
    { provider: 'Sleeper', playerId: 's1', points: 10, scope: 'shared-stats', capturedAt: 'time' },
    { provider: 'ESPN', playerId: 'e1', points: 14, scope: 'shared-stats', capturedAt: 'time' },
  ],
};

it('selects from the retained snapshot without promoting a subtotal into a complete estimate', () => {
  expect(selectPlayerProjection(player, 'Combined', 'Sleeper')).toBe(player);
  const sleeper = selectPlayerProjection(player, 'Sleeper', 'Sleeper');
  expect(sleeper.projectedPoints).toBe(11);
  expect(sleeper.projectionSources).toEqual([
    { provider: 'Sleeper', playerId: 's1', points: 11, capturedAt: 'time' },
  ]);
  const espn = selectPlayerProjection(player, 'ESPN', 'Sleeper');
  expect(espn.projectedPoints).toBeUndefined();
  expect(espn.projectionSubtotal).toBe(14);
  expect(espn.projectionSources?.map((entry) => entry.provider)).toEqual(['ESPN']);
  expect(espn.points).toBe(8);
  expect(projectionText(espn.projectedPoints, espn.projectionSubtotal)).toBe('14.00 (partial)');
  expect(player.projectedPoints).toBe(13);
});

it('uses an available full ESPN total or preserves its absence', () => {
  const { projectionSources: _sources, ...native } = player;
  const espn = selectPlayerProjection(
    {
      ...native,
      projectedPoints: 18,
      nativeProjection: { provider: 'ESPN', points: 16 },
    },
    'ESPN',
    'ESPN',
  );
  expect(espn.projectedPoints).toBe(16);
  const missing = selectPlayerProjection(native, 'ESPN', 'Sleeper');
  expect(missing.projectedPoints).toBeUndefined();
  expect(missing.projectionSources).toEqual([]);
});

it('keeps independently confirmed NFL byes at zero in strict provider views', () => {
  const bye = selectPlayerProjection(
    {
      ...player,
      nflSchedule: { status: 'bye', source: 'ESPN NFL scoreboard', capturedAt: 'schedule time' },
    },
    'ESPN',
    'Sleeper',
  );
  expect(bye.projectedPoints).toBe(0);
  expect(bye.projectionSources?.[0]).toMatchObject({
    provider: 'ESPN',
    playerId: 'e1',
    basis: 'confirmed-bye',
    capturedAt: 'schedule time',
  });
  const unmappedBye = selectPlayerProjection(
    {
      ...player,
      projectionSources: [],
      nflSchedule: { status: 'bye', source: 'ESPN NFL scoreboard', capturedAt: 'schedule time' },
    },
    'ESPN',
    'Sleeper',
  );
  expect(unmappedBye.projectedPoints).toBe(0);
  expect(unmappedBye.projectionSources).toEqual([]);
});
