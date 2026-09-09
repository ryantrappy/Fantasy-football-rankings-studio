import { logServerError } from '../../src/server/logging.server';
import { definePlugin } from 'nitro';
import mongoose from 'mongoose';

export default definePlugin((app) => {
  app.hooks.hook('error', (error) => logServerError('runtime', error));
  app.hooks.hook('close', async () => {
    await mongoose.disconnect();
  });
});
