import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Locality from '@/models/Locality';
import FacebookGroup from '@/models/FacebookGroup';
import FeatureFlag from '@/models/FeatureFlag';
import FacebookGroupsManager from './FacebookGroupsManager';
import { Share2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminFacebookGroupsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || '';
  const isAuthorized = ['super_admin', 'ops_admin'].includes(role);

  if (!session || !isAuthorized) {
    redirect('/admin');
  }

  const canEdit = true;

  await dbConnect();

  // Ensure the feature flag exists in Feature Management
  let featureFlag = await FeatureFlag.findOne({ key: 'facebook_community_cta' }).lean();
  if (!featureFlag) {
    featureFlag = await FeatureFlag.create({
      key: 'facebook_community_cta',
      label: 'Facebook Community CTA',
      category: 'feature',
      status: 'enabled',
      description: 'Shows landscape Facebook community group CTA on /search/flats and /search/flatmates with locality redirection modal',
    });
  }

  const localities = await Locality.find({ isActive: true }).sort({ name: 1 }).lean();
  const facebookGroups = await FacebookGroup.find().lean();

  const groupMap = new Map();
  facebookGroups.forEach((g: any) => {
    groupMap.set(g.localityId.toString(), {
      _id: g._id.toString(),
      groupName: g.groupName,
      groupUrl: g.groupUrl,
      description: g.description,
      memberCount: g.memberCount,
      isActive: g.isActive,
      updatedAt: g.updatedAt ? new Date(g.updatedAt).toISOString() : undefined,
    });
  });

  const localitiesWithGroups = localities.map((loc: any) => ({
    localityId: loc._id.toString(),
    localityName: loc.name,
    group: groupMap.get(loc._id.toString()) || null,
  }));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Share2 className="h-6 w-6 text-[#1877F2]" />
            <span>Facebook Community Groups</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure locality-specific Facebook groups that users can join directly from search pages.
          </p>
        </div>

        {/* Feature status pill with shortcut to Feature Management */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border bg-white shadow-xs text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Feature Status:</span>
            <span className={`inline-flex items-center space-x-1 font-bold text-[11px] ${
              featureFlag.status === 'enabled'
                ? 'text-emerald-700'
                : featureFlag.status === 'testing'
                ? 'text-amber-700'
                : 'text-slate-500'
            }`}>
              {featureFlag.status === 'enabled' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              {featureFlag.status === 'testing' && <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
              <span className="uppercase tracking-wide">{featureFlag.status}</span>
            </span>
          </div>

          <Link
            href="/admin/features"
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Manage Rollout</span>
          </Link>
        </div>
      </div>

      {/* Main Table & Controls */}
      <FacebookGroupsManager
        localitiesWithGroups={localitiesWithGroups}
        canEdit={canEdit}
      />
    </div>
  );
}
