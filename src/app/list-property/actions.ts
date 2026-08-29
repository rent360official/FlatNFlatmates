'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import City from "@/models/City";
import { revalidatePath } from "next/cache";

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
  images: { url: string; isCover: boolean }[];
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
}) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

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
      tourVideoUrl: data.tourVideoUrl,
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
    return { error: error.message || "Failed to publish property" };
  }
}
