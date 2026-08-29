'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

async function getAdminActor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);
  if (!session || !isAdmin) {
    throw new Error("Unauthorized: Access restricted to administrators");
  }
  return session.user as any;
}

export async function adminCreateUser(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string || undefined;
    const role = formData.get("role") as 'user' | 'owner';

    if (!name || !phone || !role) throw new Error("Name, phone, and role are required");

    await dbConnect();
    
    // Check if phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      throw new Error(`User with phone ${phone} already exists`);
    }

    const user = await User.create({
      name,
      phone,
      email,
      role,
      verificationStatus: "verified", // On-behalf users are automatically verified
    });

    await logAdminAction({
      actorId: actor.id,
      action: "admin_create_user",
      entityType: "User",
      entityId: user._id,
      afterState: user.toObject(),
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to create user") };
  }
}

export async function adminUpdateUserVerification(userId: string, status: 'pending' | 'verified' | 'rejected') {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const beforeState = user.toObject();
    user.verificationStatus = status;
    await user.save();

    await logAdminAction({
      actorId: actor.id,
      action: "update_user_verification",
      entityType: "User",
      entityId: user._id,
      beforeState,
      afterState: user.toObject(),
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update user verification") };
  }
}

export async function adminUpdateUserRole(userId: string, role: any) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const beforeState = user.toObject();
    user.role = role;
    await user.save();

    await logAdminAction({
      actorId: actor.id,
      action: "update_user_role",
      entityType: "User",
      entityId: user._id,
      beforeState,
      afterState: user.toObject(),
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update user role") };
  }
}
