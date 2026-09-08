import { calculateInsights } from './calculate';
import type { InsightsSource, PlayerMove, ScoreWeek } from '../../insights';
const source = (scores: ScoreWeek[], moves: PlayerMove[] = []): InsightsSource => ({
  completedWeek: 4,
  scores,
  moves,
  teams: [
    { teamId: '1', teamName: 'One', managerName: 'A' },
    { teamId: '2', teamName: 'Two', managerName: 'B' },
  ],
  playerNames: { p: 'Player P', q: 'Player Q' },
  notes: [],
  draftPickTrades: 0,
});
const score = (
  teamId: string,
  week: number,
  actual: number,
  projected: number | null = null,
  starters: ScoreWeek['starters'] = [],
): ScoreWeek => ({ teamId, week, actual, projected, starters });
it('keeps missing projections distinct from zero and excludes unfinished weeks', () => {
  const result = calculateInsights(
    source([
      score('1', 1, 90, 100),
      score('1', 2, 0, 0),
      score('1', 3, 100, null),
      score('1', 5, 999, 100),
    ]),
  );
  expect(result.teams[0]).toMatchObject({
    weeks: 3,
    total: 190,
    average: 63.33,
    projectedWeeks: 2,
    projectionDelta: -5,
    beatProjection: 0,
  });
  expect(result.scores).toHaveLength(3);
});
it('uses a strict league-median comparison including ties and negative points', () => {
  const result = calculateInsights(
    source([
      score('1', 1, 20),
      score('2', 1, 10),
      score('1', 2, 10),
      score('2', 2, 10),
      score('1', 3, -5),
      score('2', 3, -10),
    ]),
  );
  expect(result.teams.map((t) => t.aboveMedian)).toEqual([2, 0]);
});
it('credits pickups only after acquisition and before the next move, without double counting reacquisition', () => {
  const moves: PlayerMove[] = [
    { id: 'a', week: 1, timestamp: 1, type: 'pickup', playerId: 'p', from: null, to: '1' },
    { id: 'b', week: 3, timestamp: 2, type: 'drop', playerId: 'p', from: '1', to: null },
    { id: 'c', week: 3, timestamp: 3, type: 'pickup', playerId: 'p', from: null, to: '1' },
  ];
  const result = calculateInsights(
    source(
      [1, 2, 3, 4].map((week) =>
        score('1', week, 50, null, [{ playerId: 'p', points: week * 10 }]),
      ),
      moves,
    ),
  );
  expect(result.pickups.find((p) => p.id === 'a:p')).toMatchObject({ points: 20, starts: 1 });
  expect(result.pickups.find((p) => p.id === 'c:p')).toMatchObject({ points: 40, starts: 1 });
});
it('calculates trade balances for both teams from starter contributions, not bench or acquisition-week points', () => {
  const moves: PlayerMove[] = [
    { id: 'trade', week: 1, timestamp: 1, type: 'trade', playerId: 'p', from: '1', to: '2' },
    { id: 'trade', week: 1, timestamp: 1, type: 'trade', playerId: 'q', from: '2', to: '1' },
  ];
  const result = calculateInsights(
    source(
      [
        score('1', 1, 100, null, [{ playerId: 'q', points: 90 }]),
        score('1', 2, 50, null, [{ playerId: 'q', points: 20 }]),
        score('2', 2, 50, null, [{ playerId: 'p', points: 5 }]),
      ],
      moves,
    ),
  );
  expect(result.teams[0]).toMatchObject({
    tradeCount: 1,
    receivedPoints: 20,
    sentPoints: 5,
    netTradePoints: 15,
  });
  expect(result.teams[1].netTradePoints).toBe(-15);
});
it('shows pending evaluation as null and discloses draft picks', () => {
  const input = source(
    [],
    [{ id: 'trade', week: 4, timestamp: 1, type: 'trade', playerId: 'p', from: '1', to: '2' }],
  );
  input.draftPickTrades = 1;
  const result = calculateInsights(input);
  expect(result.trades[0].net).toBeNull();
  expect(result.teams[0].netTradePoints).toBeNull();
  expect(result.notes.join(' ')).toContain('pick value is excluded');
});
