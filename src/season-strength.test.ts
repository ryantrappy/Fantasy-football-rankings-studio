import { calculateInsights } from './server/insights/calculate';
import { positionStrength, remainingScheduleStrength } from './season-strength';

function fixture() {
  const data = calculateInsights({
    completedWeek: 1,
    teams: ['A', 'B', 'C', 'D'].map((teamId) => ({
      teamId,
      teamName: teamId,
      managerName: teamId,
    })),
    scores: ['A', 'B', 'C', 'D'].map((teamId, i) => ({
      teamId,
      week: 1,
      actual: 100 + i * 10,
      projected: null,
      starters: [],
    })),
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
    regularSeasonSchedule: {
      endWeek: 3,
      fixtures: [
        { week: 2, homeTeamId: 'A', awayTeamId: 'B' },
        { week: 2, homeTeamId: 'C', awayTeamId: 'D' },
        { week: 3, homeTeamId: 'A', awayTeamId: 'B' },
        { week: 3, homeTeamId: 'C', awayTeamId: 'D' },
      ],
    },
    playoffProjection: {
      provider: 'Sleeper',
      week: 2,
      teamPoints: {},
      coveredStarters: 8,
      totalStarters: 8,
      weekly: [2, 3].map((week) => ({
        week,
        optimizedLineup: true,
        teamPoints: { A: 100, B: 110, C: 120, D: 130 },
        coveredStarters: 8,
        totalStarters: 8,
        positionPoints: {
          A: { RB: 50, WR: 50 },
          B: { RB: 50, WR: 60 },
          C: { RB: 40, WR: 80 },
          D: { RB: 90, WR: 40 },
        },
      })),
    },
  });
  return data;
}

it('compares positional contributions over the same horizon with competition ranks and custom positions', () => {
  const data = fixture();
  for (const week of data.playoffProjection!.weekly!) {
    week.positionPoints!.C = { RB: 40, LB: 80 };
  }
  const model = positionStrength(data);
  expect(model.weeks).toEqual([2, 3]);
  expect(model.positions).toEqual(['RB', 'WR', 'LB']);
  expect(model.rows.map((r) => r.ranks.RB)).toEqual([2, 2, 4, 1]);
  expect(model.rows[2].points).toEqual({ RB: 80, WR: 0, LB: 160 });
  expect(model.rows[2].total).toBe(240);
});

it('leaves incomplete, inconsistent, stale and legacy position snapshots unavailable', () => {
  const data = fixture();
  delete data.playoffProjection!.weekly![1].positionPoints!.A;
  data.playoffProjection!.weekly![0].positionPoints!.B.RB = 1;
  let model = positionStrength(data);
  expect(model.rows[0]).toMatchObject({ total: null, coveredWeeks: 1, ranks: { RB: null } });
  expect(model.rows[1].total).toBeNull();
  data.playoffProjection!.week = 1;
  expect(positionStrength(data).rows.every((row) => row.total === null)).toBe(true);
  delete data.playoffProjection;
  model = positionStrength(data);
  expect(model.rows.every((row) => row.total === null)).toBe(true);
});

it('ranks completed actual starters, ignoring projections, bench, optimal lineups and unfinished weeks', () => {
  const data = fixture();
  data.scores.forEach((score, i) => {
    score.starters = [
      { playerId: 'rb', position: 'RB', points: i < 2 ? 10 : i === 2 ? 0 : -2 },
      { playerId: 'flex-wr', position: 'WR', points: 5 },
      { playerId: 'def', position: 'DST', points: -1 },
    ];
    score.players = [{ playerId: 'bench', points: 999 }];
    score.bestLineup = { points: 999, slots: 3, correctStarts: 0 };
  });
  data.scores.push({
    teamId: 'A',
    week: 2,
    actual: 9999,
    projected: null,
    starters: [{ playerId: 'future', points: 9999, position: 'QB' }],
  });
  const model = positionStrength(data, 'completed');
  expect(model.weeks).toEqual([1]);
  expect(model.positions).toEqual(['RB', 'WR', 'DEF']);
  expect(model.rows[0]).toMatchObject({ total: 14, points: { RB: 10, WR: 5, DEF: -1 } });
  expect(model.rows.map((row) => row.ranks.RB)).toEqual([1, 1, 3, 4]);
  expect(model.rows[2].points.RB).toBe(0);
  delete data.playoffProjection;
  delete data.regularSeasonSchedule;
  expect(positionStrength(data, 'completed')).toEqual(model);
});

it('requires complete actual starter coverage across a common completed horizon', () => {
  const data = fixture();
  data.completedWeek = 3;
  data.scores = [1, 2, 3].flatMap((week) =>
    data.teams.map((team) => ({
      teamId: team.teamId,
      week,
      actual: 10,
      projected: null,
      lineupAvailable: true,
      starters: [{ playerId: 'p', points: 10, position: 'RB' }],
    })),
  );
  data.scores[0].starters[0].position = undefined;
  data.scores[1].lineupAvailable = false;
  data.scores[2].starters.push({ ...data.scores[2].starters[0] });
  data.scores[3].starters[0].points = NaN;
  expect(positionStrength(data, 'completed').rows.every((row) => row.total === null)).toBe(true);
  expect(positionStrength(data, 'completed').rows.every((row) => row.coveredWeeks === 2)).toBe(
    true,
  );
  data.scores = data.scores.filter((score) => score.week !== 1 && score.week !== 2);
  expect(positionStrength(data, 'completed').weeks).toEqual([3]);
  expect(positionStrength(data, 'completed').rows[0].total).toBe(10);
  data.completedWeek = 5;
  data.scores.push(...data.scores.map((score) => ({ ...score, week: 5 })));
  expect(positionStrength(data, 'completed').weeks).toEqual([3, 4, 5]);
  expect(positionStrength(data, 'completed').rows[0]).toMatchObject({
    total: null,
    coveredWeeks: 2,
  });
});

