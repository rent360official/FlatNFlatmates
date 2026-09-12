import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Locality from '@/models/Locality';
import { getDemandAnalytics } from '@/lib/demandAnalytics';
import DemandAnalyticsClient from './DemandAnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function DemandAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || '';
  const isAuthorized = ['super_admin', 'ops_admin'].includes(role);

  if (!session || !isAuthorized) {
    redirect('/admin');
  }

  await dbConnect();

  // Fetch available localities for the dropdown
  const localities = await Locality.find({ isActive: true }).sort({ name: 1 }).lean();
  const availableLocalities = localities.map((l: any) => l.name);

  // Fetch default 30-day analytics data
  const initialData = await getDemandAnalytics(30, 'all');

  return (
    <DemandAnalyticsClient
      initialData={initialData}
      availableLocalities={availableLocalities}
    />
  );
}
