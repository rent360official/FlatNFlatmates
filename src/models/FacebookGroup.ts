import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFacebookGroup extends Document {
  localityId: mongoose.Types.ObjectId;
  groupName: string;
  groupUrl: string;
  description?: string;
  memberCount?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacebookGroupSchema: Schema = new Schema<IFacebookGroup>(
  {
    localityId: {
      type: Schema.Types.ObjectId,
      ref: 'Locality',
      required: true,
      unique: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    groupUrl: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    memberCount: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FacebookGroup: Model<IFacebookGroup> =
  mongoose.models.FacebookGroup ||
  mongoose.model<IFacebookGroup>('FacebookGroup', FacebookGroupSchema);

export default FacebookGroup;
