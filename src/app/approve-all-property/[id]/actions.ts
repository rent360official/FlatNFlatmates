'use server';

import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

export async function ownerMakeBulkPropertiesLive(propertyIds: string[], userId: string) {
  try {
    if (!propertyIds || propertyIds.length === 0) {
      throw new Error("No properties selected to make live.");
    }

    await dbConnect();

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Owner profile not found");
    }

    // Find all matching pending properties owned by this user
    const properties = await Property.find({
      _id: { $in: propertyIds },
      ownerId: userId,
      status: 'pending_owner_approval',
    });

    if (properties.length === 0) {
      throw new Error("No pending properties found matching the selection.");
    }

    // Filter out properties that require image updates
    const eligibleProperties = properties.filter((p) => !p.imageUpdateRequired);
    const skippedImageRequired = properties.filter((p) => p.imageUpdateRequired);

    if (eligibleProperties.length === 0) {
      throw new Error(
        "All selected properties require an image update before they can be made live. Please update photos first."
      );
    }

    const eligibleIds = eligibleProperties.map((p) => p._id);

    // Update status to active
    await Property.updateMany(
      { _id: { $in: eligibleIds } },
      { $set: { status: 'active' } }
    );

    revalidatePath(`/approve-all-property/${userId}`);
    revalidatePath("/profile/properties");
    revalidatePath("/admin/pending-approvals");
    revalidatePath("/admin");
    revalidatePath("/");

    eligibleIds.forEach((id) => {
      revalidatePath(`/flat/${id.toString()}`);
      revalidatePath(`/approve-property/${id.toString()}`);
    });

    return {
      success: true,
      activatedCount: eligibleProperties.length,
      skippedCount: skippedImageRequired.length,
    };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to activate selected properties") };
  }
}
