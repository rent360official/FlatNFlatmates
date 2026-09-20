import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import { isFeatureVisible, FeatureStatus } from '@/lib/featureConstants';

export * from '@/lib/featureConstants';

/**
 * Checks in database whether a given feature flag is active/enabled for the user.
 */
export async function isFeatureActive(key: string, role?: string | null): Promise<boolean> {
  try {
    await dbConnect();
    const flag = await FeatureFlag.findOne({ key }).lean();
    if (!flag) {
      return false;
    }
    return isFeatureVisible(flag.status, role);
  } catch {
    return false;
  }
}
