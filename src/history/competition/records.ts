import type { SeasonRecord } from '../../league-summary';
import { competitionGames } from './games';
export function matchupRecords(records: SeasonRecord[], { weekly = false } = {}) {
  const { games } = competitionGames(records);
  const scopedGames = weekly
    ? games.flatMap((g) => {
        if (g.weeks.length === 1) return [g];
        const { data } = records.find((r) => r.year === g.year)!;
        return g.weeks.flatMap((week) => {
          const a = data.scores.filter((s) => s.week === week && s.teamId === g.a.teamId),
            b = data.scores.filter((s) => s.week === week && s.teamId === g.b.teamId);
          if (
            week > data.completedWeek ||
            a.length !== 1 ||
            b.length !== 1 ||
            !Number.isFinite(a[0].actual) ||
            !Number.isFinite(b[0].actual)
          )
            return [];
          return [
            {
              ...g,
              id: `${g.id}:week:${week}`,
              week,
              weeks: [week],
              a: { ...g.a, points: a[0].actual },
              b: { ...g.b, points: b[0].actual },
            },
          ];
        });
      })
    : games;
  return scopedGames.map((g) => {
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

export function individualScoreRecords(records: SeasonRecord[]) {
  return records.flatMap(({ year, data }) =>
    data.scores.flatMap((s) => {
      if (
        s.week > data.completedWeek ||
        !Number.isFinite(s.actual) ||
        data.scores.filter((x) => x.week === s.week && x.teamId === s.teamId).length !== 1
      )
        return [];
      const team = data.teams.find((t) => t.teamId === s.teamId);
      if (!team) return [];
      const peers = data.scores.filter((x) => x.week === s.week && Number.isFinite(x.actual));
      const complete =
        peers.length === data.teams.length &&
        new Set(peers.map((x) => x.teamId)).size === peers.length &&
        peers.every((x) => data.teams.some((t) => t.teamId === x.teamId));
      const bye = data.regularSeasonSchedule?.fixtures.some(
        (f) => f.week === s.week && f.homeTeamId === s.teamId && f.awayTeamId === null,
      );
      return [
        {
          id: `score:${year}:${s.week}:${s.teamId}`,
          year,
          week: s.week,
          name: team.managerName,
          points: s.actual,
          opponent: bye
            ? 'Confirmed bye'
            : (data.teams.find((t) => t.teamId === s.opponentTeamId)?.managerName ??
              'Opponent unavailable'),
          rank: complete ? 1 + peers.filter((x) => x.actual > s.actual).length : null,
          population: peers.length,
          total: data.teams.length,
        },
      ];
    }),
  );
}
