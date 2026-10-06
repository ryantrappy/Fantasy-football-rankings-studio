import type { SeasonInsights } from './insights';
import {
  forecastPlayoffs,
  forecastPlayoffsAsync,
  type PlayoffForecast,
  type PlayoffSettings,
} from './playoff-forecast';

interface ForecastCache {
  settings: PlayoffSettings;
  weeks: Map<number, PlayoffForecast>;
}

// Reports are immutable after loading. A new report object gets a fresh simulation cache.
const caches = new WeakMap<SeasonInsights, ForecastCache>();

function cacheFor(data: SeasonInsights, settings: PlayoffSettings) {
  let cache = caches.get(data);
  if (!cache || cache.settings !== settings) {
    cache = { settings, weeks: new Map() };
    caches.set(data, cache);
  }
  return cache;
}
const cutoffFor = (data: SeasonInsights, settings: PlayoffSettings, week: number) =>
  Math.max(0, Math.min(Math.floor(week), data.completedWeek, settings.regularSeasonEnd));

export function peekPlayoffForecast(data: SeasonInsights, settings: PlayoffSettings, week: number) {
  return cacheFor(data, settings).weeks.get(cutoffFor(data, settings, week));
}

export async function requestPlayoffForecast(
  data: SeasonInsights,
  settings: PlayoffSettings,
  week: number,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const cache = cacheFor(data, settings);
  const cutoff = cutoffFor(data, settings, week);
  const saved = cache.weeks.get(cutoff);
  if (saved) return saved;
  const result = await forecastPlayoffsAsync(data, settings, cutoff, signal);
  signal?.throwIfAborted();
  cache.weeks.set(cutoff, result);
  return result;
}

export function cachedPlayoffForecast(
  data: SeasonInsights,
  settings: PlayoffSettings,
  week: number,
): PlayoffForecast {
  const cache = cacheFor(data, settings);
  const cutoff = Math.max(
    0,
    Math.min(Math.floor(week), data.completedWeek, settings.regularSeasonEnd),
  );
  let forecast = cache.weeks.get(cutoff);
  if (!forecast) {
    forecast = forecastPlayoffs(data, settings, cutoff);
    cache.weeks.set(cutoff, forecast);
  }
  return forecast;
}
