import '@tanstack/react-start/server-only';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import leagueModel from './models/league.model';
import rankingModel from './models/weeklyRanking.model';
import RankingsService from './services/rankings.service';
import { connectDatabase } from './database.server';
import { objectIdSchema, rankingSchema } from './validation';
import HttpException from './exceptions/HttpException';
import type { PublishedEdition, PublicationStatus } from '../publishing';
const schema = new mongoose.Schema({
  decision: { type: Number, min: 0 },
  revoked: { type: Boolean, default: false },
  rankingId: { type: String, required: true, unique: true },
  publicId: { type: String, required: true, unique: true },
  publishedAt: { type: String, required: true },
  revision: { type: Number, required: true },
  ranking: { type: mongoose.Schema.Types.Mixed, required: true },
});
export const publicationModel =
  mongoose.models.Publication || mongoose.model('Publication', schema);
const rankings = new RankingsService();
const status = (value: PublicationStatus): PublicationStatus => ({
  publicId: value.publicId,
  publishedAt: value.publishedAt,
  revision: value.revision,
});
export const publishing = {
  async status(owner: string, input: unknown) {
    const { id } = objectIdSchema.parse(input);
    await rankings.getRankingById(id, owner);
    const found = await publicationModel.findOne({ rankingId: id });
    return found && !found.revoked && found.ranking ? status(found) : null;
  },
  async publish(owner: string, input: unknown) {
    const { id, revision } = objectIdSchema
      .extend({ revision: z.number().int().nonnegative() })
      .parse(input);
    // Capture the decision before any draft/provider authorization reads can delay this request.
    const previous = await publicationModel.findOne({ rankingId: id }).lean();
    const saved = await rankings.getRankingById(id, owner);
    if ((saved.revision ?? 0) !== revision)
      throw new HttpException(
        409,
        'The edition changed before publishing. Reload and review it first.',
      );
    // Explicit allowlist strips database metadata and client-only fields.
    const snapshot = rankingSchema.parse({
      leagueId: saved.leagueId,
      year: saved.year,
      week: saved.week,
      rankingsTitle: saved.rankingsTitle,
      introduction: saved.introduction,
      teams: saved.teams.map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName,
        managerName: t.managerName,
        wins: t.wins,
        loss: t.loss,
        ties: t.ties,
        description: t.description,
        position: t.position,
      })),
    });
    let result;
    try {
      result = await publicationModel.findOneAndUpdate(
        { rankingId: id, decision: previous?.decision ?? { $exists: false } },
        {
          $set: {
            ranking: snapshot,
            revision,
            publishedAt: new Date().toISOString(),
            revoked: false,
          },
          $inc: { decision: 1 },
          $setOnInsert: { publicId: randomUUID() },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000)
        throw error;
    }
    if (!result)
      throw new HttpException(
        409,
        'A newer publish or unpublish decision was saved. Reload publication status and review before publishing again.',
      );
    await rankings.leagueService.verifyWrite(saved.leagueId, owner, () =>
      publicationModel.deleteOne({ rankingId: id }),
    );
    return status(result!);
  },
  async unpublish(owner: string, input: unknown) {
    const { id } = objectIdSchema.parse(input);
    await rankings.getRankingById(id, owner);
    await publicationModel.findOneAndUpdate(
      { rankingId: id },
      { $set: { revoked: true, publicId: randomUUID() }, $inc: { decision: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
  },
  async read(input: unknown): Promise<PublishedEdition> {
    const { publicId } = z.object({ publicId: z.string().uuid() }).parse(input);
    await connectDatabase();
    const found = await publicationModel.findOne({ publicId });
    if (!found || found.revoked || !found.ranking)
      throw new HttpException(404, 'This edition is not published or its link has been revoked.');
    const source = await rankingModel.findById(found.rankingId).select('leagueId').lean();
    if (
      !source ||
      !(await leagueModel.exists({ leagueId: source.leagueId, deleted: { $ne: true } }))
    )
      throw new HttpException(
        404,
        'This edition is unavailable because its source workspace was deleted.',
      );
    return { status: status(found), ranking: rankingSchema.parse(found.ranking) };
  },
};
