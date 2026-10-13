import type { SeasonRecord } from '../../league-summary';
import { competitionGames, managerKey, result } from './games';
export function historicalSchedules(record: SeasonRecord) {
  const { year, data } = record;
  const games = competitionGames([record]).games.filter((g) => g.phase === 'regular');
  const end = data.regularSeasonSchedule?.endWeek ?? data.playoffSettings?.regularSeasonEnd;
  return data.teams.map((t) => {
    const key = managerKey(t, year);
    const own = games.filter((g) => g.a.key === key || g.b.key === key);
    let expected = 0,
      actual = 0,
      opponentPoints = 0,
      usable = 0;
    for (const g of own) {
      const [a, b] = g.a.key === key ? [g.a, g.b] : [g.b, g.a];
      actual += result(a.points, b.points);
      opponentPoints += b.points;
      const peers = data.scores.filter(
        (s) =>
          s.week === g.week &&
          s.teamId !== t.teamId &&
          s.week <= data.completedWeek &&
          Number.isFinite(s.actual),
      );
      if (peers.length) {
        expected += peers.reduce((n, s) => n + result(a.points, s.actual), 0) / peers.length;
        usable++;
      }
    }
    return {
      year,
      key,
      teamId: t.teamId,
      name: t.managerName,
      actual,
      expected: usable ? expected : null,
      weeks: usable,
      games: own.length,
      difficulty: own.length ? opponentPoints / own.length : null,
      completed: end != null && data.completedWeek >= end,
      possibleWeeks: end ?? null,
    };
  });
}
export function alternateSchedule(record: SeasonRecord, teamId: string, donorId: string) {
  const { data } = record;
  const end = data.regularSeasonSchedule?.endWeek ?? data.playoffSettings?.regularSeasonEnd;
  const games = competitionGames([record]).games.filter((g) => g.phase === 'regular');
  let wins = 0,
    losses = 0,
    ties = 0,
    skipped = 0,
    byes = 0;
  const evidence: {
    week: number;
    opponent: string;
    score: number;
    against: number;
    outcome: string;
  }[] = [];
  if (end == null) return { wins, losses, ties, skipped, byes, evidence, known: false };
  for (let week = 1; week <= Math.min(end, data.completedWeek); week++) {
    const donor = games.find(
      (g) => g.week === week && (g.a.teamId === donorId || g.b.teamId === donorId),
    );
    const own = data.scores.filter(
      (s) => s.week === week && s.teamId === teamId && Number.isFinite(s.actual),
    );
    if (!donor) {
      const bye =
        data.regularSeasonSchedule?.fixtures.some(
          (f) => f.week === week && f.homeTeamId === donorId && f.awayTeamId === null,
        ) ||
        data.scores.some(
          (s) => s.week === week && s.teamId === donorId && s.opponentTeamId === null,
        );
      if (bye) byes++;
      else skipped++;
      continue;
    }
    const opponent = donor.a.teamId === donorId ? donor.b : donor.a;
    // A swapped schedule cannot create a team-versus-itself matchup. Omit rather than invent a replacement.
    if (own.length !== 1 || opponent.teamId === teamId) {
      skipped++;
      continue;
    }
    const outcome = result(own[0].actual, opponent.points);
    if (outcome === 1) wins++;
    else if (outcome === 0) losses++;
    else ties++;
    evidence.push({
      week,
      opponent: opponent.name,
      score: own[0].actual,
      against: opponent.points,
      outcome: outcome === 1 ? 'W' : outcome === 0 ? 'L' : 'T',
    });
  }
  return { wins, losses, ties, skipped, byes, evidence, known: true };
}
