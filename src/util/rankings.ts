import type { League, Team, TeamRanking, WeeklyRanking } from '../types';

export function defaultSeason(now = new Date()): number {
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
}

export function orderTeams(teams: TeamRanking[]): TeamRanking[] {
  return teams.map((team, index) => ({ ...team, teamId: String(team.teamId), position: index + 1 }));
}

export function moveTeam(teams: TeamRanking[], from: number, to: number): TeamRanking[] {
  if (from < 0 || to < 0 || from >= teams.length || to >= teams.length) return teams;
  const next = [...teams];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return orderTeams(next);
}

export function newRanking(league: League, year: number, week: number, teams: Team[]): WeeklyRanking {
  return {
    leagueId: league.leagueId,
    leagueName: league.leagueName,
    year,
    week,
    rankingsTitle: `Week ${week} power rankings`,
    introduction: '',
    teams: teams.map((team, index) => ({ ...team, teamId: String(team.teamId), description: '', position: index + 1 })),
  };
}

export function previousPosition(history: WeeklyRanking[], ranking: WeeklyRanking, teamId: string): number | undefined {
  const previous = history.find((entry) => entry.leagueId === ranking.leagueId && entry.year === ranking.year && entry.week === ranking.week - 1);
  const index = previous?.teams.findIndex((team) => String(team.teamId) === String(teamId));
  return index === undefined || index < 0 ? undefined : index + 1;
}

export function rankingSignature(ranking: WeeklyRanking): string {
  const { _id: _ignored, ...content } = ranking;
  return JSON.stringify(content);
}
