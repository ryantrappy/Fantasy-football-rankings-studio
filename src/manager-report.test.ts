import { draftMisses, managerSeasonEvidence } from './manager-report';
import { calculateInsights } from './server/insights/calculate';
const data = () =>
  calculateInsights({
    completedWeek: 4,
    teams: [
      { teamId: '1', teamName: 'Target', managerName: 'konz4', managerKey: 'sleeper:target' },
      { teamId: '2', teamName: 'Other', managerName: 'Other' },
    ],
    scores: Array.from({ length: 4 }, (_, i) => [
      {
        teamId: '1',
        week: i + 1,
        actual: 90,
        projected: null,
        starters: [{ playerId: 'picked', points: 5 }],
        players: [{ playerId: 'picked', points: 5 }],
      },
      {
        teamId: '2',
        week: i + 1,
        actual: 110,
        projected: null,
        starters: [{ playerId: 'later', points: 15 }],
        players: [{ playerId: 'later', points: 15 }],
      },
    ]).flat(),
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  });
it('finds later same-position draft value using common observed weeks', () => {
  const picks = [
    {
      player_id: 'picked',
      roster_id: 1,
      pick_no: 1,
      metadata: { first_name: 'Picked', position: 'RB' },
    },
    {
      player_id: 'later',
      roster_id: 2,
      pick_no: 5,
      metadata: { first_name: 'Later', position: 'RB' },
    },
  ];
  expect(draftMisses(data(), '1', picks)).toEqual([
    { picked: 'Picked', alternative: 'Later', pick: 1, alternativePick: 5, gap: 10, weeks: 4 },
  ]);
  expect(draftMisses({ ...data(), completedWeek: 3 }, '1', picks)).toEqual([]);
  expect(
    draftMisses(data(), '1', [picks[0], { ...picks[1], metadata: { position: 'QB' } }]),
  ).toEqual([]);
  expect(draftMisses(data(), '1', [picks[0], { ...picks[1], pick_no: 14 }])).toEqual([]);
});
it('does not fill missing or contradictory player observations with zero', () => {
  const report = data();
  report.scores[0].players = [];
  expect(
    draftMisses(report, '1', [
      { player_id: 'picked', roster_id: 1, pick_no: 1, metadata: { position: 'RB' } },
      { player_id: 'later', roster_id: 2, pick_no: 5, metadata: { position: 'RB' } },
    ]),
  ).toEqual([]);
});
it('selects measured negative outcomes and excludes ungraded trades', () => {
  const report = data();
  const side = {
    teamId: '1',
    received: ['A'],
    sent: ['B'],
    receivedValue: 1,
    sentValue: 5,
    gain: -4,
  };
  report.tradeComparisons = [
    {
      id: 'bad',
      week: 1,
      weeks: [2, 3, 4],
      possibleWeeks: 3,
      sides: [side],
      verdict: 'leader',
      winner: '2',
    },
    {
      id: 'unknown',
      week: 1,
      weeks: [],
      possibleWeeks: 3,
      sides: [side],
      verdict: 'insufficient',
      winner: null,
    },
  ];
  const result = managerSeasonEvidence(report, '1', 2025);
  expect(result.belowMedian).toBe(4);
  expect(result.allPlay).toBe(0);
  expect(result.vsMedian).toBe(-10);
  expect(result.trades.map((t) => t.id)).toEqual(['bad']);
  expect(result.finish).toBeNull();
});
