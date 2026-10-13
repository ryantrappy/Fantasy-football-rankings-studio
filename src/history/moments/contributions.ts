import type { SeasonInsights } from '../../insights';
// Structural subset allows reports from before verified postseason metadata was introduced.
type PostseasonEvidence = {
  playoffGames?: { homeTeamId: string; awayTeamId: string; weeks: number[] }[];
};
export function tradeContributions(data: SeasonInsights) {
  const moves = data.moves || [];
  const playoffs = (data as SeasonInsights & PostseasonEvidence).playoffGames;
  return moves
    .filter(
      (m) =>
        m.type === 'trade' && m.to && m.week <= data.completedWeek && Number.isFinite(m.timestamp),
    )
    .map((move) => {
      const next = moves
        .filter(
          (m) => m.playerId === move.playerId && m.id !== move.id && m.timestamp > move.timestamp,
        )
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      const end = Math.min(data.completedWeek, next ? next.week - 1 : data.completedWeek);
      const weeks = Array.from(
        { length: Math.max(0, end - move.week) },
        (_, i) => move.week + i + 1,
      );
      const rows = weeks.map((week) => {
        const matches = data.scores.filter((s) => s.teamId === move.to && s.week === week);
        return matches.length === 1 && Number.isFinite(matches[0].actual) ? matches[0] : undefined;
      });
      const observations = rows.flatMap((row) => {
        if (!row) return [];
        const roster = (row.players || []).filter((p) => p.playerId === move.playerId);
        const starters = row.starters.filter((p) => p.playerId === move.playerId);
        const observed = [...roster, ...starters];
        if (
          roster.length > 1 ||
          starters.length > 1 ||
          !observed.length ||
          observed.some((p) => !Number.isFinite(p.points) || p.points !== observed[0].points)
        )
          return [];
        return [{ week: row.week, points: observed[0].points }];
      });
      const completeLineups = rows.filter(
        (row) =>
          row?.lineupAvailable === true &&
          row.starters.every((p) => Number.isFinite(p.points)) &&
          new Set(row.starters.map((p) => p.playerId)).size === row.starters.length &&
          observations.some((o) => o.week === row.week),
      );
      const starts = completeLineups.flatMap((row) =>
        row!.starters
          .filter((p) => p.playerId === move.playerId)
          .map((p) => ({ week: row!.week, points: p.points })),
      );
      const playoffWeeks = new Set(
        (playoffs || [])
          .filter((g) => g.homeTeamId === move.to || g.awayTeamId === move.to)
          .flatMap((g) => g.weeks),
      );
      const playoffStarts = starts.filter((s) => playoffWeeks.has(s.week));
      const total = (values: { points: number }[]) => values.reduce((sum, p) => sum + p.points, 0);
      return {
        move,
        weeks,
        observedWeeks: observations.length,
        lineupWeeks: completeLineups.length,
        observedPoints: observations.length ? total(observations) : null,
        starts:
          starts.length || (weeks.length > 0 && completeLineups.length === weeks.length)
            ? starts.length
            : null,
        startingPoints: starts.length
          ? total(starts)
          : weeks.length > 0 && completeLineups.length === weeks.length
            ? 0
            : null,
        playoffKnown: playoffs !== undefined,
        playoffStarts:
          playoffs === undefined ||
          (playoffStarts.length === 0 && (!weeks.length || completeLineups.length !== weeks.length))
            ? null
            : playoffStarts.length,
        playoffPoints:
          playoffs === undefined ||
          (playoffStarts.length === 0 && (!weeks.length || completeLineups.length !== weeks.length))
            ? null
            : total(playoffStarts),
        champion: data.results?.find((r) => r.teamId === move.to)?.champion ?? null,
        cutoff: next
          ? `before next observed ${next.type}, week ${next.week}`
          : 'through completed season cutoff; later seasons unavailable',
      };
    });
}