it('keeps empty seasons unavailable and treats a confirmed empty lineup as zero', () => {
  const data = fixture();
  data.scores[0].lineupAvailable = true;
  data.scores[1].starters = [{ playerId: 'p', points: 10, position: 'RB' }];
  const model = positionStrength(data, 'completed');
  expect(model.rows[0]).toMatchObject({ total: 0, points: { RB: 0 }, ranks: { RB: 2 } });
  expect(model.rows[2].total).toBeNull();
  data.completedWeek = 0;
  expect(positionStrength(data, 'completed').weeks).toEqual([]);
  expect(positionStrength(data, 'completed').rows.every((row) => row.total === null)).toBe(true);
});

it('ranks repeated opponents using weekly differences and handles real zero projections', () => {
  const data = fixture();
  const model = remainingScheduleStrength(data);
  expect(model.rows.map((row) => [row.teamId, row.difficulty, row.rank])).toEqual([
    ['B', -15, 1],
    ['A', -5, 2],
    ['D', 5, 3],
    ['C', 15, 4],
  ]);
  expect(model.rows.find((row) => row.teamId === 'A')?.opponents.map((r) => r.opponentId)).toEqual([
    'B',
    'B',
  ]);
  data.playoffProjection!.weekly![0].teamPoints.B = 0;
  expect(
    remainingScheduleStrength(data).rows.find((row) => row.teamId === 'A')?.opponents[0],
  ).toMatchObject({ points: 0, source: 'projection' });
});

it('uses an explicitly labeled whole-week historical fallback without future-score leakage', () => {
  const data = fixture();
  delete data.playoffProjection!.weekly![1].teamPoints.D;
  data.scores.push({ teamId: 'D', week: 2, actual: 9999, projected: null, starters: [] });
  const model = remainingScheduleStrength(data);
  expect(model.rows.every((row) => row.historicalWeeks === 1)).toBe(true);
  expect(model.rows.find((row) => row.teamId === 'C')?.opponents[1]).toMatchObject({
    points: 130,
    baseline: 115,
    source: 'historical',
  });
  data.playoffProjection!.week = 1;
  expect(remainingScheduleStrength(data).rows.every((row) => row.historicalWeeks === 2)).toBe(true);
});

it('does not rank unknown or conflicting schedules or missing estimates', () => {
  const data = fixture();
  data.regularSeasonSchedule!.fixtures = data.regularSeasonSchedule!.fixtures.filter(
    (f) => f.week !== 3 || f.homeTeamId !== 'A',
  );
  let model = remainingScheduleStrength(data);
  expect(model.rows.find((row) => row.teamId === 'A')).toMatchObject({
    rank: null,
    difficulty: null,
    unknownWeeks: 1,
    measuredWeeks: 1,
  });
  data.regularSeasonSchedule!.fixtures.push({ week: 2, homeTeamId: 'A', awayTeamId: 'C' });
  expect(
    remainingScheduleStrength(data).rows.find((row) => row.teamId === 'A')?.opponents[0].status,
  ).toBe('unknown');
  data.scores = [];
  delete data.playoffProjection;
  model = remainingScheduleStrength(data);
  expect(model.rows.every((r) => r.rank === null)).toBe(true);
});

it('averages unequal remaining schedules excluding explicit byes and reports season completion', () => {
  const data = fixture();
  data.regularSeasonSchedule!.fixtures = data.regularSeasonSchedule!.fixtures.filter(
    (f) => f.week !== 3,
  );
  data.regularSeasonSchedule!.fixtures.push(
    { week: 3, homeTeamId: 'A', awayTeamId: null },
    { week: 3, homeTeamId: 'B', awayTeamId: null },
    { week: 3, homeTeamId: 'C', awayTeamId: 'D' },
  );
  const model = remainingScheduleStrength(data);
  expect(model.rows.find((r) => r.teamId === 'A')).toMatchObject({
    difficulty: -5,
    measuredWeeks: 1,
  });
  expect(model.rows.find((r) => r.teamId === 'C')).toMatchObject({
    difficulty: 15,
    measuredWeeks: 2,
  });
  data.completedWeek = 3;
  expect(remainingScheduleStrength(data).weeks).toEqual([]);
  expect(remainingScheduleStrength(data).rows.every((r) => r.rank === null)).toBe(true);
});

it('ranks tied schedule values equally and isolates reports with differing team identities', () => {
  const data = fixture();
  for (const week of data.playoffProjection!.weekly!)
    week.teamPoints = { A: 100, B: 100, C: 100, D: 100 };
  expect(remainingScheduleStrength(data).rows.map((row) => row.rank)).toEqual([1, 1, 1, 1]);
  const other = fixture();
  other.teams = other.teams.map((team) => ({ ...team, teamId: `new-${team.teamId}` }));
  expect(positionStrength(other).rows.every((row) => row.total === null)).toBe(true);
  expect(remainingScheduleStrength(other).rows.every((row) => row.difficulty === null)).toBe(true);
});
