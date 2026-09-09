import { normalizedComparisons } from './normalize';
import type { InsightsSource, PlayerMove } from '../../insights';
function fixture(): InsightsSource {
  const playerPositions: Record<string, string> = { q: 'QB', r: 'RB', d: 'RB' };
  for (const p of ['QB', 'RB']) for (let i = 0; i < 3; i++) playerPositions[`${p}${i}`] = p;
  const scores = Array.from({ length: 6 }, (_, i) => ({
    teamId: '1',
    week: i + 1,
    actual: 100,
    projected: null,
    lineupAvailable: true,
    players: [
      { playerId: 'q', points: 28 },
      { playerId: 'r', points: 18 },
      { playerId: 'd', points: 20 },
    ],
    starters: [
      { playerId: 'r', points: 18 },
      ...['QB', 'RB'].flatMap((p) =>
        [0, 1, 2].map((i) => ({ playerId: `${p}${i}`, points: p === 'QB' ? 25 : 10 })),
      ),
    ],
  }));
  return {
    completedWeek: 6,
    teams: [],
    scores,
    moves: [
      { id: 't', week: 1, timestamp: 1, playerId: 'q', from: '1', to: '2', type: 'trade' },
      { id: 't', week: 1, timestamp: 1, playerId: 'r', from: '2', to: '1', type: 'trade' },
    ],
    playerNames: { q: 'Quarterback', r: 'Runner', d: 'Dropped runner' },
    playerPositions,
    notes: [],
    draftPickTrades: 0,
  };
}
it('awards the positional-value winner, not the player with the largest raw score', () => {
  const trade = normalizedComparisons(fixture()).trades[0];
  expect(trade.weeks).toEqual([2, 3, 4, 5]);
  expect(trade.winner).toBe('1');
  expect(trade.sides[0]).toMatchObject({ receivedValue: 8, sentValue: 3, gain: 5 });
  expect(trade.sides[1].gain).toBe(-5);
});
it('sums value above baseline for unequal packages, instead of comparing raw package totals', () => {
  const f = fixture();
  f.playerPositions!.s = 'RB';
  f.moves.push({
    id: 't',
    week: 1,
    timestamp: 1,
    playerId: 's',
    from: '2',
    to: '1',
    type: 'trade',
  });
  f.scores.forEach((row) => row.players!.push({ playerId: 's', points: 5 }));
  const trade = normalizedComparisons(f).trades[0];
  expect(trade.verdict).toBe('close'); // RB package +8 -5 matches QB +3.
  expect(trade.winner).toBeNull();
});
it('uses a common complete window and refuses to call a winner with poor coverage', () => {
  const f = fixture();
  f.scores[3].players = f.scores[3].players!.filter((p) => p.playerId !== 'q');
  f.scores[4].players = f.scores[4].players!.filter((p) => p.playerId !== 'q');
  const trade = normalizedComparisons(f).trades[0];
  expect(trade.weeks).toEqual([2, 3]);
  expect(trade.possibleWeeks).toBe(4);
  expect(trade.verdict).toBe('insufficient');
  expect(trade.winner).toBeNull();
});
it('does not call draft-pick trades or unknown-position trades', () => {
  const f = fixture();
  f.draftPickTradeIds = ['t'];
  expect(normalizedComparisons(f).trades[0].verdict).toBe('picks');
  f.draftPickTradeIds = [];
  delete f.playerPositions!.q;
  expect(normalizedComparisons(f).trades[0].verdict).toBe('insufficient');
});
it('compares a clean pickup/drop pair to what the team gave up', () => {
  const f = fixture();
  const move: PlayerMove = {
    id: 'pickup',
    week: 1,
    timestamp: 1,
    playerId: 'r',
    type: 'pickup',
    from: null,
    to: '1',
  };
  f.moves = [
    move,
    { id: 'pickup', week: 1, timestamp: 1, playerId: 'd', type: 'drop', from: '1', to: null },
  ];
  expect(normalizedComparisons(f).pickup(move)).toMatchObject({
    lift: -2,
    baseline: 'Dropped Dropped runner',
    averagePoints: 18,
    averageBaseline: 20,
    comparisonWeeks: [2, 3, 4, 5],
  });
});
it('falls back to a single positional baseline when the dropped player cannot be tracked', () => {
  const f = fixture();
  const move: PlayerMove = {
    id: 'pickup',
    week: 1,
    timestamp: 1,
    playerId: 'r',
    type: 'pickup',
    from: null,
    to: '1',
  };
  f.moves = [
    move,
    { id: 'pickup', week: 1, timestamp: 1, playerId: 'd', type: 'drop', from: '1', to: null },
  ];
  f.scores[2].players = f.scores[2].players!.filter((p) => p.playerId !== 'd');
  expect(normalizedComparisons(f).pickup(move)).toMatchObject({
    lift: 8,
    baseline: 'League RB starter median',
    averageBaseline: 10,
  });
});
it('excludes post-drop starts and requires two comparable starts before ranking a pickup', () => {
  const f = fixture();
  const move: PlayerMove = {
    id: 'pickup',
    week: 1,
    timestamp: 1,
    playerId: 'r',
    type: 'pickup',
    from: null,
    to: '1',
  };
  f.moves = [
    move,
    { id: 'drop', week: 3, timestamp: 2, playerId: 'r', type: 'drop', from: '1', to: null },
  ];
  expect(normalizedComparisons(f).pickup(move)).toMatchObject({ lift: null, comparisonWeeks: [2] });
});
