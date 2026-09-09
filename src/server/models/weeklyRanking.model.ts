import mongoose from 'mongoose';
import { WeeklyRanking } from '../interfaces/weeklyRanking.interface';

const teamRankingSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },
    teamId: { type: String, required: true },
    description: { type: String, default: '' },
    managerName: { type: String, default: '' },
    position: { type: Number, required: true, min: 1 },
    wins: { type: Number, default: 0, min: 0 },
    loss: { type: Number, default: 0, min: 0 },
    ties: { type: Number, default: 0, min: 0 },
    delta: { type: Number, default: 0 },
  },
  { _id: false },
);

const weeklyRankingSchema = new mongoose.Schema(
  {
    revision: { type: Number, default: 0, min: 0 },
    rankingsTitle: { type: String, required: true },
    introduction: { type: String, default: '' },
    leagueId: { type: String, required: true },
    week: { type: Number, required: true, min: 1, max: 18 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    teams: { type: [teamRankingSchema], required: true },
  },
  { timestamps: true },
);
weeklyRankingSchema.index({ leagueId: 1, year: 1, week: 1 }, { unique: true });
export default (mongoose.models.Ranking as mongoose.Model<WeeklyRanking> | undefined) ||
  mongoose.model<WeeklyRanking>('Ranking', weeklyRankingSchema);
