'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import type { FeatureStatus } from '@/models/FeatureFlag';
import { logAdminAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

/**
 * Only super_admin can change feature management state.
 */
async function getFeatureManagerActor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !['super_admin'].includes(role)) {
    throw new Error('Unauthorized: Only super_admin can manage feature states');
  }
  return session.user as any;
}

/**
 * Update the status of a feature flag (feature category only).
 */
export async function updateFeatureStatus(flagId: string, newStatus: FeatureStatus) {
  try {
    const actor = await getFeatureManagerActor();
    await dbConnect();

    const flag = await FeatureFlag.findById(flagId);
    if (!flag) throw new Error('Feature flag not found');
    if (flag.category !== 'feature') throw new Error('This flag is not a user-facing feature');

    const beforeState = flag.toObject();
    flag.status = newStatus;
    await flag.save();

    await logAdminAction({
      actorId: actor.id,
      action: 'update_feature_status',
      entityType: 'FeatureFlag',
      entityId: flag._id,
      beforeState,
      afterState: flag.toObject(),
    });

    revalidatePath('/admin/features');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update feature status' };
  }
}

/**
 * Create a new managed feature (category: 'feature').
 */
export async function createManagedFeature(formData: FormData) {
  try {
    const actor = await getFeatureManagerActor();
    const key = formData.get('key') as string;
    const label = formData.get('label') as string;
    const description = formData.get('description') as string || undefined;
    const status = (formData.get('status') as FeatureStatus) || 'disabled';

    if (!key || !label) throw new Error('Key and label are required');

    await dbConnect();
    const existing = await FeatureFlag.findOne({ key });
    if (existing) throw new Error(`Feature with key "${key}" already exists`);

    const flag = await FeatureFlag.create({
      key,
      label,
      status,
      category: 'feature',
      description,
    });

    await logAdminAction({
      actorId: actor.id,
      action: 'create_managed_feature',
      entityType: 'FeatureFlag',
      entityId: flag._id,
      afterState: flag.toObject(),
    });

    revalidatePath('/admin/features');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create managed feature' };
  }
}
