import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document<string> {
  userId: string; // User _id (x user id string)
  name: string;
  cron: string;
  text?: string;
  mediaPath?: string;
  mediaType?: string;
  enabled: boolean;
  lastRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  cron: { type: String, required: true },
  text: { type: String },
  mediaPath: { type: String },
  mediaType: { type: String },
  enabled: { type: Boolean, default: true, index: true },
  lastRunAt: { type: Date, default: null },
}, { timestamps: true });

export const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('TwitterSchedule', ScheduleSchema);
