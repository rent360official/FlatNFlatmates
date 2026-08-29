'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
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

export async function verifyAndCompleteVibeRequest(requestId: string, otp: string) {
  try {
    const admin = await verifyAdminSession();
    
    await dbConnect();
    const request = await VibeUpgradeRequest.findById(requestId);
    if (!request) {
      return { error: "Vibe Upgrade request not found" };
    }

    if (request.status === 'completed') {
      return { error: "Request is already completed" };
    }

    if (request.otp !== otp) {
      return { error: "Invalid verification OTP code. Access denied." };
    }

    const beforeState = { status: request.status, completedByAdminId: request.completedByAdminId };

    request.status = 'completed';
    request.completedByAdminId = admin.id;
    request.completedAt = new Date();
    await request.save();

    await logAdminAction({
      actorId: admin.id,
      action: 'complete_vibe_request',
      entityType: 'VibeUpgradeRequest',
      entityId: request._id,
      beforeState,
      afterState: { status: request.status, completedByAdminId: request.completedByAdminId }
    });

    revalidatePath("/admin/vibe-requests");
    revalidatePath("/admin");
    return { success: true };

  } catch (error: any) {
    return { error: error.message || "Failed to complete request" };
  }
}

export async function releaseVibeDeposit(requestId: string) {
  try {
    const admin = await verifyAdminSession();

    await dbConnect();
    const request = await VibeUpgradeRequest.findById(requestId);
    if (!request) {
      return { error: "Request not found" };
    }

    if (request.depositRefundStatus === 'released') {
      return { error: "Deposit is already released" };
    }

    const beforeState = { depositRefundStatus: request.depositRefundStatus };

    request.depositRefundStatus = 'released';
    await request.save();

    await logAdminAction({
      actorId: admin.id,
      action: 'release_vibe_deposit',
      entityType: 'VibeUpgradeRequest',
      entityId: request._id,
      beforeState,
      afterState: { depositRefundStatus: request.depositRefundStatus }
    });

    revalidatePath("/admin/vibe-requests");
    revalidatePath("/admin");
    return { success: true };

  } catch (error: any) {
    return { error: error.message || "Failed to release deposit" };
  }
}
