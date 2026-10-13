import { z } from 'zod';
import type { SeasonInsights } from '../../insights';
const id = z.string().min(1).max(200);
export const matchupArchiveSchema = z
  .object({
    week: z.number().int().min(1).max(18),
    teamId: id,
    opponentTeamId: id,
    source: z.string().min(1).max(500),
    preMondayAt: z.string().datetime(),
    snapshots: z
      .array(
        z.object({
          capturedAt: z.string().datetime(),
          probability: z.number().min(0).max(1),
          contributors: z.array(z.object({ playerId: id, points: z.number() })).max(200),
        }),
      )
      .min(1)
      .max(1000),
  })
  .superRefine((archive, ctx) => {
    if (
      archive.teamId === archive.opponentTeamId ||
      archive.snapshots.some(
        (s, i) =>
          i > 0 && Date.parse(s.capturedAt) <= Date.parse(archive.snapshots[i - 1].capturedAt),
      ) ||
      !archive.snapshots.some((s) => s.capturedAt === archive.preMondayAt)
    )
      ctx.addIssue({
        code: 'custom',
        message:
          'Distinct teams, chronological snapshots and an explicit pre-Monday snapshot are required.',
      });
  });
export function importArchive(json: string, data: SeasonInsights) {
  if (json.length > 2_000_000) throw new Error('Archive exceeds 2 MB.');
  const archives = z.array(matchupArchiveSchema).max(1800).parse(JSON.parse(json));
  for (const archive of archives) {
    const score = data.scores.find((s) => s.teamId === archive.teamId && s.week === archive.week);
    const opponent = data.scores.find(
      (s) => s.teamId === archive.opponentTeamId && s.week === archive.week,
    );
    if (
      !score ||
      !opponent ||
      score.week > data.completedWeek ||
      score.opponentTeamId !== opponent.teamId ||
      opponent.opponentTeamId !== score.teamId
    )
      throw new Error(
        'Archive must reference a verified completed matchup in the selected season.',
      );
  }
  return archives;
}
export function mondayComebacks(data: SeasonInsights, threshold = 0.1) {
  return (data.matchupArchive || []).flatMap((archive) => {
    const before = archive.snapshots.find((s) => s.capturedAt === archive.preMondayAt)!;
    const own = data.scores.find((s) => s.teamId === archive.teamId && s.week === archive.week);
    const opponent = data.scores.find(
      (s) => s.teamId === archive.opponentTeamId && s.week === archive.week,
    );
    return own &&
      opponent &&
      own.opponentTeamId === opponent.teamId &&
      opponent.opponentTeamId === own.teamId &&
      own.week <= data.completedWeek &&
      own.actual > opponent.actual &&
      before.probability <= threshold
      ? [
          {
            ...archive,
            probability: before.probability,
            final: `${own.actual}–${opponent.actual}`,
            contributors: archive.snapshots
              .filter((s) => s.capturedAt > archive.preMondayAt)
              .flatMap((s) => s.contributors),
          },
        ]
      : [];
  });
}
