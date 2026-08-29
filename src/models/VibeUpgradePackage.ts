import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVibeUpgradePackage extends Document {
  name: string; // e.g. "Minimalist Zen", "Boho Chic"
  description: string;
  accessoryList: string[];
  monthlyAddonAmount: number;
  refundableDepositAmount: number;
  images: string[];
  isActive: boolean;
  cityIds: mongoose.Types.ObjectId[]; // Available in these cities
  createdAt: Date;
  updatedAt: Date;
}

const VibeUpgradePackageSchema: Schema<IVibeUpgradePackage> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    accessoryList: { type: [String], default: [] },
    monthlyAddonAmount: { type: Number, required: true },
    refundableDepositAmount: { type: Number, required: true },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    cityIds: [{ type: Schema.Types.ObjectId, ref: 'City' }],
  },
  { timestamps: true }
);

const VibeUpgradePackage: Model<IVibeUpgradePackage> =
  mongoose.models.VibeUpgradePackage ||
  mongoose.model<IVibeUpgradePackage>('VibeUpgradePackage', VibeUpgradePackageSchema);

export default VibeUpgradePackage;
