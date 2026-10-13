import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { matchupRecords } from './records';
it('ranks full-population worst beats and tied weekly scores with margins', () => {
  const r = season(2024, [
    [100, 110, 80, 70],
    [80, 80, 80, 80],
  ]);
  const x = matchupRecords([r]);
  expect(x[0]).toMatchObject({
    margin: 10,
    combined: 210,
    individual: 110,
    aRank: 2,
    bRank: 1,
    worstBeat: false,
  });
  expect(x[2]).toMatchObject({ margin: 0, aRank: 1, bRank: 1, worstBeat: false });
});
it('recognizes top-quarter losses and suppresses ranks on incomplete weeks', () => {
  const r = season(2024, [[100, 110, 80, 70, 60, 50, 40, 30]]);
  r.data.teams.push(
    ...['e', 'f', 'g', 'h'].map((teamId) => ({ ...r.data.teams[0], teamId, managerKey: teamId })),
  );
  r.data.scores.slice(4).forEach((s, i) => {
    s.teamId = ['e', 'f', 'g', 'h'][i];
    s.opponentTeamId = ['f', 'e', 'h', 'g'][i];
  });
  expect(matchupRecords([r])[0].worstBeat).toBe(true);
  r.data.scores.pop();
  expect(matchupRecords([r])[0]).toMatchObject({ worstBeat: false, aRank: null });
});
