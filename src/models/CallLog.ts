import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallLog extends Document {
  callerUserId: mongoose.Types.ObjectId;
  calleeUserId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  providerCallSid: string;
  recordingUrl?: string;
  transcript?: string;
  detectedAvailability?: 'available' | 'rented' | 'unknown';
  startedAt: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema: Schema<ICallLog> = new Schema(
  {
    callerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    calleeUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    providerCallSid: { type: String, required: true, unique: true },
    recordingUrl: { type: String },
    transcript: { type: String },
    detectedAvailability: {
      type: String,
      enum: ['available', 'rented', 'unknown'],
      default: 'unknown',
    },
    startedAt: { type: Date, required: true },
    duration: { type: Number },
  },
  { timestamps: true }
);

const CallLog: Model<ICallLog> =
  mongoose.models.CallLog || mongoose.model<ICallLog>('CallLog', CallLogSchema);

export default CallLog;
