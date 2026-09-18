import type { SeasonInsights } from './insights';
import { forecastPlayoffs, type PlayoffForecast, type PlayoffSettings } from './playoff-forecast';

interface ForecastCache {
  settings: PlayoffSettings;
  weeks: Map<number, PlayoffForecast>;
}

// Reports are immutable after loading. A new report object gets a fresh simulation cache.
const caches = new WeakMap<SeasonInsights, ForecastCache>();

export function cachedPlayoffForecast(
  data: SeasonInsights,
  settings: PlayoffSettings,
  week: number,
): PlayoffForecast {
  let cache = caches.get(data);
  if (!cache || cache.settings !== settings) {
    cache = { settings, weeks: new Map() };
    caches.set(data, cache);
  }
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
