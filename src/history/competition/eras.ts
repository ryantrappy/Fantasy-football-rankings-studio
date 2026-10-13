import type { SeasonRecord } from '../../league-summary';
import { competitionGames, managerKey } from './games';
import { historicalSchedules } from './schedule';
export interface EraSettings {
  span: number;
  titles: number;
  winRate: number;
}
export function historicalEras(
  records: SeasonRecord[],
  settings: EraSettings = { span: 3, titles: 2, winRate: 0.7 },
) {
  const span = Math.max(2, Math.min(10, Math.floor(settings.span)));
  const titleMinimum = Math.max(1, Math.floor(settings.titles));
  const byYear = new Map(records.map((r) => [r.year, r]));
  const { managers } = competitionGames(records);
  const eras: {
    id: string;
    key: string;
    name: string;
    kind: string;
    years: number[];
    evidence: string;
  }[] = [];
  const excluded: { start: number; reason: string }[] = [];
  for (const start of [...byYear.keys()].sort((a, b) => a - b)) {
    const years = Array.from({ length: span }, (_, i) => start + i);
    const window = years.map((y) => byYear.get(y));
    if (window.some((r) => !r)) {
      excluded.push({ start, reason: 'Missing season in rolling window' });
      continue;
    }
    const seasons = window as SeasonRecord[];
    const champions = seasons.map((r) => {
      const outcomes = r.data.results;
      const known = r.data.teams.every((t) =>
        outcomes?.some((o) => o.teamId === t.teamId && o.champion != null),
      );
      const winners = outcomes?.filter((o) => o.champion === true) ?? [];
      return known && winners.length === 1
        ? r.data.teams.find((t) => t.teamId === winners[0].teamId)
        : undefined;
    });
    const titleKnown = champions.every(Boolean);
    if (!titleKnown)
      excluded.push({
        start,
        reason: 'Unknown or inconsistent championship coverage; title era unavailable',
      });
    for (const [key, name] of managers) {
      const titles = seasons
        .filter((r, i) => champions[i] && managerKey(champions[i]!, r.year) === key)
        .map((r) => r.year);
      if (titleKnown && titles.length >= titleMinimum)
        eras.push({
          id: `title:${key}:${start}`,
          key,
          name,
          kind: 'Title dynasty',
          years,
          evidence: `${titles.length} titles in ${span} calendar seasons: ${titles.join(', ')}`,
        });
      const summaries = seasons.map((r) => historicalSchedules(r).find((s) => s.key === key));
      if (
        summaries.every(
          (s) =>
            s &&
            s.completed &&
            s.possibleWeeks != null &&
            s.weeks === s.possibleWeeks &&
            s.weeks > 0,
        )
      ) {
        const samples = summaries as NonNullable<(typeof summaries)[number]>[];
        const rate =
          samples.reduce((n, s) => n + s.actual, 0) / samples.reduce((n, s) => n + s.weeks, 0);
        if (rate >= settings.winRate)
          eras.push({
            id: `success:${key}:${start}`,
            key,
            name,
            kind: 'Sustained regular success',
            years,
            evidence: `${Math.round(rate * 100)}% wins over ${samples.reduce((n, s) => n + s.weeks, 0)} games; ${samples.map((s) => `${s.year}: ${s.actual}/${s.weeks}`).join('; ')}`,
          });
      }
    }
  }
  return { eras, excluded, span, titleMinimum };
}
