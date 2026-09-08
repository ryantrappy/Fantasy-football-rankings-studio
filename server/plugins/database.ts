import { definePlugin } from 'nitro';
import mongoose from 'mongoose';

export default definePlugin((app) => {
  app.hooks.hook('close', async () => {
    await mongoose.disconnect();
  });
});
