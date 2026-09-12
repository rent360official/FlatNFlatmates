'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import City from "@/models/City";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: You must be signed in to list a property");
  }
  return session.user as any;
}

export async function publishProperty(data: {
  // Existing fields
  title: string;
  description: string;
  rentAmount: number;
  depositAmount: number;
  maintenanceAmount: number;
  bhkConfig: string;
  propertyType: string;
  floor?: number;
  totalFloors?: number;
  areaSqft?: number;
  localityId: string;
  addressLine: string;
  lat: number;
  lng: number;
  furnishingStatus: string;
  tenantPreference: string;
  brokerageFlag: boolean;
  brokerageAmount: number;
  amenities: string[];
  houseRules: string[];
  images: { url: string; isCover: boolean; fileName?: string }[];
  videos?: { url: string; fileName?: string; sizeBytes?: number }[];
  tourVideoUrl?: string;

  // New fields — Lease Flexibility
  availableFrom?: string | Date;
  minLeaseMonths?: number;
  lockInMonths?: number;

  // New fields — Tenant Fit
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
  maxOccupants?: number;

  // New fields — Parking & EV
  parkingType?: 'none' | 'two_wheeler' | 'four_wheeler' | 'both';
  evChargingAvailable?: boolean;

  // New fields — Infrastructure
  powerBackup?: 'none' | 'partial' | 'full';
  waterSupplyType?: 'municipal' | 'borewell' | 'tanker' | 'mixed';

  // New fields — WFH / Internet
  internetReadiness?: { fiberAvailable: boolean; avgSpeedMbps?: number };

  // New fields — Safety Features
  safetyFeatures?: string[];

  // Contact preferences
  allowWhatsappContact?: boolean;
}) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    const userRecord = await User.findById(sessionUser.id);
    if (userRecord?.verificationStatus === 'rejected') {
      throw new Error("Your account verification is currently rejected. You cannot post listings until your account is re-verified.");
    }

    // Get Pune City Reference
    const puneCity = await City.findOne({ name: "Pune" });
    if (!puneCity) {
      throw new Error("Pune City reference data not found in DB. Run seed first.");
    }

    const property = await Property.create({
      ownerId: sessionUser.id,
      title: data.title,
      description: data.description,
      rentAmount: data.rentAmount,
      depositAmount: data.depositAmount,
      maintenanceAmount: data.maintenanceAmount,
      bhkConfig: data.bhkConfig as any,
      propertyType: data.propertyType as any,
      floor: data.floor,
      totalFloors: data.totalFloors,
      areaSqft: data.areaSqft,
      cityId: puneCity._id,
      localityId: data.localityId,
      addressLine: data.addressLine,
      location: {
        type: "Point",
        coordinates: [data.lng, data.lat], // [lng, lat]
      },
      furnishingStatus: data.furnishingStatus as any,
      tenantPreference: data.tenantPreference as any,
      brokerageFlag: data.brokerageFlag,
      brokerageAmount: data.brokerageAmount,
      amenities: data.amenities,
      houseRules: data.houseRules,
      images: data.images,
      videos: data.videos ?? (data.tourVideoUrl ? [{ url: data.tourVideoUrl, fileName: 'Tour Video' }] : []),
      tourVideoUrl: data.tourVideoUrl || data.videos?.[0]?.url || undefined,
      managementType: 'self_managed',
      status: 'active',

      // New fields (all optional with schema defaults as fallback)
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : new Date(),
      minLeaseMonths: data.minLeaseMonths ?? 11,
      lockInMonths: data.lockInMonths ?? 0,
      petPolicy: data.petPolicy ?? 'case_by_case',
      maxOccupants: data.maxOccupants ?? 2,
      parkingType: data.parkingType ?? 'none',
      evChargingAvailable: data.evChargingAvailable ?? false,
      powerBackup: data.powerBackup ?? 'none',
      waterSupplyType: data.waterSupplyType ?? 'municipal',
      internetReadiness: data.internetReadiness ?? { fiberAvailable: false },
      safetyFeatures: data.safetyFeatures ?? [],
      allowWhatsappContact: data.allowWhatsappContact !== false,
      // isVerified is always false for owner-submitted listings (admin-only field)
      isVerified: false,
    });

    // Automatically transition user role to owner if they were user
    const user = await User.findById(sessionUser.id);
    if (user && user.role === 'user') {
      user.role = 'owner';
      await user.save();
    }

    revalidatePath("/profile/properties");
    revalidatePath("/");
    return { success: true, propertyId: property._id.toString() };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to publish property") };
  }
}

