'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import User from "@/models/User";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

async function getAdminActor(requireWrite = false) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);
  if (!session || !isAdmin) {
    throw new Error("Unauthorized: Access restricted to administrators");
  }
  if (requireWrite && role === 'support_agent') {
    throw new Error("Forbidden: Support agents have read-only permissions");
  }
  return session.user as any;
}

export async function adminMakePropertyLive(propertyId: string) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");

    const previousStatus = property.status;
    property.status = 'active';
    await property.save();

    await logAdminAction({
      actorId: actor.id,
      action: "PROPERTY_STATUS_CHANGE",
      entityType: "Property",
      entityId: property._id.toString(),
      beforeState: { status: previousStatus },
      afterState: { status: "active", action: "make_live", propertyTitle: property.title },
    });

    revalidatePath("/admin/pending-approvals");
    revalidatePath("/admin");
    revalidatePath(`/admin/users/${property.ownerId}/properties`);
    revalidatePath("/profile/properties");
    revalidatePath(`/flat/${propertyId}`);
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to activate property") };
  }
}

export async function adminRejectProperty(propertyId: string) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property not found");

    const previousStatus = property.status;
    property.status = 'removed';
    await property.save();

    await logAdminAction({
      actorId: actor.id,
      action: "PROPERTY_STATUS_CHANGE",
      entityType: "Property",
      entityId: property._id.toString(),
      beforeState: { status: previousStatus },
      afterState: { status: "removed", action: "reject_unapproved", propertyTitle: property.title },
    });

    revalidatePath("/admin/pending-approvals");
    revalidatePath("/admin");
    revalidatePath(`/admin/users/${property.ownerId}/properties`);
    revalidatePath("/profile/properties");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to reject property") };
  }
}
