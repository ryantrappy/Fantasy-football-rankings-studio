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
export function TradePreview() {
  return (
    <ApiContext value={{ getLiveMatchups: async () => afterPreviewData([league]) } as never}>
      <TradeAnalyzerPage />
    </ApiContext>
  );
}
