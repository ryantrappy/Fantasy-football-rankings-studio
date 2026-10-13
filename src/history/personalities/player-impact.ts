import type { SeasonRecord } from '../../league-summary';
import { managerKey, playerName } from './common';
export function playerImpact(records: SeasonRecord[]) {
  const rows = new Map<
    string,
    {
      managerKey: string;
      manager: string;
      playerId: string;
      player: string;
      role: 'Nemesis' | 'Guardian angel';
      appearances: number;
      points: number;
      decisive: number;
      seasons: number[];
    }
  >();
  let excluded = 0;
  for (const { year, data } of records)
    for (const team of data.teams) {
      const key = managerKey(year, team);
      for (const score of data.scores.filter(
        (s) => s.teamId === team.teamId && s.week <= data.completedWeek,
      )) {
        const opponent = data.scores.find(
          (s) =>
            s.week === score.week &&
            s.teamId === score.opponentTeamId &&
            s.opponentTeamId === team.teamId,
        );
        if (!opponent) {
          excluded++;
          continue;
        }
        const won = score.actual > opponent.actual,
          lost = score.actual < opponent.actual;
        if (!won && !lost) continue;
        const source = won ? score : opponent;
        if (!source.lineupAvailable || !source.players) {
          excluded++;
          continue;
        }
        for (const starter of [...new Map(source.starters.map((p) => [p.playerId, p])).values()]) {
          if (
            !source.players.some((p) => p.playerId === starter.playerId) ||
            !Number.isFinite(starter.points)
          ) {
            excluded++;
            continue;
          }
          const role = won ? 'Guardian angel' : 'Nemesis';
          const id = `${key}:${role}:${starter.playerId}`;
          const row = rows.get(id) || {
            managerKey: key,
            manager: team.managerName,
            playerId: starter.playerId,
            player: playerName(data, starter.playerId),
            role,
            appearances: 0,
            points: 0,
            decisive: 0,
            seasons: [],
          };
          row.appearances++;
          row.points += starter.points;
          // Counterfactual removal is an attribution rule, not a causal claim.
          if (starter.points > Math.abs(score.actual - opponent.actual)) row.decisive++;
          if (!row.seasons.includes(year)) row.seasons.push(year);
          rows.set(id, row);
        }
      }
    }
  return {
    rows: [...rows.values()].sort(
      (a, b) =>
        b.decisive - a.decisive || b.points - a.points || a.playerId.localeCompare(b.playerId),
    ),
    excluded,
  };
}
