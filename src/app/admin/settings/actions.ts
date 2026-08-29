'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import FeatureFlag from "@/models/FeatureFlag";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

async function getAdminActor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);
  if (!session || !isAdmin) {
    throw new Error("Unauthorized: Access restricted to administrators");
  }
  return session.user as any;
}

/**
 * Toggle a system_config flag between enabled/disabled.
 */
export async function toggleFeatureFlag(flagId: string, currentValue: boolean) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const flag = await FeatureFlag.findById(flagId);
    if (!flag) throw new Error("Feature flag not found");

    const beforeState = flag.toObject();

    // Toggle status field (primary) and legacy value field
    const newStatus = currentValue ? 'disabled' : 'enabled';
    flag.status = newStatus as any;
    flag.value = !currentValue;
    await flag.save();

    await logAdminAction({
      actorId: actor.id,
      action: "toggle_feature_flag",
      entityType: "FeatureFlag",
      entityId: flag._id,
      beforeState,
      afterState: flag.toObject(),
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to toggle feature flag" };
  }
}

/**
 * Create a new system_config flag (backend toggle, not a user-facing feature).
 */
export async function createFeatureFlag(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const key = formData.get("key") as string;
    const valueStr = formData.get("value") as string;
    const description = formData.get("description") as string || undefined;

    if (!key || !valueStr) throw new Error("Key and value are required");

    let parsedValue: any = valueStr;
    if (valueStr === "true") parsedValue = true;
    else if (valueStr === "false") parsedValue = false;
    else {
      try {
        parsedValue = JSON.parse(valueStr);
      } catch {
        // Leave as string
      }
    }

    await dbConnect();
    const existing = await FeatureFlag.findOne({ key });
    if (existing) throw new Error(`Feature flag with key ${key} already exists`);

    const flag = await FeatureFlag.create({
      key,
      label: key.replace(/_/g, ' '),
      value: parsedValue,
      status: parsedValue === true ? 'enabled' : 'disabled',
      category: 'system_config',
      description,
      isActive: true,
    });

    await logAdminAction({
      actorId: actor.id,
      action: "create_feature_flag",
      entityType: "FeatureFlag",
      entityId: flag._id,
      afterState: flag.toObject(),
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create feature flag" };
  }
}
