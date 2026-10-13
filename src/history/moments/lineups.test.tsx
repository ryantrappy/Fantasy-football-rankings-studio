import { render, screen } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { sleeperBestLineup } from '../../server/insights/projections';
import { lineupRegrets } from './lineups';
import { LineupRegrets } from '../../components/history/moments/LineupRegrets';
const make = (teamId: string, actual: number, bench: number) => ({
  teamId,
  opponentTeamId: teamId === 'a' ? 'b' : 'a',
  week: 1,
  actual,
  projected: null,
  lineupAvailable: true,
  rosterComplete: true,
  starters: [{ playerId: `${teamId}-s`, points: actual }],
  players: [
    { playerId: `${teamId}-s`, points: actual },
    { playerId: `${teamId}-b`, points: bench },
  ],
  bestLineup: sleeperBestLineup(
    [`${teamId}-s`],
    [
      { playerId: `${teamId}-s`, points: actual },
      { playerId: `${teamId}-b`, points: bench },
    ],
    ['RB'],
    { [`${teamId}-s`]: 'RB', [`${teamId}-b`]: 'RB' },
  ),
});
const data = calculateInsights({
  completedWeek: 1,
  teams: [{ teamId: 'a', teamName: 'A', managerName: 'Alice' }],
  scores: [make('a', 10, 25), make('b', 20, 30)],
  moves: [],
  playerNames: { 'a-b': 'Bench runner' },
  notes: [],
  draftPickTrades: 0,
});
it('respects legal lineup and separates unilateral flip from both-optimal record', () => {
  const result = lineupRegrets(data);
  expect(result.rows[0]).toMatchObject({
    actual: 'L',
    optimal: 25,
    regret: 15,
    unilateral: 'W',
    bothOptimal: 'L',
    benchIn: ['a-b'],
    startersOut: ['a-s'],
  });
  expect(result.largest[0].score.teamId).toBe('a');
  expect(
    sleeperBestLineup(
      ['s'],
      [
        { playerId: 's', points: 10 },
        { playerId: 'q', points: 100 },
      ],
      ['RB'],
      { s: 'RB', q: 'QB' },
    )?.playerIds,
  ).toEqual(['s']);
});
it('does not rank incomplete rosters, missing optimal selections or manual score overrides', () => {
  for (const patch of [
    { rosterComplete: false },
    { actual: 11 },
    { bestLineup: { points: 25, slots: 1, correctStarts: 0 } },
  ]) {
    expect(
      lineupRegrets({ ...data, scores: [{ ...data.scores[0], ...patch }, data.scores[1]] }).rows[0]
        .optimal,
    ).toBeNull();
  }
});
it('renders exact legal decision, coverage and outcome consequence', () => {
  render(<LineupRegrets data={data} manager="a" />);
  expect(screen.getByText('L / W / L — result changes')).toBeInTheDocument();
  expect(screen.getByText('Start Bench runner; sit a-s')).toBeInTheDocument();
  expect(screen.getByText(/Coverage: 1\/1/)).toHaveTextContent('0–1–0');
});
