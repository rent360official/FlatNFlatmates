'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import PropertyInquiry from "@/models/PropertyInquiry";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Access restricted to logged-in users");
  }
  return session.user as any;
}

export async function togglePropertyStatus(propertyId: string, currentStatus: string) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");
    
    if (property.ownerId.toString() !== sessionUser.id) {
      throw new Error("Unauthorized: You do not own this property");
    }

    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';

    if (nextStatus === 'active') {
      const user = await User.findById(sessionUser.id);
      if (user?.verificationStatus === 'rejected') {
        throw new Error("Your account verification is currently rejected. You cannot resume listings until your account is re-verified.");
      }
    }

    property.status = nextStatus;
    await property.save();

    revalidatePath("/profile/properties");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update property status") };
  }
}

export async function deleteProperty(propertyId: string) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");

    if (property.ownerId.toString() !== sessionUser.id) {
      throw new Error("Unauthorized: You do not own this property");
    }

    property.status = 'removed';
    await property.save();

    revalidatePath("/profile/properties");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to delete property") };
  }
}

import mongoose from "mongoose";

/**
 * Fetch detailed list of user inquiries (calls or SMS interests) for a specific owned property.
 * Deduplicates multiple clicks/attempts by the same user into a single clean entry.
 */
export async function getPropertyInquiriesListAction(
  propertyId: string,
  inquiryType: 'call' | 'sms_interested'
) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");

    const isOwner = property.ownerId.toString() === sessionUser.id;
    const isAdmin = ['super_admin', 'ops_admin'].includes(sessionUser.role);
    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized: Access restricted to property owner");
    }

    const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

    const inquiries = await PropertyInquiry.aggregate([
      {
        $match: {
          propertyId: propertyObjectId,
          inquiryType,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: { $ifNull: ["$userId", "$userPhone"] },
          docId: { $first: "$_id" },
          userName: { $first: "$userName" },
          userPhone: { $first: "$userPhone" },
          smsStatus: { $first: "$smsStatus" },
          createdAt: { $first: "$createdAt" },
          attemptCount: { $sum: 1 },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const serialized = inquiries.map((item: any) => ({
      _id: item.docId?.toString() || item._id?.toString() || Math.random().toString(),
      userName: item.userName || "Prospective Tenant",
      userPhone: item.userPhone || null,
      smsStatus: item.smsStatus || 'n/a',
      attemptCount: item.attemptCount || 1,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    }));

    return {
      success: true,
      inquiries: serialized,
      propertyTitle: property.title || property.bhkConfig || "Property",
    };
  } catch (error: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error, "Failed to load inquiries list"),
    };
  }
}
