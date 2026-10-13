import { render, screen } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { tradeContributions } from './contributions';
import { TradeContributions } from '../../components/history/moments/TradeContributions';
const base = calculateInsights({
  completedWeek: 6,
  teams: [],
  scores: [2, 3, 4, 5, 6].map((week) => ({
    teamId: 'b',
    week,
    actual: 10,
    projected: null,
    lineupAvailable: true,
    starters: week === 3 ? [] : [{ playerId: 'p', points: 10 }],
    players: [{ playerId: 'p', points: 10 }],
  })),
  moves: [
    { id: 'trade', type: 'trade', week: 2, timestamp: 1000, playerId: 'p', from: 'a', to: 'b' },
    { id: 'out', type: 'trade', week: 6, timestamp: 2000, playerId: 'p', from: 'b', to: 'a' },
  ],
  results: [{ teamId: 'b', champion: true, playoff: true, finish: 1, lastPlace: false }],
  playerNames: {},
  notes: [],
  draftPickTrades: 0,
});
const data = { ...base, playoffGames: [{ homeTeamId: 'b', awayTeamId: 'a', weeks: [4, 5] }] };
it('separates observed points, actual starts and explicitly documented playoff contribution', () => {
  expect(tradeContributions(data)[0]).toMatchObject({
    weeks: [3, 4, 5],
    observedPoints: 30,
    starts: 2,
    startingPoints: 20,
    playoffStarts: 2,
    playoffPoints: 20,
    champion: true,
    observedWeeks: 3,
    lineupWeeks: 3,
  });
});
it('excludes trade/next-movement weeks and unknown lineups; missing playoff evidence stays unknown', () => {
  const row = tradeContributions({
    ...base,
    scores: base.scores.map((s) => ({ ...s, lineupAvailable: false })),
  })[0];
  expect(row).toMatchObject({
    starts: 0,
    startingPoints: null,
    playoffStarts: null,
    playoffPoints: null,
  });
  expect(row.weeks).not.toContain(2);
  expect(row.weeks).not.toContain(6);
});
it('renders window, championship evidence, coverage and unranked context', () => {
  render(<TradeContributions data={data} manager="b" />);
  expect(screen.getByText('Documented champion roster')).toBeInTheDocument();
  expect(screen.getAllByText('2 / 20.0')).toHaveLength(2);
  expect(screen.getByText(/3\/3 observed player weeks/)).toHaveTextContent(
    'Unranked: context-dependent',
  );
  expect(screen.getByText(/Weeks 3–5/)).toHaveTextContent('before next observed trade, week 6');
});
