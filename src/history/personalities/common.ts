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
