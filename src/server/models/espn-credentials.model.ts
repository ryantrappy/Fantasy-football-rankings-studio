import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    // Use the subject as the primary key: concurrent upserts cannot create duplicate owners.
    _id: { type: String, required: true },
    encryptedCredentials: { type: String, select: false },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);
type CredentialRecord = mongoose.InferSchemaType<typeof schema>;
export default (mongoose.models.EspnCredentials as mongoose.Model<CredentialRecord> | undefined) ||
  mongoose.model<CredentialRecord>('EspnCredentials', schema);
