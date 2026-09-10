import mongoose from 'mongoose';
import { League } from '../interfaces/league.interface';

const leagueSchema = new mongoose.Schema(
  {
    leagueId: { type: String, required: true, unique: true },
    providerLeagueId: { type: String },
    leagueName: { type: String, required: true },
    leagueType: { type: Number, enum: [0, 1], required: true },
    seasonId: { type: Number, min: 2000, max: 2100 },
    archived: { type: Boolean, default: false },
    publicReports: { type: Boolean, default: true },
    ownerSubject: { type: String, index: true },
  },
  { timestamps: true },
);

leagueSchema.index(
  { ownerSubject: 1, leagueType: 1, providerLeagueId: 1 },
  { unique: true, partialFilterExpression: { providerLeagueId: { $type: 'string' } } },
);

export default (mongoose.models.League as mongoose.Model<League> | undefined) ||
  mongoose.model<League>('League', leagueSchema);
