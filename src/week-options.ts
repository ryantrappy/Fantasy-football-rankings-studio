import type { WeeklyRanking } from './types';

export interface WeekChoice {
  week: number;
  savedOnly: boolean;
}

export function weekChoices(
  validWeeks: number[],
  rankings: Pick<WeeklyRanking, 'year' | 'week'>[],
  year: number,
): WeekChoice[] {
  const supported = new Set(
    validWeeks.filter((week) => Number.isInteger(week) && week >= 1 && week <= 18),
  );
  const all = new Set(supported);
  for (const ranking of rankings)
    if (
      ranking.year === year &&
      Number.isInteger(ranking.week) &&
      ranking.week >= 1 &&
      ranking.week <= 18
    )
      all.add(ranking.week);
  return [...all].sort((a, b) => a - b).map((week) => ({ week, savedOnly: !supported.has(week) }));
}

export function safeWeek(current: number, choices: WeekChoice[]): number | undefined {
  if (choices.some((choice) => choice.week === current)) return current;
  return choices[0]?.week;
}
