import type { SeasonInsights, PlayerMove } from '../../insights';
import type { SeasonRecord } from '../../league-summary';
export type HistoryData = SeasonInsights & {
  moves?: PlayerMove[];
  moveCoverage?: {
    weeks: number[];
    types: ('trade' | 'pickup' | 'drop')[];
    complete: boolean;
    note: string;
  };
  draftPicks?: { playerId: string; teamId: string; overallPick: number; round?: number }[];
  draftCoverage?: string;
  draftFormat?: string;
};
export const managerKey = (year: number, team: SeasonInsights['teams'][number]) =>
  team.managerKey || `unidentified:${year}:${team.teamId}`;
export const historyData = (record: SeasonRecord): HistoryData => record.data;
export const playerName = (data: SeasonInsights, id: string) =>
  data.playerIdentities?.[id]?.name || id;

// A score is evidence only when the team/week has exactly one finite completed entry.
export function verifiedScores(data: SeasonInsights) {
  const counts = new Map<string, number>();
  for (const score of data.scores) {
    const key = `${score.teamId}:${score.week}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return data.scores.filter(
    (score) =>
      Number.isInteger(score.week) &&
      score.week >= 1 &&
      score.week <= data.completedWeek &&
      Number.isFinite(score.actual) &&
      counts.get(`${score.teamId}:${score.week}`) === 1 &&
      data.teams.some((team) => team.teamId === score.teamId),
  );
}
