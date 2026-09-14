import type { PlayoffProjection } from '../../insights';

interface SleeperProjectionRow {
  player_id?: string;
  stats?: Record<string, number>;
}

interface SleeperLineup {
  roster_id: number;
  starters?: string[];
}

export function sleeperProjectionSnapshot(
  week: number,
  teamIds: string[],
  lineups: SleeperLineup[],
  projections: SleeperProjectionRow[],
  scoring: Record<string, number>,
): PlayoffProjection {
  const byPlayer = new Map(
    projections
      .filter((row): row is SleeperProjectionRow & { player_id: string } => !!row.player_id)
      .map((row) => [row.player_id, row.stats]),
  );
  const teamPoints: Record<string, number> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  for (const teamId of teamIds) {
    const starters =
      lineups
        .find((row) => String(row.roster_id) === teamId)
        ?.starters?.filter((id) => id !== '0') || [];
    totalStarters += starters.length;
    const values = starters.map((playerId) => {
      const stats = byPlayer.get(playerId);
      if (!stats) return undefined;
      coveredStarters++;
      return Object.entries(stats).reduce((total, [stat, value]) => {
        const weight = scoring[stat];
        return total + (Number.isFinite(value) && Number.isFinite(weight) ? value * weight : 0);
      }, 0);
    });
    if (starters.length && values.every((value) => value !== undefined))
      teamPoints[teamId] = values.reduce<number>((total, value) => total + value!, 0);
  }
  return { provider: 'Sleeper', week, teamPoints, coveredStarters, totalStarters };
}

interface EspnProjectionEntry {
  lineupSlotId: number;
  playerPoolEntry?: {
    player?: {
      stats?: {
        scoringPeriodId: number;
        seasonId: number;
        statSourceId: number;
        statSplitTypeId: number;
        appliedTotal: number;
      }[];
    };
  };
}

interface EspnProjectionSide {
  teamId: number;
  rosterForCurrentScoringPeriod?: { entries: EspnProjectionEntry[] };
}

export function espnProjectionSnapshot(
  year: number,
  week: number,
  teamIds: string[],
  sides: EspnProjectionSide[],
): PlayoffProjection {
  const teamPoints: Record<string, number> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  for (const teamId of teamIds) {
    const entries =
      sides.find((side) => String(side.teamId) === teamId)?.rosterForCurrentScoringPeriod
        ?.entries || [];
    const starters = entries.filter((entry) => ![20, 21].includes(entry.lineupSlotId));
    totalStarters += starters.length;
    const values = starters.map(
      (entry) =>
        entry.playerPoolEntry?.player?.stats?.find(
          (stat) =>
            stat.seasonId === year &&
            stat.scoringPeriodId === week &&
            stat.statSourceId === 1 &&
            stat.statSplitTypeId === 1 &&
            Number.isFinite(stat.appliedTotal),
        )?.appliedTotal,
    );
    coveredStarters += values.filter((value) => value !== undefined).length;
    if (starters.length && values.every((value) => value !== undefined))
      teamPoints[teamId] = values.reduce<number>((total, value) => total + value!, 0);
  }
  return { provider: 'ESPN', week, teamPoints, coveredStarters, totalStarters };
}
