import type { SeasonRecord } from '../../league-summary';
import { competitionGames, managerKey, result } from './games';
export function historicalPlayoffs(records: SeasonRecord[], minimum = 3) {
  const { games, managers } = competitionGames(records);
  return [...managers].map(([key, name]) => {
    const regular = games.filter(
      (g) => g.phase === 'regular' && (g.a.key === key || g.b.key === key),
    );
    const wins = regular.reduce(
      (n, g) =>
        n + (g.a.key === key ? result(g.a.points, g.b.points) : result(g.b.points, g.a.points)),
      0,
    );
    const evidence = records.flatMap((r) =>
      (r.data.playoffGames ?? []).flatMap((g) => {
        const team = r.data.teams.find(
          (t) =>
            managerKey(t, r.year) === key &&
            (t.teamId === g.homeTeamId || t.teamId === g.awayTeamId),
        );
        if (!team) return [];
        const own = team.teamId === g.homeTeamId;
        const points = own ? g.homePoints : g.awayPoints,
          against = own ? g.awayPoints : g.homePoints;
        return [
          {
            id: `${r.year}:${g.id}`,
            year: r.year,
            weeks: g.weeks,
            points,
            against,
            win: result(points, against),
            elimination: g.elimination,
            opponent:
              r.data.teams.find((t) => t.teamId === (own ? g.awayTeamId : g.homeTeamId))
                ?.managerName ?? 'Unknown',
          },
        ];
      }),
    );
    const knownSeasons = records.filter(
      (r) =>
        r.data.teams.some((t) => managerKey(t, r.year) === key) &&
        r.data.playoffGames !== undefined,
    ).length;
    const postseason = evidence.length
      ? evidence.reduce((n, e) => n + e.win, 0) / evidence.length
      : null;
    const mustWin = evidence.filter((e) => e.elimination);
    const clutch = mustWin.length ? mustWin.reduce((n, e) => n + e.win, 0) / mustWin.length : null;
    const rate = regular.length ? wins / regular.length : null;
    const strongSeasons = records.filter((r) => {
      const gs = regular.filter((g) => g.year === r.year);
      return (
        gs.length >= minimum &&
        gs.reduce(
          (n, g) =>
            n + (g.a.key === key ? result(g.a.points, g.b.points) : result(g.b.points, g.a.points)),
          0,
        ) /
          gs.length >=
          0.65
      );
    });
    const strongLossYears = new Set(
      evidence
        .filter((e) => e.elimination && e.win === 0 && strongSeasons.some((r) => r.year === e.year))
        .map((e) => e.year),
    );
    const label =
      mustWin.length < minimum
        ? 'Insufficient elimination-game evidence'
        : clutch! >= 0.65
          ? 'Clutch record'
          : strongLossYears.size >= 2 &&
              postseason != null &&
              rate != null &&
              rate - postseason >= 0.2
            ? 'Playoff underperformance (choker context)'
            : 'No qualifying label';
    return {
      key,
      name,
      regularGames: regular.length,
      regularRate: rate,
      playoffGames: evidence.length,
      playoffRate: postseason,
      mustWinGames: mustWin.length,
      mustWinRate: clutch,
      knownSeasons,
      label,
      evidence,
      strongLossYears: strongLossYears.size,
    };
  });
}
