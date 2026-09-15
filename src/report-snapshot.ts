import type { SeasonRecord } from './league-summary';
import type { League } from './types';

export type SnapshotView = 'insights' | 'history' | 'playoffs';
export interface SnapshotInput {
  leagueId: string;
  view: SnapshotView;
  records: SeasonRecord[];
  activeManagerKeys: string[];
  activeSeason: number;
}
export interface ReportSnapshot extends Omit<SnapshotInput, 'leagueId'> {
  publicId: string;
  savedAt: string;
  expiresAt: string;
  league: League;
}
