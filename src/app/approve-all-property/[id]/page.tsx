import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import City from "@/models/City";
import Locality from "@/models/Locality";
import Link from "next/link";
import { Building2, ArrowLeft, User as UserIcon } from "lucide-react";
import React from "react";
import ApproveAllPropertiesClient from "./ApproveAllPropertiesClient";

export const dynamic = 'force-dynamic';

export default async function ApproveAllPropertiesPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  await dbConnect();

  // Ensure models are registered for populate
  void User;
  void City;
  void Locality;

  let ownerDoc: any = null;
  try {
    ownerDoc = await User.findById(id).select('name phone email verificationStatus createdAt').lean();
  } catch (e) {
    ownerDoc = null;
  }

  if (!ownerDoc) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-black text-slate-900">Owner Profile Not Found</h1>
          <p className="text-xs text-slate-500">
            The verification link you are trying to access is either expired, invalid, or the owner profile was not found.
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

  // Fetch all pending properties owned by this user
  const rawPendingProperties = await Property.find({
    ownerId: id,
    status: 'pending_owner_approval',
  })
    .sort({ createdAt: -1 })
    .populate('cityId', 'name state')
    .populate('localityId', 'name')
    .lean();

  const serializedProperties = rawPendingProperties.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title || 'Untitled Property',
    description: p.description || '',
    rentAmount: p.rentAmount || 0,
    depositAmount: p.depositAmount || 0,
    bhkConfig: p.bhkConfig || '2BHK',
    propertyType: p.propertyType || 'apartment',
    addressLine: p.addressLine || '',
    localityName: p.localityId?.name || 'Locality',
    cityName: p.cityId?.name || 'Pune',
    images: (p.images || []).map((img: any) => ({
      url: typeof img === 'string' ? img : img.url,
      isCover: img.isCover,
    })),
    furnishingStatus: p.furnishingStatus || 'unfurnished',
    status: p.status || 'pending_owner_approval',
    imageUpdateRequired: Boolean(p.imageUpdateRequired),
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
  }));

  const serializedOwner = {
    _id: ownerDoc._id.toString(),
    name: ownerDoc.name || 'Property Owner',
    phone: ownerDoc.phone || '',
    email: ownerDoc.email || '',
    verificationStatus: ownerDoc.verificationStatus || 'pending',
  };

  return (
    <ApproveAllPropertiesClient
      owner={serializedOwner}
      properties={serializedProperties}
    />
  );
}
