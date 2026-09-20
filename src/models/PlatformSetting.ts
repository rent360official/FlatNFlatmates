import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformSetting extends Document {
  key: string;
  value: any;
  description?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingSchema: Schema<IPlatformSetting> = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const PlatformSetting: Model<IPlatformSetting> =
  mongoose.models.PlatformSetting ||
  mongoose.model<IPlatformSetting>('PlatformSetting', PlatformSettingSchema);

export default PlatformSetting;
