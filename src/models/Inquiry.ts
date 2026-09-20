import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInquiry extends Document {
  type: 'inquiry' | 'report';
  contactInfo: string;
  name?: string;
  propertyId?: mongoose.Types.ObjectId;
  propertyTitle?: string;
  reporterUserId?: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  userIp?: string;
  targetEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema: Schema<IInquiry> = new Schema(
  {
    type: {
      type: String,
      enum: ['inquiry', 'report'],
      default: 'inquiry',
      index: true,
    },
    contactInfo: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
    propertyTitle: { type: String, trim: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      default: 'general_inquiry',
      required: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
    userIp: { type: String },
    targetEmail: { type: String, default: 'rent360official@gmail.com' },
  },
  { timestamps: true }
);

InquirySchema.index({ status: 1 });
InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ reason: 1 });
InquirySchema.index({ type: 1, createdAt: -1 });

const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);

export default Inquiry;
