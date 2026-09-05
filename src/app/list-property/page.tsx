import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Locality from "@/models/Locality";
import Property from "@/models/Property";
import { getMediaUploadConfig } from "@/lib/mediaConfig";
import ListingWizard from "./ListingWizard";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function ListPropertyPage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    const callback = searchParams?.edit ? `/list-property?edit=${searchParams.edit}` : "/list-property";
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  await dbConnect();
  const localities = await Locality.find({ isActive: true }).sort({ name: 1 }).lean();
  const mediaConfig = await getMediaUploadConfig();

  // Serialize localities for client component props
  const serializedLocalities = localities.map((loc: any) => ({
    _id: loc._id.toString(),
    name: loc.name,
    lat: loc.location?.coordinates[1] || 18.5597,
    lng: loc.location?.coordinates[0] || 73.7922,
  }));

  // Fetch existing property if in edit mode
  let initialProperty = null;
  if (searchParams?.edit) {
    const propDoc = await Property.findById(searchParams.edit).lean();
    if (propDoc) {
      const isOwner = propDoc.ownerId.toString() === (session.user as any).id;
      const isAdmin = (session.user as any).role === 'admin';
      if (isOwner || isAdmin) {
        initialProperty = {
          _id: propDoc._id.toString(),
          title: propDoc.title || "",
          description: propDoc.description || "",
          bhkConfig: propDoc.bhkConfig || "2BHK",
          propertyType: propDoc.propertyType || "apartment",
          floor: propDoc.floor !== undefined ? propDoc.floor : "",
          totalFloors: propDoc.totalFloors !== undefined ? propDoc.totalFloors : "",
          areaSqft: propDoc.areaSqft !== undefined ? propDoc.areaSqft : "",
          localityId: propDoc.localityId ? propDoc.localityId.toString() : serializedLocalities[0]?._id || "",
          addressLine: propDoc.addressLine || "",
          lat: propDoc.location?.coordinates?.[1] || 18.5597,
          lng: propDoc.location?.coordinates?.[0] || 73.7922,
          images: propDoc.images || [],
          videos: propDoc.videos || [],
          tourVideoUrl: propDoc.tourVideoUrl || "",
          amenities: propDoc.amenities || [],
          houseRules: propDoc.houseRules || [],
          safetyFeatures: propDoc.safetyFeatures || [],
          availableFrom: propDoc.availableFrom ? new Date(propDoc.availableFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          minLeaseMonths: propDoc.minLeaseMonths !== undefined ? propDoc.minLeaseMonths : 11,
          lockInMonths: propDoc.lockInMonths !== undefined ? propDoc.lockInMonths : 0,
          petPolicy: propDoc.petPolicy || 'case_by_case',
          maxOccupants: propDoc.maxOccupants !== undefined ? propDoc.maxOccupants : 2,
          parkingType: propDoc.parkingType || 'none',
          evChargingAvailable: !!propDoc.evChargingAvailable,
          powerBackup: propDoc.powerBackup || 'none',
          waterSupplyType: propDoc.waterSupplyType || 'municipal',
          fiberAvailable: !!propDoc.internetReadiness?.fiberAvailable,
          avgSpeedMbps: propDoc.internetReadiness?.avgSpeedMbps !== undefined ? propDoc.internetReadiness.avgSpeedMbps : "",
          rentAmount: propDoc.rentAmount !== undefined ? propDoc.rentAmount : "",
          depositAmount: propDoc.depositAmount !== undefined ? propDoc.depositAmount : "",
          maintenanceAmount: propDoc.maintenanceAmount !== undefined ? propDoc.maintenanceAmount : "",
          furnishingStatus: propDoc.furnishingStatus || "semi_furnished",
          tenantPreference: propDoc.tenantPreference || "any",
          brokerageFlag: !!propDoc.brokerageFlag,
          brokerageAmount: propDoc.brokerageAmount || "",
        };
      }
    }
  }

  const isEditMode = Boolean(initialProperty);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full flex flex-col justify-center">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {isEditMode ? "Edit Your Property Listing" : "List Your Property in Pune"}
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          {isEditMode
            ? "Update your flat specs, photos, video tours, amenities, or pricing parameters."
            : "Complete our multi-step wizard to list your flat or room share and find verified tenants or compatible flatmates."}
        </p>
      </div>

      <ListingWizard
        localities={serializedLocalities}
        mediaConfig={mediaConfig}
        initialProperty={initialProperty}
      />
    </div>
  );
}
