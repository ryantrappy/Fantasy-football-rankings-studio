import { fixture } from './activity.test';
import { playerLoyalty } from './loyalty';
it('deduplicates weeks while preserving acquisition paths and partial samples', () => {
  const score = { teamId: '1', week: 1, players: [{ playerId: 'p' }, { playerId: 'p' }] };
  const record = fixture({
    scores: [score, score],
    draftPicks: [{ teamId: '1', playerId: 'p', overallPick: 1 }],
    moves: [
      { id: 't', type: 'trade', to: '1', playerId: 'p', week: 2 },
      { id: 't', type: 'trade', to: '1', playerId: 'p', week: 2 },
      { id: 'w', type: 'pickup', to: '1', playerId: 'p', week: 3 },
    ],
  });
  expect(playerLoyalty([record])[0]).toMatchObject({
    weeks: 1,
    drafts: 1,
    trades: 1,
    pickups: 1,
    seasons: [2025],
  });
});
