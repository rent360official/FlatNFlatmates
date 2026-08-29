import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import { isFeatureVisible } from '@/lib/featureAccess';

/**
 * GET /api/features/visible
 * Returns the list of feature keys that are visible to the current user
 * based on their role and each feature's status.
 * Only returns flags with category === 'feature'.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role: string = (session?.user as any)?.role || 'anonymous';

    await dbConnect();
    const features = await FeatureFlag.find({ category: 'feature' }).lean();

    const visibleFeatures: string[] = features
      .filter((f) => isFeatureVisible(f.status as any, role))
      .map((f) => f.key);

    return NextResponse.json({ visibleFeatures, role });
  } catch {
    // Fail open so UI doesn't break on DB errors — return empty
    return NextResponse.json({ visibleFeatures: [], role: 'anonymous' });
  }
}
