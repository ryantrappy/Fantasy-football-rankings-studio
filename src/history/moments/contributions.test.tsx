import { render, screen, within } from '@testing-library/react';
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
const data = {
  ...base,
  playoffGames: [
    {
      id: 'final',
      homeTeamId: 'b',
      awayTeamId: 'a',
      weeks: [4, 5],
      homePoints: 20,
      awayPoints: 10,
      elimination: true,
    },
  ],
};
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
    starts: null,
    startingPoints: null,
    playoffStarts: null,
    playoffPoints: null,
  });
  expect(row.weeks).not.toContain(2);
  expect(row.weeks).not.toContain(6);
});
it('renders window, championship evidence, coverage and unranked context', () => {
  render(<TradeContributions data={data} manager="b" />);
  expect(
    screen.getByText('Recipient later champion; asset championship role unverified'),
  ).toBeInTheDocument();
  expect(screen.getAllByText('2 / 20.0')).toHaveLength(2);
  const table = within(
    screen.getByRole('table', { name: 'Acquired assets — season-long observed contribution' }),
  );
  expect(table.getByText(/3\/3 observed player weeks/)).toHaveTextContent(
    'Unranked: context-dependent',
  );
  expect(screen.getByText(/Weeks 3–5/)).toHaveTextContent('before next observed trade, week 6');
  const inspector = screen.getByRole('complementary', { name: 'Record evidence' });
  expect(inspector).toHaveTextContent('3/3 observed player weeks');
  expect(inspector).toHaveTextContent('Championship role and future value are unverified');
});

it('never attributes championship membership to a player dropped before postseason', () => {
  const dropped = {
    ...data,
    moves: [
      base.moves![0],
      {
        id: 'drop',
        type: 'drop' as const,
        week: 4,
        timestamp: 1500,
        playerId: 'p',
        from: 'b',
        to: null,
      },
    ],
  };
  const row = tradeContributions(dropped)[0];
  expect(row).toMatchObject({ weeks: [3], playoffPoints: 0, playoffStarts: 0, champion: true });
  render(<TradeContributions data={dropped} manager="b" />);
  expect(screen.getByRole('columnheader', { name: 'Recipient season result' })).toBeInTheDocument();
  expect(
    screen.getByText('Recipient later champion; asset championship role unverified'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Documented champion roster')).not.toBeInTheDocument();
});
it('excludes ambiguous duplicate weeks, invalid totals and nonfinite player evidence instead of zero', () => {
  for (const scores of [
    [],
    [...base.scores, ...base.scores],
    base.scores.map((s) => ({ ...s, actual: NaN })),
    base.scores.map((s) => ({
      ...s,
      players: [{ playerId: 'p', points: Infinity }],
      starters: [{ playerId: 'p', points: Infinity }],
    })),
  ]) {
    const row = tradeContributions({ ...data, scores })[0];
    expect(row).toMatchObject({
      observedPoints: null,
      startingPoints: null,
      starts: null,
      playoffPoints: null,
      playoffStarts: null,
      observedWeeks: 0,
      lineupWeeks: 0,
    });
  }
});
