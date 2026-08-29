import dbConnect from "@/lib/db";
import VibeUpgradePackage from "@/models/VibeUpgradePackage";
import Lease from "@/models/Lease";
import Property from "@/models/Property";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import VibeUpgradeCatalog from "./VibeUpgradeCatalog";
import React from "react";
import FeatureFlag from "@/models/FeatureFlag";
import { isFeatureVisible } from "@/lib/featureAccess";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function VibeUpgradePage() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const role: string = (session?.user as any)?.role || 'anonymous';

  // Check if vibe_upgrade_catalog feature is enabled for this user role
  const flag = await FeatureFlag.findOne({ key: 'vibe_upgrade_catalog' }).lean();
  const isEnabled = flag ? isFeatureVisible(flag.status as any, role) : false;

  if (!isEnabled) {
    notFound();
  }

  // Prevent Next.js tree-shaking of Property model to ensure registration
  const _Property = Property;
  
  const packages = await VibeUpgradePackage.find({ isActive: true }).sort({ monthlyAddonAmount: 1 }).lean();

  let activeLease: any = null;

  if (session?.user) {
    const userId = (session.user as any).id;
    activeLease = await Lease.findOne({ tenantId: userId, status: 'active' })
      .populate('propertyId')
      .lean();
  }

  // Serialize Mongoose ObjectIds for client components
  const serializedPackages = packages.map((pkg: any) => ({
    _id: pkg._id.toString(),
    name: pkg.name,
    description: pkg.description,
    accessoryList: pkg.accessoryList,
    monthlyAddonAmount: pkg.monthlyAddonAmount,
    refundableDepositAmount: pkg.refundableDepositAmount,
    images: pkg.images,
  }));

  const serializedLease = activeLease ? {
    _id: activeLease._id.toString(),
    propertyId: activeLease.propertyId ? {
      _id: activeLease.propertyId._id.toString(),
      title: activeLease.propertyId.title,
      addressLine: activeLease.propertyId.addressLine,
    } : null,
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-grow">
      <VibeUpgradeCatalog 
        packages={serializedPackages} 
        isLoggedIn={!!session}
        activeLease={serializedLease}
      />
    </div>
  );
}
