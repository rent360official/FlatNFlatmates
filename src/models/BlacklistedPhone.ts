import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlacklistedPhone extends Document {
    phone: string;
    rejectionReason: string;
    blacklistedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BlacklistedPhoneSchema: Schema = new Schema<IBlacklistedPhone>(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        rejectionReason: {
            type: String,
            required: true,
            trim: true,
        },
        blacklistedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export const BlacklistedPhone: Model<IBlacklistedPhone> =
    mongoose.models.BlacklistedPhone ||
    mongoose.model<IBlacklistedPhone>('BlacklistedPhone', BlacklistedPhoneSchema);
