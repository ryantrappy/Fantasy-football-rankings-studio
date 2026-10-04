import { verifiedUnowned, waiverImpact, recommendedDrop, type WaiverPool } from './waivers';
import type { LivePlayer } from './live-matchups';
const player = (id: string, points: number, starter = false): LivePlayer => ({
  id,
  name: id,
  position: 'RB',
  lineupSlot: starter ? 'RB' : undefined,
  projectedPoints: points,
  starter,
  points: null,
  locked: false,
  availability: null,
  bye: false,
});
it('verifies complete unique roster coverage and excludes active, reserve and taxi ownership', () => {
  const rosters = [
    { roster_id: 1, players: ['owned'], reserve: ['ir'], taxi: ['taxi'] },
    { roster_id: 2, players: ['other'] },
  ];
  expect(verifiedUnowned(rosters, 2, ['owned', 'ir', 'taxi', 'other', 'free', 'free'])).toEqual([
    'free',
  ]);
  expect(verifiedUnowned(rosters.slice(0, 1), 2, ['free'])).toBeUndefined();
  expect(verifiedUnowned([rosters[0], rosters[0]], 2, ['free'])).toBeUndefined();
  expect(verifiedUnowned([{ roster_id: 1 }], 1, ['free'])).toBeUndefined();
});
function pool(): WaiverPool {
  return {
    capturedAt: '2026-10-01',
    week: 5,
    slots: ['RB'],
    candidates: [player('free', 20)],
    team: {
      teamId: '1',
      name: 'Me',
      score: null,
      players: [player('starter', 10, true), player('bench', 5)],
    },
    notices: [],
  };
}
it('compares league-scored legal lineup impact without changing source ownership', () => {
  const data = pool(),
    before = JSON.stringify(data);
  expect(waiverImpact(data, data.candidates[0], 'bench').difference).toBe(10);
  expect(JSON.stringify(data)).toBe(before);
});
it('rejects owned/non-pool candidates, reserves, locks and byes', () => {
  const data = pool(),
    candidate = data.candidates[0];
  expect(waiverImpact(data, player('owned', 100), 'bench').difference).toBeNull();
  for (const changed of [
    { ...candidate, bye: true },
    { ...candidate, locked: true },
    { ...candidate, availability: 'OUT' },
  ])
    expect(waiverImpact(data, changed, 'bench').difference).toBeNull();
  data.team!.players[1].reserve = true;
  expect(waiverImpact(data, candidate, 'bench').difference).toBeNull();
  data.team!.players[1].reserve = false;
  data.team!.players[1].locked = true;
  expect(waiverImpact(data, candidate, 'bench').difference).toBeNull();
});
it('does not fill projection gaps with zero or claim an unsupported roster drop', () => {
  const data = pool();
  data.candidates[0].projectedPoints = undefined;
  expect(waiverImpact(data, data.candidates[0], 'bench').difference).toBeNull();
  data.candidates[0].position = 'QB';
  expect(waiverImpact(data, data.candidates[0], 'bench').difference).toBeNull();
});

it('suggests a same-position drop only when the candidate improves the legal lineup', () => {
  const data = pool();
  expect(recommendedDrop(data, data.candidates[0])?.impact.difference).toBe(10);
  data.candidates[0].projectedPoints = 1;
  expect(recommendedDrop(data, data.candidates[0])).toBeUndefined();
});
