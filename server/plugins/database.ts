import { logServerError } from '../../src/server/logging.server';
import { definePlugin } from 'nitro';
import mongoose from 'mongoose';
import { connectDatabase } from '../../src/server/database.server';

export default definePlugin((app) => {
  if (process.env.MONGODB_URI)
    void connectDatabase().catch((error) => logServerError('database.startup', error));
  app.hooks.hook('error', (error) => logServerError('runtime', error));
  app.hooks.hook('close', async () => {
    await mongoose.disconnect();
  });
});
