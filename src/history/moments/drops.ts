import type { SeasonInsights } from '../../insights';
export function droppedBreakouts(data: SeasonInsights, window = 3) {
  const size = Math.max(1, Math.min(6, Math.floor(window)));
  const observed = (playerId: string, week: number) => {
    const points = data.scores
      .filter((s) => s.week === week)
      .flatMap((s) => [...(s.players || []), ...s.starters])
      .filter((p) => p.playerId === playerId)
      .map((p) => p.points);
    return points.length && points.every((p) => p === points[0]) ? points[0] : null;
  };
  return (data.moves || [])
    .filter((m) => m.type === 'drop' && m.from)
    .map((drop) => {
      const future = Array.from({ length: size }, (_, i) => drop.week + i + 1);
      const before = Array.from({ length: 3 }, (_, i) => drop.week - i - 1)
        .filter((w) => w >= (data.reportingStartWeek || 1))
        .map((w) => observed(drop.playerId, w))
        .filter((p): p is number => p !== null);
      const output = future.map((week) => ({
        week,
        points: week <= data.completedWeek ? observed(drop.playerId, week) : null,
      }));
      const baseline =
        before.length >= 2 ? before.reduce((sum, p) => sum + p, 0) / before.length : null;
      const complete = output.every((p) => p.points !== null);
      const total = complete ? output.reduce((sum, p) => sum + p.points!, 0) : null;
      const next = (data.moves || [])
        .filter((m) => m.playerId === drop.playerId && m.timestamp > drop.timestamp)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      return {
        drop,
        output,
        baseline,
        baselineWeeks: before.length,
        total,
        lift: total !== null && baseline !== null ? total - baseline * size : null,
        complete,
        availability:
          next?.type === 'pickup' && next.to
            ? `Observed pickup by ${next.to} on ${new Date(next.timestamp).toISOString()}; availability between recorded events is unknown.`
            : 'No subsequent pickup observed; continued free-agent availability is unknown.',
      };
    });
}
