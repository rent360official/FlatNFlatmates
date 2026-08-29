import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommuteCache extends Document {
  propertyId: mongoose.Types.ObjectId;
  destLat: number;
  destLng: number;
  distanceKm: number;
  durationMin: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommuteCacheSchema: Schema<ICommuteCache> = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    destLat: { type: Number, required: true },
    destLng: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },
  },
  { timestamps: true }
);

// Indexes
CommuteCacheSchema.index({ propertyId: 1, destLat: 1, destLng: 1 }, { unique: true });

const CommuteCache: Model<ICommuteCache> =
  mongoose.models.CommuteCache ||
  mongoose.model<ICommuteCache>('CommuteCache', CommuteCacheSchema);

export default CommuteCache;
