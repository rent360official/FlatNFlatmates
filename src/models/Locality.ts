import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocality extends Document {
  cityId: mongoose.Types.ObjectId;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocalitySchema: Schema<ILocality> = new Schema(
  {
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    name: { type: String, required: true },
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
LocalitySchema.index({ location: '2dsphere' });
LocalitySchema.index({ cityId: 1, name: 1 }, { unique: true });

const Locality: Model<ILocality> = mongoose.models.Locality || mongoose.model<ILocality>('Locality', LocalitySchema);
export default Locality;
