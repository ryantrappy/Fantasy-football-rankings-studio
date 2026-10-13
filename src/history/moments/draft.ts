import type { SeasonRecord } from '../../league-summary';
import type { SeasonInsights } from '../../insights';
export function draftValues(data: SeasonInsights) {
  const weeks = Array.from(
    { length: Math.max(0, data.completedWeek - (data.reportingStartWeek || 1) + 1) },
    (_, i) => i + (data.reportingStartWeek || 1),
  );
  const picks = data.draftPicks || [];
  const production = (playerId: string) => {
    const values = weeks.map((week) => {
      const observed = data.scores
        .filter((s) => s.week === week)
        .flatMap((s) => [...(s.players || []), ...s.starters])
        .filter((p) => p.playerId === playerId)
        .map((p) => p.points);
      return observed.length && observed.every((p) => p === observed[0]) ? observed[0] : null;
    });
    return values.length && values.every((v) => v !== null)
      ? values.reduce<number>((sum, v) => sum + v!, 0)
      : null;
  };
  return picks.map((pick) => {
    const points = production(pick.playerId);
    const cohort = picks
      .filter(
        (p) =>
          p.playerId !== pick.playerId &&
          Math.abs(p.overallPick - pick.overallPick) <= data.teams.length,
      )
      .map((p) => production(p.playerId))
      .filter((p): p is number => p !== null);
    const comparable =
      points !== null &&
      cohort.length >= 2 &&
      (data.draftFormat === 'snake' || data.draftFormat === 'linear');
    const baseline = comparable ? cohort.reduce((sum, p) => sum + p, 0) / cohort.length : null;
    return {
      ...pick,
      points,
      baseline,
      value: baseline === null ? null : points! - baseline,
      weeks: weeks.length,
      cohort: cohort.length,
    };
  });
}
export function draftSkill(records: SeasonRecord[]) {
  const groups = new Map<
    string,
    {
      manager: string;
      identity: string;
      format: string;
      picks: number;
      seasons: Set<number>;
      relativeValue: number;
    }
  >();
  for (const record of records)
    for (const pick of draftValues(record.data)) {
      if (pick.value === null || !pick.baseline) continue;
      const team = record.data.teams.find((t) => t.teamId === pick.teamId);
      // No name-based identity joins: a missing stable key stays season-specific.
      const key = `${team?.managerKey || `${record.year}:${pick.teamId}`}:${record.data.draftFormat}`;
      const row = groups.get(key) || {
        manager: team?.managerName || pick.teamId,
        identity: team?.managerKey || `${record.year}:${pick.teamId}`,
        format: record.data.draftFormat!,
        picks: 0,
        seasons: new Set<number>(),
        relativeValue: 0,
      };
      row.picks++;
      row.seasons.add(record.year);
      row.relativeValue += pick.value / Math.abs(pick.baseline);
      groups.set(key, row);
    }
  return [...groups.values()].map((r) => ({
    ...r,
    seasons: r.seasons.size,
    relativeValue: r.relativeValue / r.picks,
  }));
}
