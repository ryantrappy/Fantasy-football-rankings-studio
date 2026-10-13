import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { weeklyPain } from './pain';
it('shows source factors and isolates partial scoring cohorts', () => {
  const r = season();
  const a = weeklyPain([r]);
  expect(a.find((x) => x.name === 'b')).toMatchObject({
    margin: 10,
    cohort: 'Full weekly scoring · no late archive',
    late: null,
    scoringRank: 2,
    opponentRank: 1,
  });
  expect(a.find((x) => x.name === 'b')?.components).toHaveLength(3);
  r.data.scores[2].actual = NaN;
  expect(weeklyPain([r]).find((x) => x.name === 'b')).toMatchObject({
    cohort: 'Margin only · no late archive',
    scoringRank: null,
  });
  expect(weeklyPain([r]).find((x) => x.name === 'b')?.components).toHaveLength(1);
});
it('uses documented late expectation only in a separate comparable cohort', () => {
  const r = season();
  Object.assign(r.data, {
    matchupArchive: [
      {
        week: 1,
        teamId: 'b',
        opponentTeamId: 'a',
        source: 'Saved provider estimate',
        preMondayAt: '2024-09-09T23:00:00Z',
        snapshots: [{ capturedAt: '2024-09-09T23:00:00Z', probability: 0.8 }],
      },
    ],
  });
  const loss = weeklyPain([r]).find((x) => x.name === 'b');
  expect(loss).toMatchObject({
    late: 0.8,
    archiveSource: 'Saved provider estimate',
    cohort: 'Full weekly scoring · archived expectation',
  });
  expect(loss?.components).toHaveLength(4);
});
it('omits ties and multiweek series and bounds scores', () => {
  const r = season(2024, [[80, 80, 80, 80]]);
  expect(weeklyPain([r])).toHaveLength(0);
  r.data.playoffGames = [
    {
      id: 'final',
      homeTeamId: 'a',
      awayTeamId: 'b',
      weeks: [1, 2],
      homePoints: 100,
      awayPoints: 110,
      elimination: true,
    },
  ];
  expect(weeklyPain([r])).toHaveLength(0);
  expect(weeklyPain([season()]).every((r) => r.score >= 0 && r.score <= 100)).toBe(true);
});
