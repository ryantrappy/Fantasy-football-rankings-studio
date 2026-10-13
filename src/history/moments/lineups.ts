import type { ScoreWeek, SeasonInsights } from '../../insights';
const outcome = (a: number, b: number) =>
  !Number.isFinite(a) || !Number.isFinite(b) ? null : a > b ? 'W' : a < b ? 'L' : 'T';
export function lineupRegrets(data: SeasonInsights) {
  const supported = (s: ScoreWeek) =>
    Number.isFinite(s.actual) &&
    s.starters.every((p) => Number.isFinite(p.points)) &&
    (s.players || []).every((p) => Number.isFinite(p.points)) &&
    Number.isFinite(s.bestLineup?.points) &&
    s.rosterComplete === true &&
    s.lineupAvailable !== false &&
    !!s.bestLineup?.playerIds &&
    s.bestLineup.playerIds.length === s.bestLineup.slots &&
    Math.abs(s.starters.reduce((sum, p) => sum + p.points, 0) - s.actual) < 0.05 &&
    s.bestLineup.points >= s.actual - 0.05;
  const rows = data.scores
    .filter((s) => s.week <= data.completedWeek && s.opponentTeamId)
    .map((score) => {
      const ownRows = data.scores.filter((s) => s.teamId === score.teamId && s.week === score.week);
      const opponents = data.scores.filter(
        (s) => s.week === score.week && s.teamId === score.opponentTeamId,
      );
      const opponent =
        ownRows.length === 1 &&
        opponents.length === 1 &&
        opponents[0].opponentTeamId === score.teamId &&
        Number.isFinite(opponents[0].actual)
          ? opponents[0]
          : undefined;
      const complete = !!opponent && supported(score);
      const optimal = complete ? score.bestLineup!.points : null;
      const opponentOptimal = opponent && supported(opponent) ? opponent.bestLineup!.points : null;
      const starters = new Set(score.starters.map((p) => p.playerId));
      return {
        score,
        actual: opponent ? outcome(score.actual, opponent.actual) : null,
        optimal,
        regret: optimal === null ? null : optimal - score.actual,
        unilateral: optimal !== null && opponent ? outcome(optimal, opponent.actual) : null,
        bothOptimal:
          optimal !== null && opponentOptimal !== null ? outcome(optimal, opponentOptimal) : null,
        benchIn: complete ? score.bestLineup!.playerIds!.filter((id) => !starters.has(id)) : [],
        startersOut: complete
          ? score.starters
              .filter((p) => !score.bestLineup!.playerIds!.includes(p.playerId))
              .map((p) => p.playerId)
          : [],
      };
    });
  const largest = [...new Set(rows.map((r) => r.score.week))].flatMap((week) => {
    const supported = rows
      .filter((r) => r.score.week === week && r.regret !== null)
      .sort((a, b) => b.regret! - a.regret!);
    return supported.length ? [supported[0]] : [];
  });
  return { rows, largest };
}
