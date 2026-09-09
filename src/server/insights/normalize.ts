import type { InsightsSource, PlayerMove, PickupComparison, TradeComparison } from '../../insights';
const round = (n: number) => Math.round(n * 100) / 100;
const median = (values: number[]) => {
  const a = [...values].sort((x, y) => x - y),
    i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
};
export function normalizedComparisons(source: InsightsSource) {
  const scores = source.scores.filter((s) => s.week <= source.completedWeek);
  const positions = source.playerPositions || {};
  const name = (id: string) => source.playerNames[id] || `Player ${id}`;
  function observed(playerId: string, week: number) {
    const found = scores
      .filter((s) => s.week === week)
      .flatMap((s) => s.players || s.starters)
      .filter((p) => p.playerId === playerId && Number.isFinite(p.points));
    // Conflicting commissioner-adjusted copies are not a reliable counterfactual.
    return found.length && found.every((p) => p.points === found[0].points)
      ? found[0].points
      : null;
  }
  function baseline(playerId: string, week: number, excluded: Set<string>) {
    const position = positions[playerId];
    if (!position) return null;
    const peers = new Map(
      scores
        .filter((s) => s.week === week && s.lineupAvailable !== false)
        .flatMap((s) => s.starters)
        .filter(
          (p) =>
            positions[p.playerId] === position &&
            !excluded.has(p.playerId) &&
            Number.isFinite(p.points),
        )
        .map((p) => [p.playerId, p.points]),
    );
    return peers.size >= 3 ? median([...peers.values()]) : null;
  }
  const window = (week: number) =>
    Array.from(
      { length: Math.max(0, Math.min(4, source.completedWeek - week)) },
      (_, i) => week + i + 1,
    );
  function pickup(move: PlayerMove): PickupComparison {
    const next = source.moves
      .filter(
        (m) =>
          m.playerId === move.playerId &&
          m.id !== move.id &&
          (m.timestamp > move.timestamp || (m.timestamp === move.timestamp && m.id > move.id)),
      )
      .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id))[0];
    const drops = source.moves.filter(
      (m) =>
        m.id === move.id &&
        m.type === 'drop' &&
        m.from === move.to &&
        positions[m.playerId] &&
        positions[m.playerId] === positions[move.playerId],
    );
    const singleAdd =
      source.moves.filter((m) => m.id === move.id && m.type === 'pickup' && m.to === move.to)
        .length === 1;
    const replacement = singleAdd && drops.length === 1 ? drops[0] : undefined;
    const candidateWeeks = window(move.week).filter((w) => !next || w < next.week);
    const starts = candidateWeeks.filter((w) =>
      scores.some(
        (s) =>
          s.week === w &&
          s.teamId === move.to &&
          s.lineupAvailable !== false &&
          s.starters.some((p) => p.playerId === move.playerId),
      ),
    );
    const pair = starts
      .map((week) => ({
        week,
        points: observed(move.playerId, week),
        base: replacement ? observed(replacement.playerId, week) : null,
      }))
      .filter((r) => r.points !== null && r.base !== null);
    // Keep one baseline for the entire comparison; never mix dropped-player and median values.
    const useDropped = !!replacement && pair.length >= 2 && pair.length === starts.length;
    const rows = useDropped
      ? pair
      : starts
          .map((week) => ({
            week,
            points: observed(move.playerId, week),
            base: baseline(move.playerId, week, new Set([move.playerId])),
          }))
          .filter((r) => r.points !== null && r.base !== null);
    const averagePoints = rows.length
      ? rows.reduce((s, r) => s + r.points!, 0) / rows.length
      : null;
    const averageBaseline = rows.length
      ? rows.reduce((s, r) => s + r.base!, 0) / rows.length
      : null;
    return {
      position: positions[move.playerId] || null,
      baseline: useDropped
        ? `Dropped ${name(replacement!.playerId)}`
        : `League ${positions[move.playerId] || 'position'} starter median`,
      lift: rows.length >= 2 ? round(averagePoints! - averageBaseline!) : null,
      averagePoints: averagePoints === null ? null : round(averagePoints),
      averageBaseline: averageBaseline === null ? null : round(averageBaseline),
      comparisonWeeks: rows.map((r) => r.week),
    };
  }
  const trades: TradeComparison[] = [];
  for (const id of new Set(source.moves.filter((m) => m.type === 'trade').map((m) => m.id))) {
    const assets = source.moves.filter((m) => m.id === id && m.type === 'trade');
    const excluded = new Set(assets.map((m) => m.playerId));
    const available = window(assets[0].week);
    // Every asset and participant shares exactly the same weeks and baseline population.
    const weeks = available.filter((w) =>
      assets.every(
        (m) => observed(m.playerId, w) !== null && baseline(m.playerId, w, excluded) !== null,
      ),
    );
    const value = (assets: PlayerMove[]) =>
      weeks.length
        ? assets.reduce(
            (total, m) =>
              total +
              weeks.reduce(
                (s, w) => s + observed(m.playerId, w)! - baseline(m.playerId, w, excluded)!,
                0,
              ) /
                weeks.length,
            0,
          )
        : null;
    const participants = [
      ...new Set(assets.flatMap((m) => [m.from, m.to]).filter((s): s is string => !!s)),
    ];
    const sides = participants
      .map((teamId) => {
        const incoming = assets.filter((m) => m.to === teamId),
          outgoing = assets.filter((m) => m.from === teamId);
        const receivedValue = value(incoming),
          sentValue = value(outgoing);
        return {
          teamId,
          received: incoming.map((m) => name(m.playerId)),
          sent: outgoing.map((m) => name(m.playerId)),
          receivedValue: receivedValue === null ? null : round(receivedValue),
          sentValue: sentValue === null ? null : round(sentValue),
          gain: receivedValue === null ? null : round(receivedValue - sentValue!),
        };
      })
      .sort((a, b) => (b.gain ?? -Infinity) - (a.gain ?? -Infinity));
    const hasPicks =
      source.draftPickTradeIds?.includes(id) ||
      (!source.draftPickTradeIds && source.draftPickTrades > 0);
    const incomplete =
      weeks.length < 2 ||
      weeks.length / available.length < 0.75 ||
      participants.length < 2 ||
      assets.some((m) => !m.from || !m.to);
    const close = !incomplete && sides[0].gain! - sides[1].gain! <= 1;
    trades.push({
      id,
      week: assets[0].week,
      weeks,
      possibleWeeks: available.length,
      sides,
      verdict: hasPicks ? 'picks' : incomplete ? 'insufficient' : close ? 'close' : 'leader',
      winner: !hasPicks && !incomplete && !close ? sides[0].teamId : null,
    });
  }
  return { pickup, trades: trades.sort((a, b) => b.week - a.week) };
}
