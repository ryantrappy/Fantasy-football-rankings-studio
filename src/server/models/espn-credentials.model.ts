import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  // Use the subject as the primary key: concurrent upserts cannot create duplicate owners.
  _id: { type: String, required: true },
  encryptedCredentials: { type: String, select: false },
  onboardingComplete: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.models.EspnCredentials || mongoose.model('EspnCredentials', schema);
