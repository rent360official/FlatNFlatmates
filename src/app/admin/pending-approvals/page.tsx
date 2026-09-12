import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import City from "@/models/City";
import Locality from "@/models/Locality";
import PendingApprovalsList from "./PendingApprovalsList";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function PendingApprovalsPage() {
  await dbConnect();

  // Ensure models are registered for populate
  void User;
  void City;
  void Locality;

  const rawProperties = await Property.find({ status: 'pending_owner_approval' })
    .sort({ createdAt: -1 })
    .populate('ownerId', 'name phone email verificationStatus')
    .populate('cityId', 'name state')
    .populate('localityId', 'name')
    .lean();

  const serializedProperties = rawProperties.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title || 'Untitled Property',
    description: p.description || '',
    rentAmount: p.rentAmount || 0,
    depositAmount: p.depositAmount || 0,
    bhkConfig: p.bhkConfig || '2BHK',
    propertyType: p.propertyType || 'apartment',
    addressLine: p.addressLine || '',
    localityName: p.localityId?.name || 'Unknown Locality',
    cityName: p.cityId?.name || 'Pune',
    images: (p.images || []).map((img: any) => ({
      url: typeof img === 'string' ? img : img.url,
      isCover: img.isCover,
    })),
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    owner: p.ownerId
      ? {
          _id: p.ownerId._id.toString(),
          name: p.ownerId.name || undefined,
          phone: p.ownerId.phone || '',
          email: p.ownerId.email || undefined,
          verificationStatus: p.ownerId.verificationStatus || 'pending',
        }
      : null,
  }));

  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    '';

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      <PendingApprovalsList
        initialProperties={serializedProperties}
        appBaseUrl={appBaseUrl}
      />
    </div>
  );
}
