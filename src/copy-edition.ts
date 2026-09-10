import type { WeeklyRanking } from './types';
export interface CopyOptions {
  introduction: boolean;
  commentary: boolean;
  order: boolean;
}
export function copyEdition(
  destination: WeeklyRanking,
  source: WeeklyRanking,
  options: CopyOptions,
): WeeklyRanking {
  const sourceTeams = new Map(source.teams.map((t) => [t.teamId, t]));
  let teams = destination.teams.map((t) => ({
    ...t,
    description:
      options.commentary && sourceTeams.has(t.teamId)
        ? sourceTeams.get(t.teamId)!.description
        : t.description,
  }));
  if (options.order) {
    const order = new Map(source.teams.map((t, i) => [t.teamId, i]));
    teams = teams
      .map((t, i) => ({ t, i }))
      .sort(
        (a, b) =>
          (order.get(a.t.teamId) ?? source.teams.length + a.i) -
          (order.get(b.t.teamId) ?? source.teams.length + b.i),
      )
      .map(({ t }, i) => ({ ...t, position: i + 1 }));
  }
  return {
    ...destination,
    introduction: options.introduction ? source.introduction : destination.introduction,
    teams,
  };
}
