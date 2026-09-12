import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import City from "@/models/City";
import Locality from "@/models/Locality";
import ApprovePropertyClient from "./ApprovePropertyClient";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function ApprovePropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  await dbConnect();

  // Ensure models are registered
  void User;
  void City;
  void Locality;

  let propertyDoc: any = null;
  try {
    propertyDoc = await Property.findById(id)
      .populate('ownerId', 'name phone email verificationStatus')
      .populate('cityId', 'name state')
      .populate('localityId', 'name location')
      .lean();
  } catch (e) {
    propertyDoc = null;
  }

  if (!propertyDoc) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-black text-slate-900">Property Listing Not Found</h1>
          <p className="text-xs text-slate-500">
            The property link you are trying to review is either expired, removed, or invalid.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-primaryHover transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to FlatNFlatmates Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const serializedProperty = {
    _id: propertyDoc._id.toString(),
    title: propertyDoc.title || 'Untitled Property',
    description: propertyDoc.description || '',
    rentAmount: propertyDoc.rentAmount || 0,
    depositAmount: propertyDoc.depositAmount || 0,
    maintenanceAmount: propertyDoc.maintenanceAmount || 0,
    bhkConfig: propertyDoc.bhkConfig || '2BHK',
    propertyType: propertyDoc.propertyType || 'apartment',
    floor: propertyDoc.floor,
    totalFloors: propertyDoc.totalFloors,
    areaSqft: propertyDoc.areaSqft,
    addressLine: propertyDoc.addressLine || '',
    localityName: propertyDoc.localityId?.name || 'Locality',
    cityName: propertyDoc.cityId?.name || 'Pune',
    coordinates: propertyDoc.location?.coordinates || undefined,
    furnishingStatus: propertyDoc.furnishingStatus || 'unfurnished',
    tenantPreference: propertyDoc.tenantPreference || 'any',
    brokerageFlag: Boolean(propertyDoc.brokerageFlag),
    brokerageAmount: propertyDoc.brokerageAmount || 0,
    amenities: propertyDoc.amenities || [],
    houseRules: propertyDoc.houseRules || [],
    safetyFeatures: propertyDoc.safetyFeatures || [],
    images: (propertyDoc.images || []).map((img: any) => ({
      url: typeof img === 'string' ? img : img.url,
      isCover: img.isCover,
    })),
    tourVideoUrl: propertyDoc.tourVideoUrl || undefined,
    availableFrom: propertyDoc.availableFrom ? new Date(propertyDoc.availableFrom).toISOString() : undefined,
    minLeaseMonths: propertyDoc.minLeaseMonths,
    lockInMonths: propertyDoc.lockInMonths,
    petPolicy: propertyDoc.petPolicy,
    maxOccupants: propertyDoc.maxOccupants,
    parkingType: propertyDoc.parkingType,
    evChargingAvailable: propertyDoc.evChargingAvailable,
    powerBackup: propertyDoc.powerBackup,
    waterSupplyType: propertyDoc.waterSupplyType,
    internetReadiness: propertyDoc.internetReadiness,
    allowWhatsappContact: propertyDoc.allowWhatsappContact,
    status: propertyDoc.status || 'pending_owner_approval',
    createdAt: propertyDoc.createdAt ? new Date(propertyDoc.createdAt).toISOString() : new Date().toISOString(),
    owner: propertyDoc.ownerId
      ? {
          _id: propertyDoc.ownerId._id.toString(),
          name: propertyDoc.ownerId.name || undefined,
          phone: propertyDoc.ownerId.phone || '',
          email: propertyDoc.ownerId.email || undefined,
          verificationStatus: propertyDoc.ownerId.verificationStatus || 'pending',
        }
      : null,
  };

  return <ApprovePropertyClient property={serializedProperty} />;
}
