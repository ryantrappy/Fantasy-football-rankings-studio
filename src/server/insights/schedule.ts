import type { RegularSeasonSchedule } from '../../insights';
import type { EspnResultsData } from './results';

/** Expand published matchup periods into scoring weeks without changing the simulator. */
export function espnRegularSeasonSchedule(
  data: EspnResultsData,
): RegularSeasonSchedule | undefined {
  const settings = data.settings?.scheduleSettings;
  const count = settings?.matchupPeriodCount;
  if (!count || !Number.isInteger(count) || count > 18) return undefined;
  const periods = Array.from({ length: count }, (_, index) => {
    const period = index + 1;
    const length = settings?.matchupPeriodLength;
    return (
      settings?.matchupPeriods?.[String(period)] ??
      (length && Number.isInteger(length) && length > 0
        ? Array.from({ length }, (_, w) => index * length + w + 1)
        : [])
    );
  });
  const weeks = periods.flat();
  if (
    periods.some((p) => !p.length) ||
    weeks.some((w) => !Number.isInteger(w) || w < 1 || w > 18) ||
    new Set(weeks).size !== weeks.length
  )
    return undefined;
  return {
    endWeek: Math.max(...weeks),
    fixtures: (data.schedule ?? []).flatMap((match) => {
      const period = match.matchupPeriodId;
      if (
        !period ||
        period > count ||
        !match.home ||
        (match.playoffTierType && match.playoffTierType !== 'NONE')
      )
        return [];
      return (periods[period - 1] ?? []).map((week) => ({
        week,
        homeTeamId: String(match.home!.teamId),
        awayTeamId: match.away ? String(match.away.teamId) : null,
      }));
    }),
  };
}
