import type { SeasonInsights } from './insights';
import { average, percentage, summarizeLeague } from './league-summary';
export interface DraftPick {
  player_id: string;
  roster_id: number;
  pick_no: number;
  metadata?: { first_name?: string; last_name?: string; position?: string };
}
export interface DraftMiss {
  picked: string;
  alternative: string;
  pick: number;
  alternativePick: number;
  gap: number;
  weeks: number;
}
export function draftMisses(data: SeasonInsights, teamId: string, picks: DraftPick[]): DraftMiss[] {
  const observed = (id: string, week: number) => {
    const values = data.scores
      .filter((s) => s.week === week && s.week <= data.completedWeek)
      .flatMap((s) => s.players || s.starters)
      .filter((p) => p.playerId === id)
      .map((p) => p.points)
      .filter(Number.isFinite);
    return values.length && values.every((v) => v === values[0]) ? values[0] : null;
  };
  const name = (p: DraftPick) =>
    [p.metadata?.first_name, p.metadata?.last_name].filter(Boolean).join(' ') ||
    `Player ${p.player_id}`;
  return picks
    .filter((p) => String(p.roster_id) === teamId && p.metadata?.position)
    .flatMap((pick) => {
      const candidates = picks.filter(
        (p) =>
          p.pick_no > pick.pick_no &&
          p.pick_no <= pick.pick_no + 12 &&
          p.metadata?.position === pick.metadata?.position,
      );
      const comparisons = candidates
        .map((alternative) => {
          const rows = Array.from({ length: data.completedWeek }, (_, i) => i + 1)
            .map((week) => ({
              a: observed(pick.player_id, week),
              b: observed(alternative.player_id, week),
            }))
            .filter((r) => r.a !== null && r.b !== null);
          return {
            picked: name(pick),
            alternative: name(alternative),
            pick: pick.pick_no,
            alternativePick: alternative.pick_no,
            gap: rows.length ? rows.reduce((sum, r) => sum + r.b! - r.a!, 0) / rows.length : 0,
            weeks: rows.length,
          };
        })
        .filter((r) => r.weeks >= 4 && r.gap > 2)
        .sort((a, b) => b.gap - a.gap);
      return comparisons.slice(0, 1);
    })
    .sort((a, b) => b.gap - a.gap);
}
export function managerSeasonEvidence(data: SeasonInsights, teamId: string, year: number) {
  const team = data.teams.find((t) => t.teamId === teamId);
  if (!team) throw new Error('Manager team was not found in this season.');
  const row = summarizeLeague([{ year, data: { ...data, teams: data.teams } }]).find(
    (r) => r.key === (team.managerKey || `unidentified:${year}:${teamId}`),
  )!;
  const scores = data.scores.filter((s) => s.teamId === teamId && s.week <= data.completedWeek);
  const poorWeeks = scores
    .flatMap((score) => {
      const peers = data.scores
        .filter((s) => s.week === score.week)
        .map((s) => s.actual)
        .sort((a, b) => a - b);
      const mid = Math.floor(peers.length / 2),
        median = peers.length % 2 ? peers[mid] : (peers[mid - 1] + peers[mid]) / 2;
      return score.actual < median
        ? [{ week: score.week, points: score.actual, median, deficit: median - score.actual }]
        : [];
    })
    .sort((a, b) => b.deficit - a.deficit);
  const trades = data.tradeComparisons
    .flatMap((t) => {
      const side = t.sides.find((s) => s.teamId === teamId);
      return (t.verdict === 'leader' || t.verdict === 'close') &&
        side?.gain != null &&
        side.gain < 0
        ? [
            {
              id: t.id,
              week: t.week,
              gain: side.gain,
              received: side.received,
              sent: side.sent,
              weeks: t.weeks.length,
              verdict: t.verdict,
            },
          ]
        : [];
    })
    .sort((a, b) => a.gain - b.gain);
  const pickups = data.pickups
    .filter((p) => p.teamId === teamId && p.lift != null && p.lift < 0)
    .map((p) => ({
      id: p.id,
      player: p.player,
      week: p.week,
      lift: p.lift!,
      baseline: p.baseline,
      starts: p.comparisonWeeks.length,
    }))
    .sort((a, b) => a.lift - b.lift);
  return {
    year,
    teamName: team.teamName,
    weeks: row.weeks,
    belowMedian: poorWeeks.length,
    allPlay: percentage(row.allPlayWins, row.allPlayGames),
    vsMedian: average(row.medianPercentTotal, row.medianWeeks),
    actualWins: row.actualWins,
    games: row.luckGames,
    losses: row.luckGames ? row.luckGames - row.actualWins : null,
    playoff: row.playoffSeasons ? row.playoffAppearances > 0 : null,
    finish: average(row.finishTotal, row.finishSeasons),
    gradedTrades: row.gradedTrades,
    ratedPickups: row.ratedPickups,
    poorWeeks,
    trades,
    pickups,
  };
}
export interface ManagerReport {
  generatedAt: string;
  seasons: (ReturnType<typeof managerSeasonEvidence> & {
    leagueId: string;
    draftMisses: DraftMiss[];
    draftNote?: string;
  })[];
  errors: { year: number; message: string }[];
  attempted: number;
}
