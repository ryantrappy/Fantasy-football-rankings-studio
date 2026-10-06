import { useEffect, useState } from 'react';
import type { SeasonInsights } from '../insights';
import type { PlayoffForecast, PlayoffSettings } from '../playoff-forecast';
import { peekPlayoffForecast, requestPlayoffForecast } from '../playoff-timeline';

export function usePlayoffForecast(
  data: SeasonInsights,
  settings: PlayoffSettings | undefined,
  week: number,
) {
  const [result, setResult] = useState<{
    data: SeasonInsights;
    settings: PlayoffSettings;
    week: number;
    forecast?: PlayoffForecast;
    error?: string;
  }>();
  useEffect(() => {
    if (!settings) return;
    const controller = new AbortController();
    void requestPlayoffForecast(data, settings, week, controller.signal).then(
      (forecast) => {
        if (!controller.signal.aborted) setResult({ data, settings, week, forecast });
      },
      () => {
        if (!controller.signal.aborted)
          setResult({
            data,
            settings,
            week,
            error:
              'Forecast calculation is unavailable. Choose another cutoff or refresh this report.',
          });
      },
    );
    return () => controller.abort();
  }, [data, settings, week]);
  const current =
    result?.data === data && result.settings === settings && result.week === week
      ? result
      : undefined;
  const forecast = settings
    ? (peekPlayoffForecast(data, settings, week) ?? current?.forecast)
    : undefined;
  return { forecast, error: current?.error, pending: !!settings && !forecast && !current?.error };
}
