import type { SeasonRecord } from '../../league-summary';
export function tradeNetwork(records: SeasonRecord[]) {
  const pairs = new Map<
    string,
    { a: string; b: string; identities: string[]; transactions: { year: number; id: string }[] }
  >();
  for (const { year, data } of records) {
    const identity = (id: string) =>
      data.teams.find((t) => t.teamId === id)?.managerKey || `${year}:${id}`;
    const name = (id: string) => data.teams.find((t) => t.teamId === id)?.managerName || id;
    for (const id of new Set(
      (data.moves || []).filter((m) => m.type === 'trade').map((m) => m.id),
    )) {
      const moves = data.moves!.filter((m) => m.id === id && m.type === 'trade');
      const participants = [
        ...new Set(moves.flatMap((m) => [m.from, m.to]).filter((id): id is string => !!id)),
      ];
      for (let i = 0; i < participants.length; i++)
        for (let j = i + 1; j < participants.length; j++) {
          const a = participants[i],
            b = participants[j],
            identities = [identity(a), identity(b)].sort(),
            key = JSON.stringify(identities);
          const row = pairs.get(key) || { a: name(a), b: name(b), identities, transactions: [] };
          row.transactions.push({ year, id });
          pairs.set(key, row);
        }
    }
  }
  return [...pairs.values()].sort((a, b) => b.transactions.length - a.transactions.length);
}
export function tradeTrees(record: SeasonRecord) {
  const { data } = record;
  const moves = [...(data.moves || [])].sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
  return moves
    .filter((m) => m.type === 'trade')
    .map((move) => {
      const later = moves.filter(
        (m) => m.playerId === move.playerId && m.id !== move.id && m.timestamp > move.timestamp,
      );
      const next = later[0];
      const weeks = next
        ? Array.from({ length: Math.max(0, next.week - move.week + 1) }, (_, i) => move.week + i)
        : [];
      const continuous =
        !!next &&
        next.from === move.to &&
        data.moveCoverage?.complete === true &&
        weeks.every((w) => data.moveCoverage?.weeks.includes(w)) &&
        ['trade', 'pickup', 'drop'].every((t) =>
          data.moveCoverage?.types.includes(t as 'trade' | 'pickup' | 'drop'),
        );
      return {
        move,
        next: next || null,
        continuous,
        reason: !next
          ? 'No later observed movement; future ownership/value unknown.'
          : continuous
            ? 'Verified next ownership transition.'
            : 'Later observed movement; intervening ownership continuity unavailable.',
      };
    });
}
