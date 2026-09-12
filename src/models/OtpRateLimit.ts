import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtpRateLimit extends Document {
  phone: string;
  ip?: string;
  lastRequestedAt: Date;
  hourlyCount: number;
  hourlyWindowStart: Date;
  dailyCount: number;
  dailyWindowStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpRateLimitSchema: Schema = new Schema<IOtpRateLimit>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    ip: {
      type: String,
      index: true,
      trim: true,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
    hourlyCount: {
      type: Number,
      default: 1,
    },
    hourlyWindowStart: {
      type: Date,
      default: Date.now,
    },
    dailyCount: {
      type: Number,
      default: 1,
    },
    dailyWindowStart: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge rate limit documents after 48 hours
OtpRateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

export const OtpRateLimit: Model<IOtpRateLimit> =
  mongoose.models.OtpRateLimit ||
  mongoose.model<IOtpRateLimit>('OtpRateLimit', OtpRateLimitSchema);

export default OtpRateLimit;
