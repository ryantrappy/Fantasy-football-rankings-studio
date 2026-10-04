import mongoose from 'mongoose';
import type { WeeklyRanking } from '../interfaces/weeklyRanking.interface';
interface RankingRevision {
  rankingId: string;
  revision: number;
  savedAt: string;
  ranking: WeeklyRanking;
}
const schema = new mongoose.Schema({
  rankingId: { type: String, required: true },
  revision: { type: Number, required: true, min: 0 },
  savedAt: { type: String, required: true },
  ranking: { type: mongoose.Schema.Types.Mixed, required: true },
});
schema.index({ rankingId: 1, revision: -1 }, { unique: true });
export default (mongoose.models.RankingRevision as mongoose.Model<RankingRevision> | undefined) ||
  mongoose.model<RankingRevision>('RankingRevision', schema);
