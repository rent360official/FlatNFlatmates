import dbConnect from "@/lib/db";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
import VibeUpgradePackage from "@/models/VibeUpgradePackage";
import Lease from "@/models/Lease";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";
import FeatureFlag from "@/models/FeatureFlag";
import { isFeatureVisible } from "@/lib/featureAccess";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in first" }, { status: 401 });
    }

    const { packageId } = await req.json();
    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    await dbConnect();

    // Check if feature flag is active for the current user's role
    const role: string = (session.user as any).role || 'anonymous';
    const flag = await FeatureFlag.findOne({ key: 'vibe_upgrade_catalog' }).lean();
    const isEnabled = flag ? isFeatureVisible(flag.status as any, role) : false;
    if (!isEnabled) {
      return NextResponse.json({ error: "Access Restricted: This feature is currently disabled" }, { status: 403 });
    }

    // Verify package exists
    const pkg = await VibeUpgradePackage.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ error: "Vibe Upgrade package not found or inactive" }, { status: 404 });
    }

    // Verify active tenancy (Lease check)
    const activeLease = await Lease.findOne({
      tenantId: (session.user as any).id,
      status: 'active'
    });

    if (!activeLease) {
      return NextResponse.json({
        error: "Access Restricted: You must have an active lease on FlatNFlatmates.in to request a Vibe Upgrade."
      }, { status: 403 });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create the request
    const request = await VibeUpgradeRequest.create({
      userId: (session.user as any).id,
      propertyId: activeLease.propertyId,
      packageId: pkg._id,
      otp,
      status: 'requested',
      depositRefundStatus: 'held',
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId: request._id.toString(),
        otp: request.otp,
      }
    });

  } catch (error: any) {
    console.error("Vibe checkout error:", error);
    return NextResponse.json({ error: "An unexpected error occurred while processing your request. Please try again later." }, { status: 500 });
  }
}
