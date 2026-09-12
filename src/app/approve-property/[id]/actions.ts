'use server';

import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

export async function ownerMakePropertyLive(propertyId: string) {
  try {
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property listing not found");
    }

    property.status = 'active';
    await property.save();

    revalidatePath(`/approve-property/${propertyId}`);
    revalidatePath(`/flat/${propertyId}`);
    revalidatePath("/profile/properties");
    revalidatePath("/admin/pending-approvals");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to activate property listing") };
  }
}

export async function ownerRejectProperty(propertyId: string) {
  try {
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property listing not found");
    }

    property.status = 'removed';
    await property.save();

    revalidatePath(`/approve-property/${propertyId}`);
    revalidatePath("/profile/properties");
    revalidatePath("/admin/pending-approvals");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to remove property listing") };
  }
}
