import { bootstrapFixture } from './season-bootstrap.fixture';
import { buildBootstrapLeague } from './season-bootstrap-input';
import {
  bootstrapLineup,
  runBootstrapSeasons,
  simulateBootstrapSeasons,
  type BootstrapLeague,
  type BootstrapOptions,
} from './season-bootstrap';

const player = (id: string, points: number, slots: number[]) => ({
  id,
  name: id,
  position: 'RB',
  scores: [points],
  slots,
});
const input: BootstrapLeague = {
  weeks: 2,
  slotCount: 1,
  teams: [
    { id: 'a', name: 'Alpha', players: [player('starter', 10, [0]), player('bench', 2, [0])] },
    { id: 'b', name: 'Beta', players: [player('opponent', 5, [0])] },
  ],
  schedule: [[[0, 1]], [[1, 0]]],
};
const options: BootstrapOptions = { trials: 30, seed: 42, lineup: 'best-ball', schedule: 'league' };

function simulate(league: BootstrapLeague, options: BootstrapOptions) {
  const iterator = simulateBootstrapSeasons(league, options);
  for (;;) {
    const step = iterator.next();
    if (step.done) return step.value;
  }
}

it('maximizes a legal lineup even when a flex assignment must be moved', () => {
  const players = [
    player('flexible', 20, [0, 1]),
    player('only-flex', 18, [0]),
    player('other', 3, [1]),
  ];
  expect(bootstrapLineup(players, [20, 18, 3], 2)).toEqual({ points: 38, filled: 2 });
  expect(bootstrapLineup(players, [20, 18, 3], 2, 0)).toEqual({ points: 21, filled: 2 });
});

it('uses identical baseline scores in a paired removal comparison', () => {
  const baseline = simulate(input, options);
  const comparison = simulate(input, { ...options, remove: { teamId: 'a', playerId: 'starter' } });
  expect(comparison.teams).toEqual(baseline.teams);
  expect(comparison.removal).toEqual({ teamId: 'a', playerId: 'starter', wins: -2, points: -16 });
  expect(comparison.teams[0]).toMatchObject({
    wins: 2,
    allPlay: 1,
    points: 20,
    pointsAgainst: 10,
    optimalPoints: 20,
    finish: 1,
    winCounts: [{ wins: 2, count: 30 }],
    finishCounts: [30, 0],
  });
});

it('is reproducible across seeds and preserves optimal points under manager efficiency', () => {
  const config = { ...options, lineup: 'managed' as const, schedule: 'random' as const };
  const league = structuredClone(input);
  league.teams[0].players[0].scores = [8, 10, 12];
  const result = simulate(league, config);
  expect(simulate(league, config)).toEqual(result);
  expect(simulate(league, { ...config, seed: 43 })).not.toEqual(result);
  const bestBall = simulate(league, { ...config, lineup: 'best-ball' });
  expect(result.teams[0].points).toBeLessThan(bestBall.teams[0].points);
  expect(result.teams[0].optimalPoints).toBe(bestBall.teams[0].optimalPoints);
});

it('credits ties as half a win and shares equal finishing places', () => {
  const league = {
    ...input,
    teams: input.teams.map((team) => ({ ...team, players: [player(team.id, 5, [0])] })),
  };
  const result = simulate(league, options);
  for (const team of result.teams)
    expect(team).toMatchObject({ wins: 1, allPlay: 0.5, finish: 1, finishCounts: [30, 0] });
});

it('rejects a canceled run', async () => {
  const controller = new AbortController();
  const progress = vi.fn();
  controller.abort();
  await expect(
    runBootstrapSeasons(input, options, progress, controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(progress).not.toHaveBeenCalled();
});

it('can cancel after trials have started', async () => {
  const controller = new AbortController();
  const progress = vi.fn(() => controller.abort());
  await expect(
    runBootstrapSeasons(input, options, progress, controller.signal),
  ).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(progress).toHaveBeenCalledTimes(1);
});

it('deduplicates complete player weeks, excludes future scores, and reports positional coverage', () => {
  const { report, live } = bootstrapFixture();
  const result = buildBootstrapLeague(report, live, 2026);
  expect(result).toMatchObject({
    sampleWeeks: 2,
    sampleCount: 4,
    positionalPlayers: 1,
    excludedPlayers: 0,
  });
  expect(result.league.teams[0].players[1].scores).toEqual([10, 20, 4, 8]);
  expect(result.league.schedule).toEqual([[[0, 1]], [[0, 1]]]);
  expect(buildBootstrapLeague(report, live, 2025).league.schedule).toBeUndefined();
  report.regularSeasonSchedule!.fixtures.pop();
  expect(buildBootstrapLeague(report, live, 2026).league.schedule).toBeUndefined();
});

it('discloses unsupported slots and incomplete lineup coverage', () => {
  const { report, live } = bootstrapFixture();
  live.lineupSlots = ['RB', 'QB'];
  expect(() => buildBootstrapLeague(report, live, 2026)).toThrow(
    /cannot fill a legal starting lineup/,
  );
  live.lineupSlots = ['Unsupported slot 99'];
  expect(() => buildBootstrapLeague(report, live, 2026)).toThrow(
    /rules are unavailable or unsupported/,
  );
});
