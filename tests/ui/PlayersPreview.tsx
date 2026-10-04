import { ApiContext } from '../../src/auth/session';
import { PlayerProfilesPage } from '../../src/components/PlayerProfilesPage';
import type { LiveLeague, LivePlayer } from '../../src/live-matchups';

const players: LivePlayer[] = [
  ['1', 'Jordan Runner', 'RB', 20.5],
  ['2', 'Alex Receiver', 'WR', 16.25],
  ['3', 'Casey Quarterback', 'QB', 22],
  ['4', 'Morgan Tight End', 'TE', 0],
  ['5', 'Taylor Backup', 'RB', undefined],
].map(([id, name, position, projectedPoints], index) => ({
  id: id as string,
  name: name as string,
  position: position as string,
  projectedPoints: projectedPoints as number | undefined,
  owned: true,
  starter: index < 4,
  points: null,
  availability: index === 1 ? 'QUESTIONABLE' : null,
  bye: index === 3,
  locked: false,
}));
players[0].projectionSources = [
  { provider: 'Sleeper', playerId: '1', points: 19, capturedAt: '2026-10-04T00:00:00Z' },
  { provider: 'ESPN', playerId: '100', points: 22, capturedAt: '2026-10-04T00:00:00Z' },
];
players[0].projectionSpread = 3;
players[0].projectionNote = 'Equal-weight ESPN/Sleeper mean.';
const live: LiveLeague = {
  leagueId: '123',
  leagueName: 'Sunday League',
  season: 2026,
  week: 5,
  provider: 'Sleeper',
  capturedAt: '2026-10-04T00:00:00Z',
  matchups: [
    { id: '1', home: { teamId: '1', name: 'Fourth & Long', score: null, players }, away: null },
  ],
};
const api = {
  listLeagues: async () => [
    { leagueId: '123', leagueName: 'Sunday League', seasonId: 2026, leagueType: 0 },
  ],
  getLiveMatchups: async () => [live],
  getInsights: async () => ({
    generatedAt: '2026-10-04T00:00:00Z',
    scores: Array.from({ length: 4 }, (_, index) => ({
      week: index + 1,
      players: players.flatMap((player, i) =>
        i === 4 || (i === 1 && index === 2)
          ? []
          : [{ playerId: player.id, points: i === 3 ? 0 : 12 + index * 2 + i }],
      ),
    })),
  }),
  waivers: {
    get: async () => ({ candidates: [], notices: [], week: 5, capturedAt: '2026-10-04T00:00:00Z' }),
  },
};
export function PlayersPreview() {
  return (
    <ApiContext value={api as never}>
      <PlayerProfilesPage />
    </ApiContext>
  );
}
