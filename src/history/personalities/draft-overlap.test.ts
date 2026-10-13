import { fixture } from './activity.test';
import { draftOverlap } from './draft-overlap';
it('shows repeated targets and seasons only within comparable formats', () => {
  const a = fixture({
    draftFormat: 'snake',
    draftPicks: [{ teamId: '1', playerId: 'p', overallPick: 1 }],
  });
  const b = fixture({
    draftFormat: 'snake',
    draftPicks: [{ teamId: '2', playerId: 'p', overallPick: 2 }],
  });
  b.year = 2024;
  const result = draftOverlap([a, b]);
  expect(result.rows[0]).toMatchObject({
    overlap: 1,
    union: 1,
    players: [{ id: 'p', aYears: [2025], bYears: [2024] }],
  });
  expect(
    draftOverlap([a, { ...b, data: { ...b.data, draftFormat: 'auction' } } as unknown as typeof b])
      .rows,
  ).toHaveLength(0);
  expect(draftOverlap([fixture()]).unsupported).toHaveLength(1);
});
