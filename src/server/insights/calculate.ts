import type { InsightsSource, PlayerMove, SeasonInsights } from '../../insights';
import { normalizedComparisons } from './normalize';
const round = (value: number) => Math.round(value * 100) / 100;
export function calculateInsights(source: InsightsSource): SeasonInsights {
  const normalized = normalizedComparisons(source);
  const scores = source.scores.filter((s) => s.week <= source.completedWeek);
  const moves = [...source.moves].sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
  function contribution(move: PlayerMove) {
    const next = moves.find(
      (m) =>
        m.playerId === move.playerId &&
        m.id !== move.id &&
        (m.timestamp > move.timestamp || (m.timestamp === move.timestamp && m.id > move.id)),
    );
    // Exclude the transaction week: providers do not reliably expose player-level lineup lock times.
    const eligible = scores.filter(
      (s) =>
        s.lineupAvailable !== false &&
        s.teamId === move.to &&
        s.week > move.week &&
        (!next || s.week < next.week),
    );
    const starts = eligible.flatMap((s) => s.starters.filter((p) => p.playerId === move.playerId));
    return {
      points: round(starts.reduce((sum, p) => sum + p.points, 0)),
      starts: starts.length,
      eligibleWeeks: eligible.length,
    };
  }
  const name = (id: string) => source.playerNames[id] || `Player ${id}`;
  const pickups = moves
    .filter((m) => m.type === 'pickup' && m.to)
    .map((m) => ({
      id: `${m.id}:${m.playerId}`,
      teamId: m.to!,
      player: name(m.playerId),
      week: m.week,
      ...contribution(m),
      ...normalized.pickup(m),
    }))
    .sort(
      (a, b) =>
        (b.lift ?? -Infinity) - (a.lift ?? -Infinity) ||
        b.comparisonWeeks.length - a.comparisonWeeks.length,
    );
  const trades: SeasonInsights['trades'] = [];
  for (const id of new Set(moves.filter((m) => m.type === 'trade').map((m) => m.id))) {
    const assets = moves.filter((m) => m.id === id && m.type === 'trade');
    const participants = new Set(
      assets.flatMap((m) => [m.from, m.to]).filter((id): id is string => !!id),
    );
    for (const teamId of participants) {
      const incoming = assets.filter((m) => m.to === teamId);
      const outgoing = assets.filter((m) => m.from === teamId);
      const received = incoming.map(contribution),
        sent = outgoing.map(contribution);
      const receivedPoints = round(received.reduce((sum, r) => sum + r.points, 0));
      const sentPoints = round(sent.reduce((sum, r) => sum + r.points, 0));
      const eligibleWeeks = [...received, ...sent].reduce((sum, r) => sum + r.eligibleWeeks, 0);
      trades.push({
        id,
        week: assets[0].week,
        teamId,
        received: incoming.map((m) => name(m.playerId)),
        sent: outgoing.map((m) => name(m.playerId)),
        receivedPoints,
        sentPoints,
        net: eligibleWeeks ? round(receivedPoints - sentPoints) : null,
        starts: received.reduce((sum, r) => sum + r.starts, 0),
        eligibleWeeks,
      });
    }
  }
  const teams = source.teams.map((team) => {
    const rows = scores.filter((s) => s.teamId === team.teamId);
    const projections = rows.filter((s) => s.projected !== null);
    const teamTrades = trades.filter((t) => t.teamId === team.teamId);
    const total = round(rows.reduce((sum, r) => sum + r.actual, 0));
    const receivedPoints = round(teamTrades.reduce((sum, t) => sum + t.receivedPoints, 0));
    const sentPoints = round(teamTrades.reduce((sum, t) => sum + t.sentPoints, 0));
    return {
      ...team,
      weeks: rows.length,
      total,
      average: rows.length ? round(total / rows.length) : null,
      best: rows.length ? Math.max(...rows.map((r) => r.actual)) : null,
      projectedWeeks: projections.length,
      projectionDelta: projections.length
        ? round(
            projections.reduce((sum, r) => sum + r.actual - r.projected!, 0) / projections.length,
          )
        : null,
      beatProjection: projections.filter((r) => r.actual > r.projected!).length,
      aboveMedian: rows.filter((r) => {
        const all = scores
          .filter((s) => s.week === r.week)
          .map((s) => s.actual)
          .sort((a, b) => a - b);
        const middle = Math.floor(all.length / 2);
        const median = all.length % 2 ? all[middle] : (all[middle - 1] + all[middle]) / 2;
        return r.actual > median;
      }).length,
      tradeCount: teamTrades.length,
      receivedPoints,
      sentPoints,
      netTradePoints: teamTrades.some((t) => t.net !== null)
        ? round(receivedPoints - sentPoints)
        : null,
      tradeStarts: teamTrades.reduce((sum, t) => sum + t.starts, 0),
    };
  });
  return {
    tradeComparisons: normalized.trades,
    completedWeek: source.completedWeek,
    generatedAt: new Date().toISOString(),
    notes: [
      ...source.notes,
      ...(scores.some((s) => s.lineupAvailable === false)
        ? [
            'Some weekly lineup details are unavailable. Positional baselines exclude incomplete lineups; only observed comparable player scores are graded.',
          ]
        : []),
      ...(source.draftPickTrades
        ? [
            `${source.draftPickTrades} trade(s) include draft picks; pick value is excluded from the points comparison.`,
          ]
        : []),
    ],
    teams,
    scores,
    pickups,
    trades,
  };
}
