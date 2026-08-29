import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlatmatePreferences extends Document {
  userId: mongoose.Types.ObjectId;
  userType?: 'Student' | 'Professional' | 'Retired';
  profession?: 'Government Job' | 'Corporate Job' | 'Self Employed' | 'Others';
  shift?: 'Day Shift' | 'Night Shift';
  socialType?: 'Socializing' | 'Reserved';
  gymGuy?: 'Not at all' | 'Maybe' | 'Definitely';
  outsideEater?: 'Too much' | 'Only evening small snacks' | 'No, only homemade foodie';
  createdAt: Date;
  updatedAt: Date;
}

const FlatmatePreferencesSchema: Schema<IFlatmatePreferences> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userType: { type: String, enum: ['Student', 'Professional', 'Retired'] },
    profession: { type: String, enum: ['Government Job', 'Corporate Job', 'Self Employed', 'Others'] },
    shift: { type: String, enum: ['Day Shift', 'Night Shift'] },
    socialType: { type: String, enum: ['Socializing', 'Reserved'] },
    gymGuy: { type: String, enum: ['Not at all', 'Maybe', 'Definitely'] },
    outsideEater: {
      type: String,
      enum: ['Too much', 'Only evening small snacks', 'No, only homemade foodie'],
    },
  },
  { timestamps: true }
);

// Index
FlatmatePreferencesSchema.index({ userId: 1 });

const FlatmatePreferences: Model<IFlatmatePreferences> =
  mongoose.models.FlatmatePreferences ||
  mongoose.model<IFlatmatePreferences>('FlatmatePreferences', FlatmatePreferencesSchema);

export default FlatmatePreferences;
