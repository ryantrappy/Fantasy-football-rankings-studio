import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  provider: { type: String, enum: ['Sleeper', 'ESPN'], required: true },
  providerLeagueId: { type: String, required: true },
  season: { type: Number, required: true },
  completedWeek: { type: Number, required: true },
  capturedAt: { type: Date, required: true },
  schemaVersion: { type: Number, required: true },
  modelVersion: { type: String, required: true },
  inputs: { type: mongoose.Schema.Types.Mixed, required: true },
  forecast: { type: mongoose.Schema.Types.Mixed, required: true },
});

schema.index({ provider: 1, providerLeagueId: 1, season: 1, completedWeek: 1 }, { unique: true });

export const playoffForecastArchiveModel =
  mongoose.models.PlayoffForecastArchive || mongoose.model('PlayoffForecastArchive', schema);
