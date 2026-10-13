import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { individualScoreRecords, matchupRecords } from './records';
it('ranks full-population worst beats and tied weekly scores with margins', () => {
  const r = season(2024, [
    [100, 110, 80, 70],
    [80, 80, 80, 80],
  ]);
  const x = matchupRecords([r]);
  expect(x[0]).toMatchObject({
    margin: 10,
    combined: 210,
    individual: 110,
    aRank: 2,
    bRank: 1,
    worstBeat: false,
  });
  expect(x[2]).toMatchObject({ margin: 0, aRank: 1, bRank: 1, worstBeat: false });
});
it('recognizes top-quarter losses and suppresses ranks on incomplete weeks', () => {
  const r = season(2024, [[100, 110, 80, 70, 60, 50, 40, 30]]);
  r.data.teams.push(
    ...['e', 'f', 'g', 'h'].map((teamId) => ({ ...r.data.teams[0], teamId, managerKey: teamId })),
  );
  r.data.scores.slice(4).forEach((s, i) => {
    s.teamId = ['e', 'f', 'g', 'h'][i];
    s.opponentTeamId = ['f', 'e', 'h', 'g'][i];
  });
  expect(matchupRecords([r])[0].worstBeat).toBe(true);
  r.data.scores.pop();
  expect(matchupRecords([r])[0]).toMatchObject({ worstBeat: false, aRank: null });
});

it('preserves individual weekly scores without opponents and excludes duplicates', () => {
  const r = season();
  r.data.scores[0].opponentTeamId = null;
  r.data.regularSeasonSchedule = {
    endWeek: 2,
    fixtures: [{ week: 1, homeTeamId: 'a', awayTeamId: null }],
  };
  expect(individualScoreRecords([r]).find((s) => s.name === 'a' && s.week === 1)).toMatchObject({
    points: 100,
    opponent: 'Confirmed bye',
  });
  r.data.scores.push(r.data.scores[0]);
  expect(individualScoreRecords([r]).some((s) => s.name === 'a' && s.week === 1)).toBe(false);
});

it('compares each playoff week separately for scoring highs while retaining series records', () => {
  const r = season(2024, [
    [100, 90, 250, 220],
    [180, 80, 120, 60],
  ]);
  r.data.playoffGames = [
    {
      id: 'final',
      homeTeamId: 'a',
      awayTeamId: 'b',
      weeks: [1, 2],
      homePoints: 280,
      awayPoints: 170,
      elimination: true,
    },
  ];
  const aggregate = matchupRecords([r]).find((g) => g.phase === 'playoff');
  expect(aggregate).toMatchObject({ combined: 450, margin: 110, aRank: null, weeks: [1, 2] });
  const weekly = matchupRecords([r], { weekly: true });
  const playoff = weekly.filter((g) => g.phase === 'playoff');
  expect(playoff).toHaveLength(2);
  expect(playoff[0]).toMatchObject({
    week: 1,
    weeks: [1],
    combined: 190,
    individual: 100,
    margin: 10,
    aRank: 3,
    bRank: 4,
  });
  expect(playoff[1]).toMatchObject({
    week: 2,
    weeks: [2],
    combined: 260,
    individual: 180,
    margin: 100,
    aRank: 1,
    bRank: 3,
  });
  expect(new Set(weekly.map((g) => g.id)).size).toBe(weekly.length);
  expect(weekly.filter((g) => g.phase !== 'playoff')).toEqual(
    matchupRecords([r]).filter((g) => g.phase !== 'playoff'),
  );
  expect(Math.max(...individualScoreRecords([r]).map((s) => s.points))).toBe(250);

  r.data.scores.push(r.data.scores[0]);
  expect(matchupRecords([r], { weekly: true }).filter((g) => g.phase === 'playoff')).toEqual([
    playoff[1],
  ]);
  r.data.scores.pop();
  r.data.scores[0].actual = NaN;
  expect(matchupRecords([r], { weekly: true }).filter((g) => g.phase === 'playoff')).toEqual([
    playoff[1],
  ]);
  r.data.scores.shift();
  expect(matchupRecords([r], { weekly: true }).filter((g) => g.phase === 'playoff')).toEqual([
    playoff[1],
  ]);
});
