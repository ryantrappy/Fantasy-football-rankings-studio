import type { SeasonRecord } from '../../league-summary';
import { matchupRecords } from './records';
interface Archive {
  week: number;
  teamId: string;
  opponentTeamId: string;
  source: string;
  preMondayAt: string;
  snapshots: { capturedAt: string; probability: number }[];
}
export function weeklyPain(records: SeasonRecord[]) {
  return matchupRecords(records).flatMap((g) => {
    if (g.margin === 0 || g.weeks.length !== 1) return [];
    const record = records.find((r) => r.year === g.year)!;
    const scores = record.data.scores.filter((s) => s.week === g.week && Number.isFinite(s.actual));
    const complete = g.aRank !== null;
    const peers = scores.filter((s) => s.teamId !== g.loser.teamId),
      opponentPeers = scores.filter((s) => s.teamId !== g.winner.teamId);
    const percentile = (points: number, rows: typeof scores) =>
      rows.reduce((n, s) => n + (points > s.actual ? 1 : points === s.actual ? 0.5 : 0), 0) /
      rows.length;
    const closeness = 1 - Math.min(1, g.margin / Math.max(1, Math.abs(g.winner.points)));
    const scoring = complete && peers.length ? percentile(g.loser.points, peers) : null;
    const opponent =
      complete && opponentPeers.length ? percentile(g.winner.points, opponentPeers) : null;
    // Optional archive shape is shared with the moments feature; never infer it from final box scores.
    const archives =
      (record.data as typeof record.data & { matchupArchive?: Archive[] }).matchupArchive ?? [];
    const archive = archives.find(
      (a) =>
        a.week === g.week &&
        a.teamId === g.loser.teamId &&
        a.opponentTeamId === g.winner.teamId &&
        a.source.trim() &&
        a.snapshots.some(
          (s) =>
            s.capturedAt === a.preMondayAt &&
            Number.isFinite(s.probability) &&
            s.probability >= 0 &&
            s.probability <= 1,
        ),
    );
    const late =
      archive?.snapshots.find((s) => s.capturedAt === archive.preMondayAt)?.probability ?? null;
    const components = [
      { name: 'Closeness', value: closeness, weight: 0.3 },
      ...(scoring == null ? [] : [{ name: 'Scoring percentile', value: scoring, weight: 0.3 }]),
      ...(opponent == null ? [] : [{ name: 'Opponent percentile', value: opponent, weight: 0.2 }]),
      ...(late == null
        ? []
        : [{ name: 'Archived pre-Monday expectation', value: late, weight: 0.2 }]),
    ];
    const cohort = `${complete ? 'Full weekly scoring' : 'Margin only'}${late == null ? ' · no late archive' : ' · archived expectation'}`;
    const score =
      (components.reduce((n, c) => n + c.value * c.weight, 0) /
        components.reduce((n, c) => n + c.weight, 0)) *
      100;
    return [
      {
        ...g,
        key: g.loser.key,
        name: g.loser.name,
        score,
        components,
        cohort,
        late,
        archiveSource: archive?.source ?? null,
        archiveTime: archive?.preMondayAt ?? null,
        scoringRank: g.loser === g.a ? g.aRank : g.bRank,
        opponentRank: g.winner === g.a ? g.aRank : g.bRank,
      },
    ];
  });
}
