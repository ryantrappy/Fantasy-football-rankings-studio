import type { SeasonRecord } from '../../league-summary';
import { historyData, managerKey } from './common';
export function transactionActivity(records: SeasonRecord[]) {
  return records.flatMap((record) => {
    const data = historyData(record),
      coverage = data.moveCoverage;
    return data.teams.map((team) => {
      const moves = (data.moves || []).filter(
        (move) =>
          move.week >= 1 && move.week <= data.completedWeek && !!coverage?.weeks.includes(move.week) && (move.to === team.teamId || move.from === team.teamId),
      );
      const count = (type: 'trade' | 'pickup' | 'drop') =>
        coverage?.types.includes(type)
          ? new Set(
              moves
                .filter(
                  (m) =>
                    m.type === type &&
                    (type !== 'pickup' || m.to === team.teamId) &&
                    (type !== 'drop' || m.from === team.teamId),
                )
                .map((m) => m.id),
            ).size
          : null;
      const pickups = count('pickup'),
        drops = count('drop'),
        trades = count('trade');
      const weeks = new Set(coverage?.weeks.filter((w) => w <= data.completedWeek)).size;
      return {
        year: record.year,
        key: managerKey(record.year, team),
        manager: team.managerName,
        pickups,
        drops,
        trades,
        weeks,
        coverage: coverage
          ? `${coverage.complete ? 'Complete' : 'Partial'}: ${weeks} weeks. ${coverage.note}`
          : 'Unsupported: provider transaction coverage not recorded.',
        label:
          coverage?.complete && weeks >= 4 && pickups !== null && drops !== null
            ? (pickups + drops) / weeks >= 2
              ? 'Tinkerer'
              : 'Steady hand'
            : null,
      };
    });
  });
}
