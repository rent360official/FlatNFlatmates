import dbConnect from "@/lib/db";
import Locality from "@/models/Locality";
import FacebookGroup from "@/models/FacebookGroup";
import FeatureFlag from "@/models/FeatureFlag";
import { isFeatureVisible } from "@/lib/featureAccess";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export interface ActiveFacebookGroupDTO {
  _id: string;
  localityId: string;
  localityName: string;
  groupName: string;
  groupUrl: string;
  description?: string;
  memberCount?: string;
}

export async function getActiveFacebookGroups(): Promise<ActiveFacebookGroupDTO[]> {
  try {
    await dbConnect();

    // Check Feature Management
    let flag = await FeatureFlag.findOne({ key: 'facebook_community_cta' }).lean();
    if (!flag) {
      // Auto-initialize feature flag if missing
      flag = await FeatureFlag.create({
        key: 'facebook_community_cta',
        label: 'Facebook Community CTA',
        category: 'feature',
        status: 'enabled',
        description: 'Shows landscape Facebook community group CTA on /search/flats and /search/flatmates with locality redirection modal',
      });
    }

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!isFeatureVisible(flag.status, role)) {
      return [];
    }

    // Fetch active groups with populated locality
    const groups = await FacebookGroup.find({ isActive: true })
      .populate('localityId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    return groups
      .filter((g: any) => g.localityId && g.localityId.name)
      .map((g: any) => ({
        _id: g._id.toString(),
        localityId: g.localityId._id.toString(),
        localityName: g.localityId.name,
        groupName: g.groupName,
        groupUrl: g.groupUrl,
        description: g.description,
        memberCount: g.memberCount,
      }));
  } catch (error) {
    console.error("Failed to load active Facebook groups:", error);
    return [];
  }
}
