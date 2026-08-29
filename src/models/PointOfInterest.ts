import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPointOfInterest extends Document {
  cityId: mongoose.Types.ObjectId;
  localityId?: mongoose.Types.ObjectId;
  name: string;
  type: 'college' | 'office' | 'transit' | 'landmark' | 'other';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PointOfInterestSchema: Schema<IPointOfInterest> = new Schema(
  {
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    localityId: { type: Schema.Types.ObjectId, ref: 'Locality' },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['college', 'office', 'transit', 'landmark', 'other'],
      default: 'landmark',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
PointOfInterestSchema.index({ location: '2dsphere' });
PointOfInterestSchema.index({ cityId: 1, name: 1 }, { unique: true });

const PointOfInterest: Model<IPointOfInterest> =
  mongoose.models.PointOfInterest ||
  mongoose.model<IPointOfInterest>('PointOfInterest', PointOfInterestSchema);

export default PointOfInterest;