export async function updateProperty(propertyId: string, data: {
  // Existing fields
  title: string;
  description: string;
  rentAmount: number;
  depositAmount: number;
  maintenanceAmount: number;
  bhkConfig: string;
  propertyType: string;
  floor?: number;
  totalFloors?: number;
  areaSqft?: number;
  localityId: string;
  addressLine: string;
  lat: number;
  lng: number;
  furnishingStatus: string;
  tenantPreference: string;
  brokerageFlag: boolean;
  brokerageAmount: number;
  amenities: string[];
  houseRules: string[];
  images: { url: string; isCover: boolean; fileName?: string }[];
  videos?: { url: string; fileName?: string; sizeBytes?: number }[];
  tourVideoUrl?: string;

  // New fields — Lease Flexibility
  availableFrom?: string | Date;
  minLeaseMonths?: number;
  lockInMonths?: number;

  // New fields — Tenant Fit
  petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
  maxOccupants?: number;

  // New fields — Parking & EV
  parkingType?: 'none' | 'two_wheeler' | 'four_wheeler' | 'both';
  evChargingAvailable?: boolean;

  // New fields — Infrastructure
  powerBackup?: 'none' | 'partial' | 'full';
  waterSupplyType?: 'municipal' | 'borewell' | 'tanker' | 'mixed';

  // New fields — WFH / Internet
  internetReadiness?: { fiberAvailable: boolean; avgSpeedMbps?: number };

  // New fields — Safety Features
  safetyFeatures?: string[];

  // Contact preferences
  allowWhatsappContact?: boolean;

  // Activation flag
  makeLive?: boolean;
}) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property listing not found");
    }

    // Verify ownership
    if (property.ownerId.toString() !== sessionUser.id && sessionUser.role !== 'admin') {
      throw new Error("Unauthorized: You do not have permission to edit this property");
    }

    property.title = data.title;
    property.description = data.description;
    property.rentAmount = data.rentAmount;
    property.depositAmount = data.depositAmount;
    property.maintenanceAmount = data.maintenanceAmount;
    property.bhkConfig = data.bhkConfig as any;
    property.propertyType = data.propertyType as any;
    property.floor = data.floor;
    property.totalFloors = data.totalFloors;
    property.areaSqft = data.areaSqft;
    property.localityId = data.localityId as any;
    property.addressLine = data.addressLine;
    property.location = {
      type: "Point",
      coordinates: [data.lng, data.lat],
    };
    property.furnishingStatus = data.furnishingStatus as any;
    property.tenantPreference = data.tenantPreference as any;
    property.brokerageFlag = data.brokerageFlag;
    property.brokerageAmount = data.brokerageAmount;
    property.amenities = data.amenities;
    property.houseRules = data.houseRules;
    property.images = data.images as any;
    property.videos = (data.videos ?? (data.tourVideoUrl ? [{ url: data.tourVideoUrl, fileName: 'Tour Video' }] : [])) as any;
    property.tourVideoUrl = data.tourVideoUrl || data.videos?.[0]?.url || undefined;
    if (data.allowWhatsappContact !== undefined) {
      property.allowWhatsappContact = data.allowWhatsappContact;
    }
    
    if (data.availableFrom) {
      property.availableFrom = new Date(data.availableFrom);
    }
    if (data.minLeaseMonths !== undefined) property.minLeaseMonths = data.minLeaseMonths;
    if (data.lockInMonths !== undefined) property.lockInMonths = data.lockInMonths;
    if (data.petPolicy) property.petPolicy = data.petPolicy;
    if (data.maxOccupants !== undefined) property.maxOccupants = data.maxOccupants;
    if (data.parkingType) property.parkingType = data.parkingType;
    if (data.evChargingAvailable !== undefined) property.evChargingAvailable = data.evChargingAvailable;
    if (data.powerBackup) property.powerBackup = data.powerBackup;
    if (data.waterSupplyType) property.waterSupplyType = data.waterSupplyType;
    if (data.internetReadiness) property.internetReadiness = data.internetReadiness;
    if (data.safetyFeatures) property.safetyFeatures = data.safetyFeatures;

    if (data.makeLive) {
      property.status = 'active';
    }

    await property.save();

    revalidatePath("/profile/properties");
    revalidatePath(`/flat/${propertyId}`);
    revalidatePath("/search/flats");
    revalidatePath("/admin/pending-approvals");
    revalidatePath(`/approve-property/${propertyId}`);
    revalidatePath("/");

    return { success: true, propertyId: property._id.toString() };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update property listing") };
  }
}
