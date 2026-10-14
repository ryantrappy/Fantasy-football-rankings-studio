import { WeeklyOverviewPage } from '../../src/components/WeeklyOverviewPage';
import { ApiContext } from '../../src/auth/session';
import type { LiveLeague, LivePlayer } from '../../src/live-matchups';
import { playoffData } from './fixture';
const players: LivePlayer[] = [
  {
    id: 'starter',
    name: 'Starting Runner',
    position: 'RB',
    lineupSlot: 'RB',
    projectedPoints: 10,
    points: 8.5,
    starter: true,
    locked: false,
    availability: null,
    bye: false,
    owned: true,
  },
  {
    id: 'bench',
    name: 'Bench Runner',
    position: 'RB',
    projectedPoints: 18,
    points: 0,
    starter: false,
    locked: false,
    availability: null,
    bye: false,
    owned: true,
  },
];
const live: LiveLeague[] = ['1', '2'].map((leagueId) => ({
  leagueId,
  leagueName: `League ${leagueId}`,
  provider: leagueId === '1' ? 'Sleeper' : 'ESPN',
  season: 2026,
  week: 7,
  capturedAt: '2026-10-14T12:00:00Z',
  lineupSlots: ['RB'],
  matchups: [
    {
      id: 'game',
      home: { teamId: '1', name: 'My team', score: 8.5, players },
      away: { teamId: '2', name: `Opponent ${leagueId}`, score: 12.5, players: [] },
    },
  ],
}));
const api = {
  listLeagues: async () =>
    ['1', '2'].map((leagueId) => ({
      leagueId,
      leagueName: `League ${leagueId}`,
      leagueType: leagueId === '1' ? 0 : 1,
      seasonId: 2026,
    })),
  getLiveMatchups: async () => live,
  getTeams: async () => [
    { teamId: '1', teamName: 'My team', managerName: 'Owner', wins: 4, loss: 2, ties: 0 },
  ],
  waivers: {
    get: async () => ({
      capturedAt: '2026-10-14T12:00:00Z',
      week: 7,
      ownership: { covered: 2, expected: 2 },
      candidates: [
        {
          ...players[1],
          id: 'candidate',
          name: 'Available Runner',
          projectedPoints: 22,
          owned: false,
        },
      ],
      team: live[0].matchups[0].home,
      slots: ['RB'],
      notices: ['Waiver claim restrictions and future-week impact are unavailable.'],
    }),
  },
  getInsights: async () => playoffData,
  managedTeam: {
    get: async () => ({
      teams: [{ teamId: '1', teamName: 'My team', managerName: 'Owner' }],
      teamId: '1',
      needsReselection: false,
    }),
  },
};
export function OverviewPreview() {
  return (
    <ApiContext value={api as never}>
      <WeeklyOverviewPage />
    </ApiContext>
  );
}
