import type { SeasonRecord } from '../../league-summary';
import { historyData, managerKey, playerName } from './common';
export function playerLoyalty(records: SeasonRecord[]) {
  const rows = new Map<
    string,
    {
      key: string;
      manager: string;
      playerId: string;
      player: string;
      seasons: Set<number>;
      weeks: Set<string>;
      drafts: Set<string>;
      trades: Set<string>;
      pickups: Set<string>;
    }
  >();
  for (const record of records) {
    const { year } = record,
      data = historyData(record);
    for (const team of data.teams) {
      const key = managerKey(year, team);
      const get = (id: string) => {
        const idKey = `${key}:${id}`;
        let row = rows.get(idKey);
        if (!row) {
          row = {
            key,
            manager: team.managerName,
            playerId: id,
            player: playerName(data, id),
            seasons: new Set(),
            weeks: new Set(),
            drafts: new Set(),
            trades: new Set(),
            pickups: new Set(),
          };
          rows.set(idKey, row);
        }
        return row;
      };
      for (const score of data.scores.filter(
        (s) => s.teamId === team.teamId && s.week >= 1 && s.week <= data.completedWeek,
      ))
        for (const player of score.players || []) {
          const row = get(player.playerId);
          row.seasons.add(year);
          row.weeks.add(`${year}:${score.week}`);
        }
      for (const pick of data.draftPicks || [])
        if (pick.teamId === team.teamId) {
          const row = get(pick.playerId);
          row.seasons.add(year);
          row.drafts.add(`${year}:${pick.overallPick}`);
        }
      for (const move of data.moves || [])
        if (
          move.to === team.teamId &&
          move.week <= data.completedWeek &&
          (move.type === 'trade' || move.type === 'pickup')
        ) {
          const row = get(move.playerId);
          row.seasons.add(year);
          (move.type === 'trade' ? row.trades : row.pickups).add(`${year}:${move.id}`);
        }
    }
  }
  return [...rows.values()]
    .map((r) => ({
      ...r,
      seasons: [...r.seasons].sort(),
      weeks: r.weeks.size,
      drafts: r.drafts.size,
      trades: r.trades.size,
      pickups: r.pickups.size,
    }))
    .sort(
      (a, b) =>
        b.weeks - a.weeks ||
        b.seasons.length - a.seasons.length ||
        b.drafts - a.drafts ||
        a.playerId.localeCompare(b.playerId),
    );
}
