import type { SeasonRecord } from '../../league-summary';
import { summarizeLeague } from '../../league-summary';
import { managerKey, playerName } from './common';
import { playerImpact } from './player-impact';
import { managerArchetypes } from './archetypes';
export interface WrappedRecap {
  year: number;
  title: string;
  scope: 'personal' | 'league';
  highlights: string[];
  coverage: string[];
}
export function buildWrapped(record: SeasonRecord, key = ''): WrappedRecap {
  const { year, data } = record,
    summaries = summarizeLeague([record]);
  const team = data.teams.find((t) => managerKey(year, t) === key),
    summary = summaries.find((s) => s.key === key);
  const highlights: string[] = [],
    coverage = [
      `${year}: through completed week ${data.completedWeek}. Only loaded league evidence is included.`,

      ...(data.partialFailures || []).map((f) => `${f.section}: partial provider coverage`),
    ];
  const matches = data.scores
    .filter((s) => s.week <= data.completedWeek)
    .flatMap((s) => {
      const other = data.scores.find(
        (o) => o.week === s.week && o.teamId === s.opponentTeamId && o.opponentTeamId === s.teamId,
      );
      return other && s.teamId < other.teamId
        ? [{ a: s, b: other, margin: Math.abs(s.actual - other.actual) }]
        : [];
    });
  const name = (id: string) => data.teams.find((t) => t.teamId === id)?.managerName || id;
  const describe = (m: (typeof matches)[number]) =>
    `Week ${m.a.week}: ${name(m.a.teamId)} ${m.a.actual.toFixed(1)} – ${name(m.b.teamId)} ${m.b.actual.toFixed(1)}`;
  if (team && summary) {
    const own = matches.filter((m) => m.a.teamId === team.teamId || m.b.teamId === team.teamId);
    let wins = 0,
      losses = 0,
      ties = 0;
    for (const m of own) {
      const score = m.a.teamId === team.teamId ? m.a : m.b,
        other = score === m.a ? m.b : m.a;
      if (score.actual > other.actual) wins++;
      else if (score.actual < other.actual) losses++;
      else ties++;
    }
    highlights.push(`Record: ${wins}–${losses}–${ties} in ${own.length} verified matchups.`);
    if (summary.luckGames)
      highlights.push(
        `Expected wins: ${summary.expectedWins.toFixed(2)}; luck: ${(summary.actualWins - summary.expectedWins).toFixed(2)} wins across ${summary.luckGames} complete league-score weeks (ties = half win).`,
      );
    const ordered = [...own].sort((a, b) => {
      const value = (m: typeof a) =>
        m.a.teamId === team.teamId ? m.a.actual - m.b.actual : m.b.actual - m.a.actual;
      return value(b) - value(a);
    });
    if (ordered.length)
      highlights.push(
        `Best matchup: ${describe(ordered[0])}.`,
        `Worst matchup: ${describe(ordered.at(-1)!)}.`,
      );
    const rivals = new Map<string, number>();
    for (const m of own) {
      const id = m.a.teamId === team.teamId ? m.b.teamId : m.a.teamId;
      rivals.set(id, (rivals.get(id) || 0) + 1);
    }
    const rival = [...rivals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (rival)
      highlights.push(`Most frequent rivalry: ${name(rival[0])}, ${rival[1]} verified matchups.`);
    const pickup = data.pickups
      .filter((p) => p.teamId === team.teamId && p.lift !== null)
      .sort((a, b) => b.lift! - a.lift!)[0];
    if (pickup)
      highlights.push(
        `Best rated pickup: ${playerName(data, pickup.player)}, ${pickup.lift!.toFixed(1)} average points above ${pickup.baseline}, ${pickup.comparisonWeeks.length} comparison weeks.`,
      );
    if (team.lineupWeeks)
      highlights.push(
        `Lineup choices: ${team.correctStarts}/${team.lineupSlots} correct starts over ${team.lineupWeeks} measured weeks; ${data.scores
          .filter((s) => s.teamId === team.teamId && s.week <= data.completedWeek && s.bestLineup)
          .reduce((sum, s) => sum + s.bestLineup!.points - s.actual, 0)
          .toFixed(1)} points left versus optimal lineups in measured weeks.`,
      );
    const impact = playerImpact([record]).rows.find((r) => r.managerKey === key);
    if (impact)
      highlights.push(
        `${impact.role}: ${impact.player}, ${impact.points.toFixed(1)} points in ${impact.appearances} verified appearances; ${impact.decisive} removal-margin decisive contributions.`,
      );
    const profiles = managerArchetypes([record]).find((r) => r.key === key)?.profiles || [];
    for (const p of profiles) highlights.push(`${p.label}: ${p.evidence}`);
  } else {
    const champion = data.results?.find((r) => r.champion === true);
    if (champion) highlights.push(`Champion: ${name(champion.teamId)}.`);
    const scoring = [...summaries]
      .filter((s) => s.weeks)
      .sort((a, b) => b.totalPoints - a.totalPoints)[0];
    if (scoring)
      highlights.push(
        `Scoring leader: ${scoring.managerName}, ${scoring.totalPoints.toFixed(1)} points in ${scoring.weeks} observed weeks.`,
      );
    const luck = summaries
      .filter((s) => s.luckGames)
      .sort((a, b) => b.actualWins - b.expectedWins - (a.actualWins - a.expectedWins));
    if (luck.length)
      highlights.push(
        `Luck extremes: ${luck[0].managerName} ${(luck[0].actualWins - luck[0].expectedWins).toFixed(2)} wins; ${luck.at(-1)!.managerName} ${(luck.at(-1)!.actualWins - luck.at(-1)!.expectedWins).toFixed(2)} wins above all-play expectation.`,
      );
    const sorted = [...matches].sort((a, b) => a.margin - b.margin);
    if (sorted.length)
      highlights.push(
        `Closest game: ${describe(sorted[0])}.`,
        `Biggest blowout: ${describe(sorted.at(-1)!)}.`,
      );
    const upset = matches
      .filter(
        (m) =>
          m.a.projected !== null &&
          m.b.projected !== null &&
          (m.a.actual - m.b.actual) * (m.a.projected! - m.b.projected!) < 0,
      )
      .sort(
        (a, b) =>
          Math.abs(b.a.projected! - b.b.projected!) - Math.abs(a.a.projected! - a.b.projected!),
      )[0];
    if (upset)
      highlights.push(
        `Projection upset: ${describe(upset)}; projected underdog overcame ${Math.abs(upset.a.projected! - upset.b.projected!).toFixed(1)} projected points.`,
      );
    const pickup = [...data.pickups]
      .filter((p) => p.lift !== null)
      .sort((a, b) => b.lift! - a.lift!)[0];
    if (pickup)
      highlights.push(
        `Pickup highlight: ${name(pickup.teamId)} added ${playerName(data, pickup.player)}, ${pickup.lift!.toFixed(1)} average lift over ${pickup.comparisonWeeks.length} weeks.`,
      );
    const trade = data.tradeComparisons
      .filter((t) => t.verdict === 'leader')
      .sort(
        (a, b) =>
          Math.max(...b.sides.map((s) => s.gain || 0)) -
          Math.max(...a.sides.map((s) => s.gain || 0)),
      )[0];
    if (trade)
      highlights.push(
        `Trade highlight: week ${trade.week}, ${trade.winner ? name(trade.winner) : 'no clear leader'} led the ${trade.weeks.length}-week assessment; limited observation window.`,
      );
    const pairs = new Map<string, { count: number; match: (typeof matches)[number] }>();
    for (const m of matches) {
      const id = `${m.a.teamId}:${m.b.teamId}`,
        r = pairs.get(id) || { count: 0, match: m };
      r.count++;
      pairs.set(id, r);
    }
    const pair = [...pairs.values()].sort((a, b) => b.count - a.count)[0];
    if (pair)
      highlights.push(
        `Rivalry of the year by meeting count: ${name(pair.match.a.teamId)} + ${name(pair.match.b.teamId)}, ${pair.count} matchups.`,
      );
  }
  coverage.push(
    'Unsupported or absent evidence is omitted: historical queues, unavailable rosters, missing matchup projections, unrated moves and unearned archetypes. Matchup highlights require reciprocal opponents; luck requires every team score that week.',
  );
  return {
    year,
    title: team
      ? `${team.managerName}'s ${year} Fantasy Wrapped`
      : `${year} League Fantasy Wrapped`,
    scope: team ? 'personal' : 'league',
    highlights,
    coverage,
  };
}
