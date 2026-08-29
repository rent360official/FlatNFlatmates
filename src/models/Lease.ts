import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILease extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  status: 'active' | 'expired' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

const LeaseSchema: Schema<ILease> = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated'],
      default: 'active',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
LeaseSchema.index({ tenantId: 1, status: 1 });
LeaseSchema.index({ propertyId: 1 });

const Lease: Model<ILease> = mongoose.models.Lease || mongoose.model<ILease>('Lease', LeaseSchema);
export default Lease;
