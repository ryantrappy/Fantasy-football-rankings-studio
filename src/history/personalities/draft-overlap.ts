import type { SeasonRecord } from '../../league-summary';
import { historyData, managerKey, playerName } from './common';
export function draftOverlap(records: SeasonRecord[]) {
  const managers = new Map<
    string,
    { name: string; formats: Map<string, Map<string, Set<number>>> }
  >();
  const names = new Map<string, string>(),
    unsupported: string[] = [];
  for (const record of records) {
    const data = historyData(record);
    if (!data.draftPicks || !['snake', 'linear', 'auction'].includes(data.draftFormat || '')) {
      unsupported.push(`${record.year}: draft data or comparable format unavailable`);
      continue;
    }
    for (const team of data.teams) {
      const key = managerKey(record.year, team),
        manager = managers.get(key) || { name: team.managerName, formats: new Map() };
      const players = manager.formats.get(data.draftFormat!) || new Map<string, Set<number>>();
      for (const pick of data.draftPicks.filter((p) => p.teamId === team.teamId)) {
        const seasons = players.get(pick.playerId) || new Set<number>();
        seasons.add(record.year);
        players.set(pick.playerId, seasons);
        names.set(pick.playerId, playerName(data, pick.playerId));
      }
      manager.formats.set(data.draftFormat!, players);
      managers.set(key, manager);
    }
  }
  const rows: {
    a: string;
    b: string;
    format: string;
    players: { id: string; name: string; aYears: number[]; bYears: number[] }[];
    overlap: number;
    union: number;
  }[] = [];
  const entries = [...managers.entries()];
  entries.forEach(([, a], index) => {
    for (const [, b] of entries.slice(index + 1)) {
      for (const [format, aPlayers] of a.formats) {
        const bPlayers = b.formats.get(format);
        if (!bPlayers || !aPlayers.size || !bPlayers.size) continue;
        const shared = [...aPlayers.keys()].filter((id) => bPlayers.has(id));
        rows.push({
          a: a.name,
          b: b.name,
          format,
          players: shared.map((id) => ({
            id,
            name: names.get(id) || id,
            aYears: [...aPlayers.get(id)!],
            bYears: [...bPlayers.get(id)!],
          })),
          overlap: shared.length,
          union: new Set([...aPlayers.keys(), ...bPlayers.keys()]).size,
        });
      }
    }
  });
  return { rows: rows.sort((a, b) => b.overlap - a.overlap), unsupported };
}
