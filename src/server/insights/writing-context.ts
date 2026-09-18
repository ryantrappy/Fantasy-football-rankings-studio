import type { InsightsSource } from '../../insights';
import type { WritingContext } from '../../writing';
import { calculateInsights } from './calculate';
import { average, summarizeLeague } from '../../league-summary';
const n = (value: number) => value.toFixed(1);
export function buildWritingContext(
  source: InsightsSource,
  teamId: string,
  year: number,
  week: number,
): WritingContext {
  const throughWeek = Math.min(week, source.completedWeek);
  const clipped = {
    ...source,
    completedWeek: throughWeek,
    scores: source.scores.filter((s) => s.week <= throughWeek),
    moves: source.moves.filter((m) => m.week <= throughWeek),
    results: throughWeek < source.completedWeek ? undefined : source.results,
  };
  const data = calculateInsights(clipped),
    team = data.teams.find((t) => t.teamId === teamId);
  if (!team) throw new Error('Selected team was not found in this season.');
  const row = summarizeLeague([{ year, data }]).find(
    (r) => r.key === (team.managerKey || `unidentified:${year}:${teamId}`),
  )!;
  const scores = clipped.scores.filter((s) => s.teamId === teamId).sort((a, b) => a.week - b.week);
  const facts: string[] = [];
  if (row.weeks) {
    facts.push(
      `${row.weeks} observed weeks; ${n(row.totalPoints / row.weeks)} average points; ${row.aboveMedian} weeks above the league median.`,
    );
    const relative = average(row.medianPercentTotal, row.medianWeeks);
    if (relative !== null)
      facts.push(
        `${n(relative)}% average versus the weekly league median (${row.medianWeeks} measured weeks).`,
      );
    const recent = scores.slice(-3),
      prior = scores.slice(0, -3);
    facts.push(`Recent scores: ${recent.map((s) => `W${s.week} ${n(s.actual)}`).join(', ')}.`);
    if (prior.length)
      facts.push(
        `Last ${recent.length} weeks averaged ${n(recent.reduce((v, s) => v + s.actual, 0) / recent.length)} points versus ${n(prior.reduce((v, s) => v + s.actual, 0) / prior.length)} in earlier weeks.`,
      );
  } else facts.push('No completed scoring weeks are available yet.');
  for (const trade of data.tradeComparisons
    .filter((t) => t.verdict === 'leader' || t.verdict === 'close')
    .slice(0, 30)) {
    const side = trade.sides.find((s) => s.teamId === teamId);
    if (side?.gain != null)
      facts.push(
        `W${trade.week} trade: received ${side.received.join(', ') || 'no players'}; sent ${side.sent.join(', ') || 'no players'}; ${n(side.gain)} points/week net positional gain over ${trade.weeks.length} shared weeks (${trade.verdict}).`,
      );
  }
  const pickups = data.pickups
    .filter((p) => p.teamId === teamId && p.lift !== null)
    .sort((a, b) => Math.abs(b.lift!) - Math.abs(a.lift!))
    .slice(0, 8);
  for (const pickup of pickups)
    facts.push(
      `W${pickup.week} pickup ${pickup.player}: ${n(pickup.lift!)} points/start versus ${pickup.baseline}, ${pickup.comparisonWeeks.length} compared starts.`,
    );
  const roster = source.rosterSnapshot?.teams.find((entry) => entry.teamId === teamId);
  const positions = new Map<string, { starters: string[]; bench: string[] }>();
  for (const group of ['starters', 'bench'] as const) {
    for (const playerId of roster?.[group] || []) {
      const position = source.playerPositions?.[playerId] || 'Other';
      const bucket = positions.get(position) || { starters: [], bench: [] };
      bucket[group].push(source.playerNames[playerId] || playerId);
      positions.set(position, bucket);
    }
  }
  return {
    teamName: team.teamName,
    year,
    throughWeek,
    facts,
    depth: [...positions]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([position, players]) =>
          `${position}: starters — ${players.starters.join(', ') || 'none'}; bench — ${players.bench.join(', ') || 'none'}.`,
      ),
    depthSnapshotAt: roster ? source.rosterSnapshot?.capturedAt : undefined,
    depthNote: roster
      ? 'This is latest roster ownership, not ownership at the selected ranking week. It is not an injury report or projection.'
      : source.rosterSnapshot
        ? 'The latest roster snapshot did not include this team, so current depth claims are omitted.'
        : source.rosterSnapshotNote ||
          'Historical roster ownership is unavailable; current ownership was not substituted.',
    notes: [
      'Context ends at the selected ranking week or latest completed week, whichever is earlier. No future scoring is included.',
      'Trade/pickup grades use short post-move windows and positional baselines. They do not value dynasty assets or predict future results.',
    ],
  };
}
