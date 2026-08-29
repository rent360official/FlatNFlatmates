'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
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
