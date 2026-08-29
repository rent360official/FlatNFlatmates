import mongoose, { Schema, Document, Model } from 'mongoose';

export type FeatureStatus = 'disabled' | 'testing' | 'enabled';
export type FeatureCategory = 'feature' | 'system_config';

export interface IFeatureFlag extends Document {
  key: string;
  label: string;
  status: FeatureStatus;
  category: FeatureCategory;
  description?: string;
  // Legacy field kept for backward compat — do not use in new code
  value?: any;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema: Schema<IFeatureFlag> = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ['disabled', 'testing', 'enabled'],
      default: 'disabled',
    },
    category: {
      type: String,
      enum: ['feature', 'system_config'],
      default: 'system_config',
    },
    description: { type: String },
    // Legacy fields — kept so existing documents don't break
    value: { type: Schema.Types.Mixed },
    isActive: { type: Boolean },
  },
  { timestamps: true }
);

const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);

export default FeatureFlag;
