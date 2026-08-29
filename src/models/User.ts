import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  profession?: string;
  bio?: string;
  hobbies: string[];
  flatPreferences: string[];
  vibePreferences: string[];
  isFlatmateSearchable: boolean;
  targetLocations: mongoose.Types.ObjectId[];
  role: 'user' | 'owner' | 'super_admin' | 'ops_admin' | 'support_agent' | 'moderator' | 'tester';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  otp?: {
    code: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    profilePhoto: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    age: { type: Number },
    profession: { type: String },
    bio: { type: String },
    hobbies: { type: [String], default: [] },
    flatPreferences: { type: [String], default: [] },
    vibePreferences: { type: [String], default: [] },
    isFlatmateSearchable: { type: Boolean, default: false },
    targetLocations: [{ type: Schema.Types.ObjectId, ref: 'Locality' }],
    role: {
      type: String,
      enum: ['user', 'owner', 'super_admin', 'ops_admin', 'support_agent', 'moderator', 'tester'],
      default: 'user',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ phone: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ isFlatmateSearchable: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
