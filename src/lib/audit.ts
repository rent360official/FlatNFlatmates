import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";

interface AuditParams {
  actorId: string;
  action: string;
  entityType: 'User' | 'Property' | 'VibeUpgradeRequest' | 'City' | 'Locality' | 'PointOfInterest' | 'FeatureFlag' | 'FacebookGroup';
  entityId: string | any;
  beforeState?: any;
  afterState?: any;
}

export async function logAdminAction({
  actorId,
  action,
  entityType,
  entityId,
  beforeState,
  afterState
}: AuditParams) {
  try {
    await dbConnect();
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      beforeState,
      afterState
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
