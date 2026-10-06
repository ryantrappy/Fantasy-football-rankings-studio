import { ApiContext } from '../../src/auth/session';
import { afterPreviewData } from './loading-data';
import { TradeAnalyzerPage } from '../../src/components/TradeAnalyzerPage';
import type { LiveLeague, LivePlayer } from '../../src/live-matchups';

const roster = (prefix: string): LivePlayer[] =>
  ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'RB', 'WR', 'QB', 'TE', 'RB', 'WR'].map(
    (position, index) => ({
      id: `${prefix}-${index}`,
      name: `${prefix} ${['Quarterback', 'Running Back', 'Pass Catcher', 'Wide Receiver', 'Deep Threat', 'Tight End', 'Bench Back', 'Slot Receiver', 'Backup QB', 'Backup TE', 'Rookie Back', 'Reserve Receiver'][index]}`,
      position,
      lineupSlot: position,
      starter: index < 6,
      owned: true,
      locked: index === 11,
      projectedPoints: 22 - index,
      points: null,
      availability: null,
      bye: false,
    }),
  );
const league: LiveLeague = {
  leagueId: 'trade-preview',
  leagueName: 'Sunday League',
  provider: 'Sleeper',
  season: 2026,
  week: 5,
  capturedAt: '2026-10-03T22:00:00Z',
  lineupSlots: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE'],
  matchups: [
    {
      id: '1',
      home: { teamId: '1', name: 'Fourth & Long', score: null, players: roster('Home') },
      away: { teamId: '2', name: 'Sunday Stunners', score: null, players: roster('Away') },
    },
  ],
};
const discoveryLeague: LiveLeague = {
  ...league,
  lineupSlots: ['RB', 'WR'],
  tradeRules: { deadlineWeek: 10, reviewDays: 2 },
  matchups: [
    {
      id: 'discovery',
      home: {
        teamId: '1',
        name: 'Fourth & Long',
        score: null,
        players: [
          { ...roster('Home')[1], id: '101', name: 'Home Lead RB', projectedPoints: 20 },
          { ...roster('Home')[6], id: '102', name: 'Home Depth RB', projectedPoints: 18 },
          { ...roster('Home')[3], id: '103', name: 'Home Weak WR', projectedPoints: 5 },
        ],
      },
      away: {
        teamId: '2',
        name: 'Sunday Stunners',
        score: null,
        players: [
          { ...roster('Away')[3], id: '201', name: 'Away Lead WR', projectedPoints: 22 },
          { ...roster('Away')[7], id: '202', name: 'Away Depth WR', projectedPoints: 17 },
          { ...roster('Away')[1], id: '203', name: 'Away Weak RB', projectedPoints: 6 },
        ],
      },
    },
  ],
};
export function TradePreview({ suggestions = false }: { suggestions?: boolean }) {
  const teams = [
    { teamId: '1', teamName: 'Fourth & Long', managerName: 'Home manager' },
    { teamId: '2', teamName: 'Sunday Stunners', managerName: 'Away manager' },
  ];
  return (
    <ApiContext
      value={
        {
          getLiveMatchups: async () => afterPreviewData([suggestions ? discoveryLeague : league]),
          ...(suggestions
            ? {
                managedTeam: {
                  get: async () => ({ teamId: '1', teams, needsReselection: false }),
                  set: async (_id: string, _year: number, teamId: string | null) => ({
                    teamId,
                    teams,
                    needsReselection: false,
                  }),
                },
              }
            : {}),
          listLeagues: async () =>
            afterPreviewData([
              {
                leagueId: league.leagueId,
                leagueName: league.leagueName,
                seasonId: league.season,
                leagueType: 0,
              },
            ]),
          getLiveLeague: async () => afterPreviewData(suggestions ? discoveryLeague : league),
        } as never
      }
    >
      <TradeAnalyzerPage />
    </ApiContext>
  );
}
