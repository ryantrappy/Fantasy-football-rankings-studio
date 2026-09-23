import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    encryptedCredentials: { type: String, select: false },
  },
  { timestamps: true },
);

type CredentialRecord = mongoose.InferSchemaType<typeof schema>;
export default (mongoose.models.AiCredentials as mongoose.Model<CredentialRecord> | undefined) ||
  mongoose.model<CredentialRecord>('AiCredentials', schema);
