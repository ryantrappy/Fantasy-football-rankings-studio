import { fixture } from './activity.test';
import { playerImpact } from './player-impact';
const scores = [
  {
    teamId: '1',
    opponentTeamId: '2',
    week: 1,
    actual: 100,
    lineupAvailable: true,
    starters: [
      { playerId: 'p', points: 30 },
      { playerId: 'p', points: 30 },
    ],
    players: [{ playerId: 'p', points: 30 }],
  },
  {
    teamId: '2',
    opponentTeamId: '1',
    week: 1,
    actual: 80,
    lineupAvailable: true,
    starters: [],
    players: [],
  },
];
it('attributes verified owned appearances once with explicit removal margin', () => {
  const result = playerImpact([fixture({ scores })]);
  expect(result.rows).toHaveLength(2);
  expect(result.rows[0]).toMatchObject({ appearances: 1, points: 30, decisive: 1 });
  expect(new Set(result.rows.map((r) => r.role))).toEqual(new Set(['Guardian angel', 'Nemesis']));
});
it('excludes unavailable rosters and unowned starters', () => {
  expect(
    playerImpact([fixture({ scores: scores.map((s) => ({ ...s, players: undefined })) })]).rows,
  ).toEqual([]);
  expect(
    playerImpact([fixture({ scores: scores.map((s) => ({ ...s, players: [] })) })]).rows,
  ).toEqual([]);
});
it('does not join changed player IDs even with identical names', () => {
  const second = fixture({
    scores: scores.map((s) => ({
      ...s,
      starters: s.starters.map((p) => ({ ...p, playerId: 'new' })),
      players: [{ playerId: 'new', points: 30 }],
    })),
  });
  second.year = 2024;
  expect(playerImpact([fixture({ scores }), second]).rows).toHaveLength(4);
});
