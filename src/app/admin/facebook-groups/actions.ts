'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import FacebookGroup from "@/models/FacebookGroup";
import Locality from "@/models/Locality";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/utils";

async function getAdminActor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAuthorized = ['super_admin', 'ops_admin'].includes(role);
  if (!session || !isAuthorized) {
    throw new Error("Forbidden: Access restricted to super_admin and ops_admin");
  }
  return session.user as any;
}

export async function saveFacebookGroup(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const localityId = formData.get("localityId") as string;
    const groupName = formData.get("groupName") as string;
    const groupUrl = formData.get("groupUrl") as string;
    const description = formData.get("description") as string;
    const memberCount = formData.get("memberCount") as string;
    const isActive = formData.get("isActive") === "true";

    if (!localityId || !groupName || !groupUrl) {
      throw new Error("Locality, group name, and Facebook group URL are required");
    }

    // Basic URL validation
    if (!groupUrl.startsWith("http://") && !groupUrl.startsWith("https://")) {
      throw new Error("Please provide a valid URL starting with https://");
    }

    await dbConnect();

    const locality = await Locality.findById(localityId);
    if (!locality) throw new Error("Locality not found");

    const existing = await FacebookGroup.findOne({ localityId });
    const beforeState = existing ? existing.toObject() : undefined;

    let group;
    if (existing) {
      existing.groupName = groupName.trim();
      existing.groupUrl = groupUrl.trim();
      existing.description = description ? description.trim() : undefined;
      existing.memberCount = memberCount ? memberCount.trim() : undefined;
      existing.isActive = isActive;
      await existing.save();
      group = existing;
    } else {
      group = await FacebookGroup.create({
        localityId,
        groupName: groupName.trim(),
        groupUrl: groupUrl.trim(),
        description: description ? description.trim() : undefined,
        memberCount: memberCount ? memberCount.trim() : undefined,
        isActive,
      });
    }

    await logAdminAction({
      actorId: actor.id,
      action: existing ? "update_facebook_group" : "create_facebook_group",
      entityType: "FacebookGroup",
      entityId: group._id,
      beforeState,
      afterState: group.toObject(),
    });

    revalidatePath("/admin/facebook-groups");
    revalidatePath("/search/flats");
    revalidatePath("/search/flatmates");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to save Facebook group") };
  }
}

export async function toggleFacebookGroupStatus(groupId: string, currentStatus: boolean) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const group = await FacebookGroup.findById(groupId);
    if (!group) throw new Error("Facebook group entry not found");

    const beforeState = group.toObject();
    group.isActive = !currentStatus;
    await group.save();

    await logAdminAction({
      actorId: actor.id,
      action: "toggle_facebook_group_status",
      entityType: "FacebookGroup",
      entityId: group._id,
      beforeState,
      afterState: group.toObject(),
    });

    revalidatePath("/admin/facebook-groups");
    revalidatePath("/search/flats");
    revalidatePath("/search/flatmates");
    return { success: true, isActive: group.isActive };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to toggle status") };
  }
}

export async function deleteFacebookGroup(groupId: string) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const group = await FacebookGroup.findById(groupId);
    if (!group) throw new Error("Facebook group entry not found");

    const beforeState = group.toObject();
    await FacebookGroup.findByIdAndDelete(groupId);

    await logAdminAction({
      actorId: actor.id,
      action: "delete_facebook_group",
      entityType: "FacebookGroup",
      entityId: group._id,
      beforeState,
    });

    revalidatePath("/admin/facebook-groups");
    revalidatePath("/search/flats");
    revalidatePath("/search/flatmates");
    return { success: true };
  } catch (error: any) {
    return { error: getFriendlyErrorMessage(error, "Failed to delete Facebook group") };
  }
}
