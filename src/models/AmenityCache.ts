import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAmenityCache extends Document {
  propertyId: mongoose.Types.ObjectId;
  amenities: Record<string, number | null>;
  createdAt: Date;
  updatedAt: Date;
}

const AmenityCacheSchema: Schema<IAmenityCache> = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, unique: true },
    amenities: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Indexes
AmenityCacheSchema.index({ propertyId: 1 });

const AmenityCache: Model<IAmenityCache> =
  mongoose.models.AmenityCache ||
  mongoose.model<IAmenityCache>('AmenityCache', AmenityCacheSchema);

export default AmenityCache;
