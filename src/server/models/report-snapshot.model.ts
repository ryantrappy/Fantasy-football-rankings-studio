import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true },
  ownerSubject: { type: String, required: true },
  leagueId: { type: String, required: true, index: true },
  savedAt: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  league: { type: mongoose.Schema.Types.Mixed, required: true },
  report: { type: mongoose.Schema.Types.Mixed, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const reportSnapshotModel =
  mongoose.models.ReportSnapshot || mongoose.model('ReportSnapshot', schema);

export const cleanupExpiredSnapshots = () =>
  reportSnapshotModel.deleteMany({ expiresAt: { $lte: new Date() } });
