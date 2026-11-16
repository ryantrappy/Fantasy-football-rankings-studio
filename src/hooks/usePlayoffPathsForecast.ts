import { useEffect, useState } from 'react';
import type { SeasonInsights } from '../insights';
import type { FixedOutcome, PlayoffForecast, PlayoffSettings } from '../playoff-forecast';
import { forecastPlayoffsAsync } from '../playoff-forecast';

// Runs the base forecast (no picks, leverage on) once per report, plus a
// debounced conditional forecast whenever the user has picks. The conditional
// run shares the base run's random stream — fixed outcomes are excluded from
// the RNG seed — so the shown change is attributable to the picks alone.
export function usePlayoffPathsForecast(
  data: SeasonInsights | undefined,
  settings: PlayoffSettings | undefined,
  fixedOutcomes: FixedOutcome[],
) {
  const cutoff = data?.completedWeek ?? 0;
  const [base, setBase] = useState<PlayoffForecast | undefined>();
  const [conditional, setConditional] = useState<PlayoffForecast | undefined>();
  const [error, setError] = useState('');
  const hasPicks = fixedOutcomes.length > 0;
  const fixedKey = fixedOutcomes
    .map((o) => `${o.week}|${o.homeTeamId}|${o.awayTeamId}|${o.winnerTeamId}`)
    .sort()
    .join(';');

  useEffect(() => {
    if (!data || !settings) return;
    const controller = new AbortController();
    setBase(undefined);
    setError('');
    void forecastPlayoffsAsync(data, settings, cutoff, controller.signal, undefined, 'historical', {
      leverage: true,
    }).then(
      (forecast) => {
        if (!controller.signal.aborted) setBase(forecast);
      },
      (failure) => {
        if (!controller.signal.aborted && failure?.name !== 'AbortError')
          setError('Playoff calculation is unavailable. Refresh this report to try again.');
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, settings, cutoff]);

  useEffect(() => {
    if (!data || !settings || !hasPicks) {
      setConditional(undefined);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void forecastPlayoffsAsync(
        data,
        settings,
        cutoff,
        controller.signal,
        undefined,
        'historical',
        { fixedOutcomes, leverage: true },
      ).then(
        (forecast) => {
          if (!controller.signal.aborted) setConditional(forecast);
        },
        (failure) => {
          if (!controller.signal.aborted && failure?.name !== 'AbortError')
            setError('Playoff calculation is unavailable. Refresh this report to try again.');
        },
      );
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, settings, cutoff, hasPicks, fixedKey]);

  return {
    base,
    conditional: hasPicks ? conditional : base,
    pending: !base || (hasPicks && !conditional),
    error,
  };
}
