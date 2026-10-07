import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    capturedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    projection: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { minimize: false },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const seasonProjectionCacheModel =
  mongoose.models.SeasonProjectionCache || mongoose.model('SeasonProjectionCache', schema);
