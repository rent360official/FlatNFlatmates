import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  entityType: 'User' | 'Property' | 'VibeUpgradeRequest' | 'City' | 'Locality' | 'PointOfInterest' | 'FeatureFlag';
  entityId: mongoose.Types.ObjectId;
  beforeState?: Schema.Types.Mixed;
  afterState?: Schema.Types.Mixed;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      required: true,
      enum: ['User', 'Property', 'VibeUpgradeRequest', 'City', 'Locality', 'PointOfInterest', 'FeatureFlag'],
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    beforeState: { type: Schema.Types.Mixed },
    afterState: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

// Indexes
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
