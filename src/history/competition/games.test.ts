import { describe, it, expect } from 'vitest';
import { competitionGames, pairRecord, rivalryLabels } from './games';
import { season } from './fixtures.test-support';
describe('verified historical games', () => {
  it('deduplicates reciprocal games and measures ties, points and margin', () => {
    const { games } = competitionGames([season()]);
    expect(games).toHaveLength(4);
    const r = pairRecord(games, 'a', 'b');
    expect(r).toMatchObject({
      games: 2,
      wins: 1,
      ties: 1,
      pointsFor: 180,
      pointsAgainst: 170,
      rate: 0.75,
      margin: 5,
    });
    expect(rivalryLabels([r], 3).rival).toBeUndefined();
    expect(rivalryLabels([r], 2).punchingBag).toEqual(r);
  });
  it('keeps renamed stable identities and season-scopes unknown owners', () => {
    const a = season(2023),
      b = season();
    b.data.teams[0].managerName = 'new';
    delete a.data.teams[1].managerKey;
    delete b.data.teams[1].managerKey;
    const x = competitionGames([b, a]);
    expect(x.managers.get('a')).toBe('new');
    expect(x.managers.has('unidentified:2023:b')).toBe(true);
    expect(x.managers.has('unidentified:2024:b')).toBe(true);
  });
  it('rejects unpaired, nonfinite and future scores', () => {
    const r = season();
    r.data.scores[1].opponentTeamId = 'c';
    r.data.scores[2].actual = NaN;
    r.data.completedWeek = 1;
    expect(competitionGames([r]).games).toHaveLength(0);
  });
});

it('includes verified playoff series once in head-to-head while suppressing weekly duplicates', () => {
  const r = season();
  r.data.playoffGames = [
    {
      id: 'final',
      homeTeamId: 'a',
      awayTeamId: 'b',
      weeks: [1, 2],
      homePoints: 180,
      awayPoints: 170,
      elimination: true,
    },
  ];
  const x = competitionGames([r]);
  expect(pairRecord(x.games, 'a', 'b')).toMatchObject({ games: 1, wins: 1, pointsFor: 180 });
  expect(x.games.find((g) => g.phase === 'playoff')?.week).toBe(2);
});
