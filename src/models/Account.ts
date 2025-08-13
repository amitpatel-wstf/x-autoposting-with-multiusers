import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccount extends Document<Types.ObjectId> {
  userId: string; // references User._id as string for simplicity across code
  provider: 'x';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  tokenType?: string;
  // OAuth 1.0a credentials (optional, used for media upload)
  oauthToken?: string;
  oauthTokenSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
  userId: { type: String, required: true, index: true },
  provider: { type: String, required: true, enum: ['x'], index: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  scope: { type: String, default: '' },
  tokenType: { type: String, default: 'bearer' },
  oauthToken: { type: String },
  oauthTokenSecret: { type: String },
}, { timestamps: true });

AccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const Account = mongoose.models.Account || mongoose.model<IAccount>('TwitterAccount', AccountSchema);
