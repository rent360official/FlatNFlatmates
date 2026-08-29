'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import Property from "@/models/Property";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

async function verifyAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Authentication required");
  }

  const role = (session.user as any).role;
  const allowedRoles = ['super_admin', 'ops_admin', 'support_agent', 'moderator'];
  if (!allowedRoles.includes(role)) {
    throw new Error("Forbidden: Admin privileges required");
  }

  return session.user as any;
}

export async function confirmPropertyRented(callLogId: string) {
  try {
    const admin = await verifyAdminSession();
    await dbConnect();

    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      return { error: "Call log not found" };
    }

    if (!callLog.propertyId) {
      return { error: "No property associated with this call log" };
    }

    const property = await Property.findById(callLog.propertyId);
    if (!property) {
      return { error: "Property not found" };
    }

    const beforeState = { status: property.status };

    // Pause property listing (soft-delist)
    property.status = 'paused';
    await property.save();

    // Clear the warning flag on the call log
    callLog.detectedAvailability = 'unknown';
    await callLog.save();

    await logAdminAction({
      actorId: admin.id,
      action: 'soft_delist_rented_property',
      entityType: 'Property',
      entityId: property._id,
      beforeState,
      afterState: { status: 'paused' }
    });

    revalidatePath("/admin/call-logs");
    revalidatePath(`/flat/${property._id}`);
    revalidatePath("/admin");
    return { success: true };

  } catch (error: any) {
    return { error: error.message || "Failed to confirm rented status" };
  }
}

export async function dismissPropertyWarning(callLogId: string) {
  try {
    const admin = await verifyAdminSession();
    await dbConnect();

    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      return { error: "Call log not found" };
    }

    const beforeState = { detectedAvailability: callLog.detectedAvailability };

    // Override to available (dismiss warning)
    callLog.detectedAvailability = 'available';
    await callLog.save();

    await logAdminAction({
      actorId: admin.id,
      action: 'dismiss_call_availability_warning',
      entityType: 'Property',
      entityId: callLog.propertyId || callLog._id, // use call log id if no property attached
      beforeState,
      afterState: { detectedAvailability: 'available' }
    });

    revalidatePath("/admin/call-logs");
    if (callLog.propertyId) {
      revalidatePath(`/flat/${callLog.propertyId}`);
    }
    revalidatePath("/admin");
    return { success: true };

  } catch (error: any) {
    return { error: error.message || "Failed to dismiss warning" };
  }
}
