import {
  cachedPlayoffForecast,
  requestPlayoffForecast,
  peekPlayoffForecast,
} from './playoff-timeline';
import { forecastPlayoffs } from './playoff-forecast';
import type { SeasonInsights } from './insights';

it('caches each weekly cutoff and excludes current projections from older weeks', async () => {
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
  const fresh = structuredClone(data);
  expect(await requestPlayoffForecast(fresh, settings, 2)).toEqual(
    forecastPlayoffs(fresh, settings, 2),
  );
  const result = peekPlayoffForecast(fresh, settings, 2);
  expect(await requestPlayoffForecast(fresh, settings, 2)).toBe(result);
  const other = structuredClone(data);
  const controller = new AbortController();
  const canceled = requestPlayoffForecast(other, settings, 1, controller.signal);
  setTimeout(() => controller.abort(), 10);
  await expect(canceled).rejects.toMatchObject({ name: 'AbortError' });
  expect(peekPlayoffForecast(other, settings, 1)).toBeUndefined();
});
