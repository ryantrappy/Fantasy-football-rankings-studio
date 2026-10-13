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
      const rows = weeks.map((week) =>
        data.scores.find((s) => s.teamId === move.to && s.week === week),
      );
      const observations = rows.flatMap((row) => {
        if (!row) return [];
        const player =
          (row.players || []).find((p) => p.playerId === move.playerId) ||
          row.starters.find((p) => p.playerId === move.playerId);
        return player ? [{ week: row.week, points: player.points }] : [];
      });
      const starts = rows.flatMap((row) =>
        row?.lineupAvailable === true
          ? row.starters
              .filter((p) => p.playerId === move.playerId)
              .map((p) => ({ week: row.week, points: p.points }))
          : [],
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
        lineupWeeks: rows.filter((r) => r?.lineupAvailable === true).length,
        observedPoints: observations.length ? total(observations) : null,
        starts: starts.length,
        startingPoints: starts.length
          ? total(starts)
          : rows.some((r) => r?.lineupAvailable === true)
            ? 0
            : null,
        playoffKnown: playoffs !== undefined,
        playoffStarts: playoffs === undefined ? null : playoffStarts.length,
        playoffPoints: playoffs === undefined ? null : total(playoffStarts),
        champion: data.results?.find((r) => r.teamId === move.to)?.champion ?? null,
        cutoff: next
          ? `before next observed ${next.type}, week ${next.week}`
          : 'through completed season cutoff; later seasons unavailable',
      };
    });
}
