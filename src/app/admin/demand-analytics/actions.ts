'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getDemandAnalytics, type DemandOverviewData } from "@/lib/demandAnalytics";

async function verifyAdminAuth() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAuthorized = ['super_admin', 'ops_admin'].includes(role);
  if (!session || !isAuthorized) {
    throw new Error("Forbidden: Access restricted to super_admin and ops_admin");
  }
  return session.user;
}

export async function fetchDemandAnalyticsAction(
  timeRangeDays: number = 30,
  locality: string = 'all'
): Promise<{ success: boolean; data?: DemandOverviewData; error?: string }> {
  try {
    await verifyAdminAuth();
    const data = await getDemandAnalytics(timeRangeDays, locality);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch analytics data" };
  }
}
