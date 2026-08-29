import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVibeUpgradeRequest extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  otp: string;
  status: 'requested' | 'in_progress' | 'completed' | 'cancelled';
  depositRefundStatus: 'held' | 'released';
  completedByAdminId?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VibeUpgradeRequestSchema: Schema<IVibeUpgradeRequest> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'VibeUpgradePackage', required: true },
    otp: { type: String, required: true },
    status: {
      type: String,
      enum: ['requested', 'in_progress', 'completed', 'cancelled'],
      default: 'requested',
    },
    depositRefundStatus: {
      type: String,
      enum: ['held', 'released'],
      default: 'held',
    },
    completedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const VibeUpgradeRequest: Model<IVibeUpgradeRequest> =
  mongoose.models.VibeUpgradeRequest ||
  mongoose.model<IVibeUpgradeRequest>('VibeUpgradeRequest', VibeUpgradeRequestSchema);

export default VibeUpgradeRequest;
