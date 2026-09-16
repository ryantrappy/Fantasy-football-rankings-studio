import type { League, Matchup, Team, TeamRanking, WeeklyRanking } from '../types';

export function defaultSeason(now = new Date()): number {
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
}

export function orderTeams(teams: TeamRanking[]): TeamRanking[] {
  return teams.map((team, index) => ({
    ...team,
    teamId: String(team.teamId),
    position: index + 1,
  }));
}

export function moveTeam(teams: TeamRanking[], from: number, to: number): TeamRanking[] {
  if (from < 0 || to < 0 || from >= teams.length || to >= teams.length) return teams;
  const next = [...teams];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return orderTeams(next);
}

export function newRanking(
  league: League,
  year: number,
  week: number,
  teams: Team[],
  matchups: Matchup[] = [],
): WeeklyRanking {
  return {
    leagueId: league.leagueId,
    leagueName: league.leagueName,
    year,
    week,
    rankingsTitle: `Week ${week} power rankings`,
    introduction: '',
    teams: powerOrderTeams(teams, matchups).map((team, index) => ({
      ...team,
      teamId: String(team.teamId),
      description: '',
      position: index + 1,
    })),
  };
}

// A conservative starting signal: points scored and point margin, both shrunk
// toward league average after only a few games. It is not a player projection.
export function powerOrderTeams(teams: Team[], matchups: Matchup[]): Team[] {
  const entries = new Map(
    teams.map((team) => [String(team.teamId), { points: [] as number[], margins: [] as number[] }]),
  );
  for (const matchup of matchups) {
    if (
      matchup.awayTeamId == null ||
      matchup.awayScore == null ||
      !Number.isFinite(matchup.homeScore) ||
      !Number.isFinite(matchup.awayScore)
    )
      continue;
    const home = entries.get(String(matchup.homeTeamId)),
      away = entries.get(String(matchup.awayTeamId));
    if (!home || !away) continue;
    home.points.push(matchup.homeScore);
    home.margins.push(matchup.homeScore - matchup.awayScore);
    away.points.push(matchup.awayScore);
    away.margins.push(matchup.awayScore - matchup.homeScore);
  }
  const allPoints = [...entries.values()].flatMap((entry) => entry.points);
  if (!allPoints.length) return teams;
  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const leaguePoints = average(allPoints);
  const leagueMargin = average([...entries.values()].flatMap((entry) => entry.margins));
  return [...teams].sort((a, b) => {
    const score = (team: Team) => {
      const data = entries.get(String(team.teamId))!,
        n = data.points.length,
        weight = n / (n + 3);
      return (
        weight * (0.7 * average(data.points) + 0.3 * average(data.margins)) +
        (1 - weight) * (0.7 * leaguePoints + 0.3 * leagueMargin)
      );
    };
    return score(b) - score(a) || a.teamName.localeCompare(b.teamName);
  });
}

export function previousPosition(
  history: WeeklyRanking[],
  ranking: WeeklyRanking,
  teamId: string,
): number | undefined {
  const previous = history.find(
    (entry) =>
      entry.leagueId === ranking.leagueId &&
      entry.year === ranking.year &&
      entry.week === ranking.week - 1,
  );
  const index = previous?.teams.findIndex((team) => String(team.teamId) === String(teamId));
  return index === undefined || index < 0 ? undefined : index + 1;
}

export function rankingSignature(ranking: WeeklyRanking): string {
  const { _id: _ignored, revision: _revision, ...content } = ranking;
  return JSON.stringify(content);
}
