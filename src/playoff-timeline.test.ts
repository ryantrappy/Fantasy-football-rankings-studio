import { cachedPlayoffForecast } from './playoff-timeline';
import type { SeasonInsights } from './insights';

it('caches each weekly cutoff and excludes current projections from older weeks', () => {
  const data = {
    completedWeek: 2,
    generatedAt: '',
    notes: [],
    pickups: [],
    trades: [],
    tradeComparisons: [],
    teams: [
      { teamId: '1', teamName: 'Alpha' },
      { teamId: '2', teamName: 'Beta' },
    ] as SeasonInsights['teams'],
    scores: [1, 2].flatMap((week) => [
      { teamId: '1', opponentTeamId: '2', week, actual: 100, projected: null, starters: [] },
      { teamId: '2', opponentTeamId: '1', week, actual: 90, projected: null, starters: [] },
    ]),
    playoffProjection: {
      provider: 'ESPN',
      week: 3,
      teamPoints: { '1': 120, '2': 95 },
      coveredStarters: 2,
      totalStarters: 2,
    },
  } satisfies SeasonInsights;
  const settings = { regularSeasonEnd: 4, playoffTeams: 2 };
  const first = cachedPlayoffForecast(data, settings, 1);
  expect(first.projection.used).toBe(false);
  expect(cachedPlayoffForecast(data, settings, 1)).toBe(first);
  const second = cachedPlayoffForecast(data, settings, 2);
  expect(second.projection.used).toBe(true);
  expect(cachedPlayoffForecast(data, settings, 2)).toBe(second);
  expect(second).not.toBe(first);
});
