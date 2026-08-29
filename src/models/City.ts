import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICity extends Document {
  name: string;
  state: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema: Schema<ICity> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const City: Model<ICity> = mongoose.models.City || mongoose.model<ICity>('City', CitySchema);
export default City;
