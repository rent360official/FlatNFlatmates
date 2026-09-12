import mongoose, { Schema, Document, Model } from 'mongoose';

export type DemandEventType = 'flat_search' | 'flatmate_search' | 'property_view' | 'seeker_view';

export interface IDemandEvent extends Document {
  type: DemandEventType;
  
  // Search parameters for flat and flatmate searches
  searchParams?: {
    searchType?: 'flat' | 'flatmate';
    searchIntent?: string; // e.g. 'ROOMMATE_WITH_FLAT' | 'FLATMATE_ONLY'
    localityName?: string;
    searchAreaLabel?: string;
    coordinates?: [number, number]; // [lng, lat]
    distance?: number; // in meters
    bhkConfig?: string;
    minRent?: number;
    maxRent?: number;
    furnishingStatus?: string;
    tenantPreference?: string;
    zeroBrokerage?: boolean;
    pois?: string[];
    
    // Flatmate specific preferences
    flatmatePreferences?: {
      userType?: string;
      profession?: string;
      shift?: string;
      socialType?: string;
      gymGuy?: string;
      outsideEater?: string;
      gender?: string;
      cleanliness?: string;
      foodPreference?: string;
    };
    
    // Additional property filter flags
    moreFilters?: {
      availableFromToday?: boolean;
      petPolicy?: string;
      parkingType?: string;
      powerBackup?: string;
      waterSupplyType?: string;
      evCharging?: boolean;
      fiberAvailable?: boolean;
      isVerifiedOnly?: boolean;
    };
  };

  // View targets for listing or profile views
  viewTarget?: {
    propertyId?: mongoose.Types.ObjectId;
    seekerId?: mongoose.Types.ObjectId;
    propertyTitle?: string;
    localityId?: mongoose.Types.ObjectId;
    localityName?: string;
    bhkConfig?: string;
    rentAmount?: number;
    furnishingStatus?: string;
    tenantType?: string;
  };

  resultsCount?: number;
  userId?: mongoose.Types.ObjectId;
  userRole?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DemandEventSchema: Schema = new Schema<IDemandEvent>(
  {
    type: {
      type: String,
      enum: ['flat_search', 'flatmate_search', 'property_view', 'seeker_view'],
      required: true,
      index: true,
    },
    searchParams: {
      searchType: { type: String },
      searchIntent: { type: String },
      localityName: { type: String, index: true },
      searchAreaLabel: { type: String, index: true },
      coordinates: { type: [Number] },
      distance: { type: Number },
      bhkConfig: { type: String, index: true },
      minRent: { type: Number },
      maxRent: { type: Number, index: true },
      furnishingStatus: { type: String },
      tenantPreference: { type: String },
      zeroBrokerage: { type: Boolean },
      pois: [{ type: String }],
      flatmatePreferences: {
        userType: { type: String },
        profession: { type: String },
        shift: { type: String },
        socialType: { type: String },
        gymGuy: { type: String },
        outsideEater: { type: String },
        gender: { type: String },
        cleanliness: { type: String },
        foodPreference: { type: String },
      },
      moreFilters: {
        availableFromToday: { type: Boolean },
        petPolicy: { type: String },
        parkingType: { type: String },
        powerBackup: { type: String },
        waterSupplyType: { type: String },
        evCharging: { type: Boolean },
        fiberAvailable: { type: Boolean },
        isVerifiedOnly: { type: Boolean },
      },
    },
    viewTarget: {
      propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
      seekerId: { type: Schema.Types.ObjectId, ref: 'User' },
      propertyTitle: { type: String },
      localityId: { type: Schema.Types.ObjectId, ref: 'Locality' },
      localityName: { type: String, index: true },
      bhkConfig: { type: String },
      rentAmount: { type: Number },
      furnishingStatus: { type: String },
      tenantType: { type: String },
    },
    resultsCount: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userRole: { type: String },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytical queries
DemandEventSchema.index({ type: 1, timestamp: -1 });
DemandEventSchema.index({ 'searchParams.localityName': 1, timestamp: -1 });
DemandEventSchema.index({ 'viewTarget.localityName': 1, timestamp: -1 });
DemandEventSchema.index({ 'searchParams.bhkConfig': 1, timestamp: -1 });
DemandEventSchema.index({ 'searchParams.maxRent': 1, timestamp: -1 });

export const DemandEvent: Model<IDemandEvent> =
  mongoose.models.DemandEvent ||
  mongoose.model<IDemandEvent>('DemandEvent', DemandEventSchema);

export default DemandEvent;
