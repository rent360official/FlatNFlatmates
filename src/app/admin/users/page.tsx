import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import City from "@/models/City";
import Locality from "@/models/Locality";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import UsersManagementClient from "./UsersManagementClient";
import { UserItem } from "./UsersTable";
import { PropertyGridItem } from "./PropertiesTable";
import { getPropertyApprovalMessageTemplate } from "@/lib/propertyApprovalConfig.server";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const session = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.role || "";
  const canEdit = ['super_admin', 'ops_admin', 'moderator'].includes(adminRole);

  await dbConnect();

  // Ensure Mongoose models are registered for populate
  void User;
  void City;
  void Locality;
  void Property;

  const [rawUsers, rawProperties, rawLocalities, messageTemplate] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Property.find()
      .populate('ownerId', 'name phone email verificationStatus role')
      .populate('cityId', 'name state')
      .populate('localityId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    Locality.find({ isActive: true }).select('name').sort({ name: 1 }).lean(),
    getPropertyApprovalMessageTemplate(),
  ]);

  const serializedUsers: UserItem[] = rawUsers.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    verificationStatus: u.verificationStatus || 'pending',
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
  }));

  const serializedProperties: PropertyGridItem[] = rawProperties.map((p: any) => {
    const cover =
      (p.images || []).find((img: any) => img.isCover)?.url ||
      p.images?.[0]?.url ||
      (typeof p.images?.[0] === 'string' ? p.images[0] : undefined);

    return {
      _id: p._id.toString(),
      title: p.title || 'Untitled Property',
      rentAmount: p.rentAmount || 0,
      depositAmount: p.depositAmount || 0,
      bhkConfig: p.bhkConfig || '2BHK',
      propertyType: p.propertyType || 'apartment',
      furnishingStatus: p.furnishingStatus || 'unfurnished',
      status: p.status || 'draft',
      localityId: p.localityId?._id ? p.localityId._id.toString() : undefined,
      localityName: p.localityId?.name || 'Unknown Locality',
      cityName: p.cityId?.name || 'Pune',
      addressLine: p.addressLine || '',
      coverImage: cover,
      viewsCount: p.viewsCount || 0,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      owner: p.ownerId
        ? {
            _id: p.ownerId._id.toString(),
            name: p.ownerId.name || undefined,
            phone: p.ownerId.phone || '',
            email: p.ownerId.email || undefined,
            verificationStatus: p.ownerId.verificationStatus || 'pending',
            role: p.ownerId.role || 'user',
          }
        : null,
    };
  });

  const serializedLocalities = rawLocalities.map((l: any) => ({
    _id: l._id.toString(),
    name: l.name,
  }));

  const initialView = searchParams?.view === 'property' ? 'property' : 'user';

  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    '';

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      <UsersManagementClient
        users={serializedUsers}
        properties={serializedProperties}
        localities={serializedLocalities}
        canEdit={canEdit}
        initialView={initialView}
        appBaseUrl={appBaseUrl}
        messageTemplate={messageTemplate}
      />
    </div>
  );
}
