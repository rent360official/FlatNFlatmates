import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProperty extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  rentAmount: number;
  depositAmount: number;
  maintenanceAmount: number;
  bhkConfig: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK+';
  propertyType: 'apartment' | 'house' | 'villa' | 'pg_hostel';
  floor?: number;
  totalFloors?: number;
  areaSqft?: number;
  cityId: mongoose.Types.ObjectId;
  localityId: mongoose.Types.ObjectId;
  addressLine: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  furnishingStatus: 'fully_furnished' | 'semi_furnished' | 'unfurnished';
  tenantPreference: 'family' | 'bachelors' | 'girls' | 'boys' | 'any';
  brokerageFlag: boolean;
  brokerageAmount: number;
  amenities: string[];
  houseRules: string[];
  images: { url: string; isCover: boolean; fileName?: string }[];
  videos?: { url: string; fileName?: string; sizeBytes?: number }[];
  tourVideoUrl?: string;
  googleMapPlaceId?: string;
  managementType: 'self_managed' | 'platform_managed';
  status: 'draft' | 'active' | 'paused' | 'removed';

  // --- Lease Flexibility ---
  availableFrom: Date;
  minLeaseMonths: number;
  lockInMonths: number;

  // --- Tenant Fit ---
  petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
  maxOccupants: number;

  // --- Parking & EV ---
  parkingType: 'none' | 'two_wheeler' | 'four_wheeler' | 'both';
  evChargingAvailable: boolean;

  // --- Infrastructure Reliability ---
  powerBackup: 'none' | 'partial' | 'full';
  waterSupplyType: 'municipal' | 'borewell' | 'tanker' | 'mixed';

  // --- WFH / Internet Readiness ---
  internetReadiness: {
    fiberAvailable: boolean;
    avgSpeedMbps?: number;
  };

  // --- Trust & Verification (admin-settable only) ---
  isVerified: boolean;
  verifiedAt?: Date;

  // --- Safety Features (separate from amenities) ---
  safetyFeatures: string[];

  // --- Analytics & Tracking ---
  viewsCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema<IProperty> = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    rentAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    maintenanceAmount: { type: Number, default: 0 },
    bhkConfig: {
      type: String,
      enum: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'],
      required: true,
    },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'villa', 'pg_hostel'],
      required: true,
    },
    floor: { type: Number },
    totalFloors: { type: Number },
    areaSqft: { type: Number },
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    localityId: { type: Schema.Types.ObjectId, ref: 'Locality', required: true },
    addressLine: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    furnishingStatus: {
      type: String,
      enum: ['fully_furnished', 'semi_furnished', 'unfurnished'],
      required: true,
    },
    tenantPreference: {
      type: String,
      enum: ['family', 'bachelors', 'girls', 'boys', 'any'],
      required: true,
    },
    brokerageFlag: { type: Boolean, default: false },
    brokerageAmount: { type: Number, default: 0 },
    amenities: { type: [String], default: [] },
    houseRules: { type: [String], default: [] },
    images: [
      {
        url: { type: String, required: true },
        isCover: { type: Boolean, default: false },
        fileName: { type: String },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        fileName: { type: String },
        sizeBytes: { type: Number },
      },
    ],
    tourVideoUrl: { type: String },
    googleMapPlaceId: { type: String },
    managementType: {
      type: String,
      enum: ['self_managed', 'platform_managed'],
      default: 'self_managed',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'removed'],
      default: 'active',
    },

    // --- Lease Flexibility ---
    availableFrom: { type: Date, default: Date.now },
    minLeaseMonths: { type: Number, default: 11 },
    lockInMonths: { type: Number, default: 0 },

    // --- Tenant Fit ---
    petPolicy: {
      type: String,
      enum: ['allowed', 'not_allowed', 'case_by_case'],
      default: 'case_by_case',
    },
    maxOccupants: { type: Number, default: 2 },

    // --- Parking & EV ---
    parkingType: {
      type: String,
      enum: ['none', 'two_wheeler', 'four_wheeler', 'both'],
      default: 'none',
    },
    evChargingAvailable: { type: Boolean, default: false },

    // --- Infrastructure Reliability ---
    powerBackup: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'none',
    },
    waterSupplyType: {
      type: String,
      enum: ['municipal', 'borewell', 'tanker', 'mixed'],
      default: 'municipal',
    },

    // --- WFH / Internet Readiness ---
    internetReadiness: {
      fiberAvailable: { type: Boolean, default: false },
      avgSpeedMbps: { type: Number },
    },

    // --- Trust & Verification (admin-settable only) ---
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },

    // --- Safety Features (free-text chips, separate from amenities) ---
    safetyFeatures: { type: [String], default: [] },

    // --- Analytics & Tracking ---
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for geo search and existing filters
PropertySchema.index({ location: '2dsphere' });
PropertySchema.index({ status: 1 });
PropertySchema.index({ cityId: 1, localityId: 1 });
PropertySchema.index({ cityId: 1, rentAmount: 1, bhkConfig: 1, furnishingStatus: 1 });
PropertySchema.index({ viewsCount: -1 });

// New indexes for the most-commonly filtered new fields
PropertySchema.index({ availableFrom: 1 });
PropertySchema.index({ petPolicy: 1 });
PropertySchema.index({ isVerified: 1 });
PropertySchema.index({ parkingType: 1 });

const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

export default Property;
