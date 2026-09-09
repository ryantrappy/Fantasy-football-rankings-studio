import '@tanstack/react-start/server-only';
import mongoose from 'mongoose';
import './models/league.model';
import './models/weeklyRanking.model';

let connection: Promise<void> | undefined;
export async function connectDatabase() {
  if (!connection) {
    connection = (async () => {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error('MONGODB_URI is required.');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    })().catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  await connection;
}
