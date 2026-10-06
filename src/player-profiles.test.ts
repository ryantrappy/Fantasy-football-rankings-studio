import { playerProfiles, comparePlayerRange } from './player-profiles';
import type { SeasonInsights } from './insights';
import type { LiveLeague } from './live-matchups';
import { calculateInsights } from './server/insights/calculate';
const report = (points: number): SeasonInsights =>
  ({
    generatedAt: '2026-10-01',
    scores: [
      {
        teamId: '1',
        week: 1,
        actual: points,
        projected: null,
        starters: [],
        players: [{ playerId: '1', points }],
      },
      {
        teamId: '1',
        week: 3,
        actual: 0,
        projected: null,
        starters: [],
        players: [{ playerId: '1', points: 0 }],
      },
    ],
  }) as unknown as SeasonInsights;
const live: LiveLeague = {
  leagueId: '10',
  leagueName: 'League',
  provider: 'Sleeper',
  season: 2026,
  week: 5,
  capturedAt: '2026-10-02',
  matchups: [
    {
      id: '1',
      home: {
        teamId: '1',
        name: 'Team',
        score: null,
        players: [
          {
            id: '1',
            name: 'Same Name',
            position: 'RB',
            projectedPoints: 20,
            points: null,
            starter: true,
            owned: true,
            availability: 'QUESTIONABLE',
          },
          { id: '2', name: 'Same Name', position: 'RB', points: null, starter: false, owned: true },
        ],
      },
      away: null,
    },
  ],
};
it('uses supplied league scoring with explicit partial common-range coverage and true zero observations', () => {
  const profile = playerProfiles('Sleeper', 2026, report(10), live)[0];
  expect(comparePlayerRange(profile, 1, 3)).toMatchObject({
    total: 10,
    average: 5,
    covered: 2,
    expected: 3,
    weeks: [
      { week: 1, points: 10 },
      { week: 2, points: null },
      { week: 3, points: 0 },
    ],
  });
  expect(comparePlayerRange(playerProfiles('Sleeper', 2026, report(20), live)[0], 1, 3).total).toBe(
    20,
  );
  expect(profile).toMatchObject({
    ownership: 'Team',
    projection: 20,
    projectionWeek: 5,
    reportAt: '2026-10-01',
    rosterAt: '2026-10-02',
  });
});
it('never merges equal names or provider/season identity collisions', () => {
  const profiles = playerProfiles('Sleeper', 2026, report(10), live);
  expect(profiles).toHaveLength(2);
  expect(profiles.map((profile) => profile.key)).toEqual(['Sleeper:2026:1', 'Sleeper:2026:2']);
  expect(playerProfiles('ESPN', 2026, report(10))[0].key).toBe('ESPN:2026:1');
  expect(playerProfiles('Sleeper', 2025, report(10))[0].key).toBe('Sleeper:2025:1');
});
it('rejects contradictory duplicate observed weeks and leaves absent projections/status unavailable', () => {
  const data = report(10);
  data.scores.push({ ...data.scores[0], teamId: '2', players: [{ playerId: '1', points: 30 }] });
  const profile = playerProfiles('Sleeper', 2026, data)[0];
  expect(comparePlayerRange(profile, 1, 1).total).toBeNull();
  expect(profile.projection).toBeUndefined();
  expect(profile.availability).toBeUndefined();
  expect(profile.ownership).toBe('Unavailable');
});

it('retains scoped historical identities and observed starter positions without current ownership', () => {
  const data = calculateInsights({
    completedWeek: 1,
    teams: [],
    moves: [],
    notes: [],
    draftPickTrades: 0,
    playerNames: { '1': 'Same Name', '2': 'Same Name', unrelated: 'Other NFL Player' },
    playerPositions: { '2': 'WR', unrelated: 'QB' },
    scores: [
      {
        teamId: '1',
        week: 1,
        actual: 5,
        projected: null,
        starters: [{ playerId: '1', points: 0, position: 'RB' }],
        players: [
          { playerId: '1', points: 0 },
          { playerId: '2', points: 5 },
          { playerId: '3', points: -1 },
        ],
      },
    ],
  });
  expect(data.playerIdentities).toEqual({
    '1': { name: 'Same Name', position: 'RB' },
    '2': { name: 'Same Name', position: 'WR' },
  });
  const profiles = playerProfiles('Sleeper', 2024, data, live);
  expect(profiles).toHaveLength(3);
  expect(profiles.find((row) => row.id === '1')).toMatchObject({
    name: 'Same Name',
    position: 'RB',
    observed: { 1: 0 },
    ownership: 'Unavailable',
  });
  expect(profiles.find((row) => row.id === '1')?.projection).toBeUndefined();
  expect(profiles.find((row) => row.id === '1')?.availability).toBeUndefined();
  expect(profiles.find((row) => row.id === '2')).toMatchObject({
    name: 'Same Name',
    position: 'WR',
    key: 'Sleeper:2024:2',
  });
  expect(profiles.find((row) => row.id === '3')).toMatchObject({
    name: 'Player 3',
    position: undefined,
  });
  expect(playerProfiles('ESPN', 2024, data)[0].key).toContain('ESPN:2024:');
});
