'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
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

export async function adminCreateUser(formData: FormData) {
  try {
    const actor = await getAdminActor(true);
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

    const cleanEmail = (email === "undefined" || email === "null" || !email) ? undefined : email.trim();
    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        throw new Error(`User with email ${cleanEmail} already exists`);
      }
    }

    const user = await User.create({
      name,
      phone,
      email: cleanEmail,
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

export async function adminUpdateUserVerification(
  userId: string, 
  status: 'pending' | 'verified' | 'rejected',
  rejectionReason?: string
) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (status === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error("A rejection reason message is required when marking verification as rejected.");
      }
      user.rejectionReason = rejectionReason.trim();
      user.rejectedAt = new Date();

      // Automatically pause any active properties owned by this user
      await Property.updateMany(
        { ownerId: userId, status: 'active' },
        { $set: { status: 'paused' } }
      );
    } else if (status === 'verified') {
      user.rejectionReason = undefined;
      user.rejectedAt = undefined;
      user.reverificationRequestMessage = undefined;
      user.reverificationRequestedAt = undefined;
    }

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
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/users/${userId}/properties`);
    revalidatePath("/listings");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update user verification") };
  }
}

export async function adminUpdateUserRole(userId: string, role: any) {
  try {
    const actor = await getAdminActor(true);
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
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update user role") };
  }
}

export async function adminUpdateFullUser(userId: string, formData: FormData) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const beforeState = user.toObject();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as any;
    const verificationStatus = formData.get("verificationStatus") as any;
    const gender = formData.get("gender") as any;
    const age = formData.get("age") ? parseInt(formData.get("age") as string, 10) : undefined;
    const profession = formData.get("profession") as string;
    const bio = formData.get("bio") as string;
    const isFlatmateSearchable = formData.get("isFlatmateSearchable") === "true";

    if (!name || !phone) throw new Error("Name and phone number are required");

    // Check unique phone collision
    if (phone !== user.phone) {
      const existing = await User.findOne({ phone, _id: { $ne: userId } });
      if (existing) throw new Error(`Phone number ${phone} is already used by another account.`);
    }

    // Check unique email collision if provided
    const cleanEmail = email ? email.trim() : undefined;
    if (cleanEmail && cleanEmail !== user.email) {
      const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
      if (existingEmail) throw new Error(`Email ${cleanEmail} is already used by another account.`);
    }

    const rejectionReason = formData.get("rejectionReason") as string;

    if (verificationStatus === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error("A rejection reason message is required when marking verification as rejected.");
      }
      user.rejectionReason = rejectionReason.trim();
      user.rejectedAt = new Date();

      // Automatically pause any active properties owned by this user
      await Property.updateMany(
        { ownerId: userId, status: 'active' },
        { $set: { status: 'paused' } }
      );
    } else if (verificationStatus === 'verified') {
      user.rejectionReason = undefined;
      user.rejectedAt = undefined;
      user.reverificationRequestMessage = undefined;
      user.reverificationRequestedAt = undefined;
    }

    user.name = name;
    user.phone = phone;
    user.email = cleanEmail;
    if (role) user.role = role;
    if (verificationStatus) user.verificationStatus = verificationStatus;
    if (gender) user.gender = gender;
    if (age !== undefined && !isNaN(age)) user.age = age;
    if (profession !== undefined) user.profession = profession;
    if (bio !== undefined) user.bio = bio;
    user.isFlatmateSearchable = isFlatmateSearchable;

    await user.save();

    await logAdminAction({
      actorId: actor.id,
      action: "admin_update_full_user",
      entityType: "User",
      entityId: user._id,
      beforeState,
      afterState: user.toObject(),
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to update user details") };
  }
}

export async function adminTogglePropertyStatus(propertyId: string, currentStatus: string) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property listing not found");

    const beforeState = property.toObject();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    property.status = newStatus;
    await property.save();

    await logAdminAction({
      actorId: actor.id,
      action: `admin_${newStatus}_property`,
      entityType: "Property",
      entityId: property._id,
      beforeState,
      afterState: property.toObject(),
    });

    revalidatePath(`/admin/users/${property.ownerId}/properties`);
    revalidatePath(`/listings`);
    revalidatePath(`/admin`);
    return { success: true, newStatus };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to toggle property status") };
  }
}

export async function adminDeleteProperty(propertyId: string) {
  try {
    const actor = await getAdminActor(true);
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) throw new Error("Property listing not found");

    const beforeState = property.toObject();
    property.status = 'removed';
    await property.save();

    await logAdminAction({
      actorId: actor.id,
      action: "admin_delete_property",
      entityType: "Property",
      entityId: property._id,
      beforeState,
      afterState: property.toObject(),
    });

    revalidatePath(`/admin/users/${property.ownerId}/properties`);
    revalidatePath(`/listings`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to delete property") };
  }
}
