import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPropertyInquiry extends Document {
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userPhone?: string;
  inquiryType: 'call' | 'whatsapp' | 'sms_interested';
  smsStatus?: 'sent' | 'skipped_feature_disabled' | 'failed' | 'mocked' | 'n/a';
  smsResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyInquirySchema: Schema<IPropertyInquiry> = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    userPhone: { type: String },
    inquiryType: {
      type: String,
      enum: ['call', 'whatsapp', 'sms_interested'],
      required: true,
      index: true,
    },
    smsStatus: {
      type: String,
      enum: ['sent', 'skipped_feature_disabled', 'failed', 'mocked', 'n/a'],
      default: 'n/a',
    },
    smsResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

PropertyInquirySchema.index({ propertyId: 1, inquiryType: 1 });
PropertyInquirySchema.index({ ownerId: 1, createdAt: -1 });

const PropertyInquiry: Model<IPropertyInquiry> =
  mongoose.models.PropertyInquiry || mongoose.model<IPropertyInquiry>('PropertyInquiry', PropertyInquirySchema);

export default PropertyInquiry;
