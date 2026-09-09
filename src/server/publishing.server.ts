import '@tanstack/react-start/server-only';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import RankingsService from './services/rankings.service';
import { connectDatabase } from './database.server';
import { objectIdSchema, rankingSchema } from './validation';
import HttpException from './exceptions/HttpException';
import type { PublishedEdition, PublicationStatus } from '../publishing';
const schema = new mongoose.Schema({
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
    return found ? status(found) : null;
  },
  async publish(owner: string, input: unknown) {
    const { id, revision } = objectIdSchema
      .extend({ revision: z.number().int().nonnegative() })
      .parse(input);
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
    const result = await publicationModel.findOneAndUpdate(
      { rankingId: id },
      {
        $set: { ranking: snapshot, revision, publishedAt: new Date().toISOString() },
        $setOnInsert: { publicId: randomUUID() },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
    return status(result!);
  },
  async unpublish(owner: string, input: unknown) {
    const { id } = objectIdSchema.parse(input);
    await rankings.getRankingById(id, owner);
    await publicationModel.deleteOne({ rankingId: id });
  },
  async read(input: unknown): Promise<PublishedEdition> {
    const { publicId } = z.object({ publicId: z.string().uuid() }).parse(input);
    await connectDatabase();
    const found = await publicationModel.findOne({ publicId });
    if (!found)
      throw new HttpException(404, 'This edition is not published or its link has been revoked.');
    return { status: status(found), ranking: rankingSchema.parse(found.ranking) };
  },
};
