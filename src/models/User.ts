import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document<string> {
  _id: string; // xUserId from Twitter, use as primary key
  handle: string;
  name: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  handle: { type: String, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, default: null },
}, { timestamps: true, _id: false });

// MongoDB automatically creates an index on _id; do not override.

export const User = mongoose.models.User || mongoose.model<IUser>('TwitterUser', UserSchema);
