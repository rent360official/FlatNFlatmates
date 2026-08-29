import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlatmateProfileListing extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId; // Optional - only if they already have a property
  budgetMin: number;
  budgetMax: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlatmateProfileListingSchema: Schema<IFlatmateProfileListing> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
FlatmateProfileListingSchema.index({ isActive: 1 });
FlatmateProfileListingSchema.index({ propertyId: 1 });

const FlatmateProfileListing: Model<IFlatmateProfileListing> =
  mongoose.models.FlatmateProfileListing ||
  mongoose.model<IFlatmateProfileListing>('FlatmateProfileListing', FlatmateProfileListingSchema);

export default FlatmateProfileListing;
