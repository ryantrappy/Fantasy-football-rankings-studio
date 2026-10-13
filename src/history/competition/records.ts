import type { SeasonRecord } from '../../league-summary';
import { competitionGames } from './games';
export function matchupRecords(records: SeasonRecord[]) {
  const { games } = competitionGames(records);
  return games.map((g) => {
    const record = records.find((r) => r.year === g.year)!;
    const scores = record.data.scores.filter(
      (s) => s.week === g.week && s.week <= record.data.completedWeek && Number.isFinite(s.actual),
    );
    const complete =
      g.weeks.length === 1 &&
      scores.length === record.data.teams.length &&
      new Set(scores.map((s) => s.teamId)).size === scores.length &&
      scores.every((s) => record.data.teams.some((t) => t.teamId === s.teamId));
    const aRank = 1 + scores.filter((s) => s.actual > g.a.points).length,
      bRank = 1 + scores.filter((s) => s.actual > g.b.points).length;
    const loser = g.a.points < g.b.points ? g.a : g.b,
      winner = g.a.points >= g.b.points ? g.a : g.b;
    return {
      ...g,
      margin: Math.abs(g.a.points - g.b.points),
      combined: g.a.points + g.b.points,
      individual: Math.max(g.a.points, g.b.points),
      aRank: complete ? aRank : null,
      bRank: complete ? bRank : null,
      population: scores.length,
      leagueTeams: record.data.teams.length,
      loser,
      winner,
      worstBeat:
        complete &&
        g.a.points !== g.b.points &&
        (loser === g.a ? aRank : bRank) <= Math.max(1, Math.ceil(scores.length / 4)),
    };
  });
}
