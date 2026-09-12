import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import { isFeatureVisible, FeatureStatus } from '@/lib/featureConstants';

export * from '@/lib/featureConstants';

/**
 * Checks in database whether a given feature flag is active/enabled for the user.
 */
export async function isFeatureActive(key: string, role?: string | null): Promise<boolean> {
  await dbConnect();
  const flag = await FeatureFlag.findOne({ key }).lean();
  if (!flag) {
    // If flag doesn't exist yet, default to enabled for core features or disabled
    return true;
  }
  return isFeatureVisible(flag.status, role);
}
