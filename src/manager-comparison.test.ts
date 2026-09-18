import type { SeasonInsights } from './insights';
import { compareManagers } from './manager-comparison';

const season = (
  year: number,
  teams: { teamId: string; managerKey: string; managerName: string; teamName: string }[],
  scores: { teamId: string; week: number; actual: number }[],
  results: SeasonInsights['results'] = [],
) => ({
  year,
  data: {
    completedWeek: 2,
    teams,
    scores: scores.map((score) => ({ ...score, projected: null, starters: [] })),
    results,
  } as unknown as SeasonInsights,
});

it('compares managers only across shared weeks and shared ownership-group seasons', () => {
  const records = [
    season(
      2025,
      [
        { teamId: '1', managerKey: 'a', managerName: 'Alex', teamName: 'Alpha' },
        { teamId: '2', managerKey: 'b', managerName: 'Blair', teamName: 'Beta' },
      ],
      [
        { teamId: '1', week: 1, actual: 100 },
        { teamId: '1', week: 2, actual: 120 },
        { teamId: '2', week: 1, actual: 80 },
      ],
      [
        { teamId: '1', playoff: true, champion: true, lastPlace: false, finish: 1 },
        { teamId: '2', playoff: false, champion: false, lastPlace: true, finish: 4 },
      ],
    ),
    season(
      2024,
      [
        { teamId: '1', managerKey: 'a', managerName: 'Alex', teamName: 'Old Alpha' },
        { teamId: '2', managerKey: 'b:coowner', managerName: 'Blair & Casey', teamName: 'Beta' },
      ],
      [],
    ),
  ];

  const comparison = compareManagers(records, [2025, 2024, 2023], ['a', 'b']);
  expect(comparison.summaries[0]).toMatchObject({
    averagePoints: 100,
    weeks: 1,
    aboveMedian: 1,
    playoffs: 1,
    playoffSeasons: 1,
    championships: 1,
    championshipSeasons: 1,
    finishSeasons: 1,
  });
  expect(comparison.summaries[0].averageVsMedian).toBeCloseTo(11.11, 1);
  expect(comparison.summaries[1]).toMatchObject({
    averagePoints: 80,
    weeks: 1,
    aboveMedian: 0,
    playoffs: 0,
    playoffSeasons: 1,
    championships: 0,
    championshipSeasons: 1,
    finishSeasons: 1,
  });
  expect(comparison.seasons).toEqual([
    {
      year: 2025,
      commonWeeks: [1],
      comparable: true,
      description: '1 shared completed week (1).',
    },
    {
      year: 2024,
      commonWeeks: [],
      comparable: false,
      description: 'Blair did not manage under the selected ownership group this season.',
    },
    {
      year: 2023,
      commonWeeks: [],
      comparable: false,
      description: 'Season data is unavailable and is excluded from the comparison.',
    },
  ]);
});
