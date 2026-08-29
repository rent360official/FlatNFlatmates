import dbConnect from '@/lib/db';
import FeatureFlag from '@/models/FeatureFlag';
import type { FeatureStatus } from '@/models/FeatureFlag';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createManagedFeature } from './actions';
import FeatureStatusSelector from './FeatureStatusSelector';
import { Layers, Plus, EyeOff, FlaskConical, CheckCircle2, Info, Users } from 'lucide-react';
import React from 'react';

export const dynamic = 'force-dynamic';

const STATUS_INFO: Record<FeatureStatus, { label: string; colour: string; desc: string }> = {
  disabled: {
    label: 'Disabled',
    colour: 'bg-slate-100 text-slate-600 border-slate-200',
    desc: 'Hidden from all users',
  },
  testing: {
    label: 'Testing',
    colour: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Visible to owner, super_admin, ops_admin, tester',
  },
  enabled: {
    label: 'Enabled',
    colour: 'bg-bg-status-successBg/15 text-brand-primary border-emerald-200',
    desc: 'Visible to all users',
  },
};

export default async function FeaturesAdminPage() {
  const session = await getServerSession(authOptions);
  const role: string = (session?.user as any)?.role || '';
  const canEdit = ['super_admin'].includes(role);

  await dbConnect();
  const features = await FeatureFlag.find({ category: 'feature' }).sort({ key: 1 }).lean();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-primary" />
            Feature Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control the rollout state of user-facing features across the platform.
          </p>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <Info className="h-3.5 w-3.5" />
            Read-only — only <strong>owner</strong> or <strong>super_admin</strong> can change feature states
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(STATUS_INFO) as [FeatureStatus, typeof STATUS_INFO[FeatureStatus]][]).map(([status, meta]) => {
          const Icon = status === 'disabled' ? EyeOff : status === 'testing' ? FlaskConical : CheckCircle2;
          return (
            <div key={status} className={`flex items-start gap-3 rounded-xl border p-4 ${meta.colour}`}>
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{meta.label}</p>
                <p className="text-[11px] mt-0.5 opacity-80">{meta.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Features List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Registered Features ({features.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {features.map((feature: any) => {
                const status: FeatureStatus = feature.status || 'disabled';
                const meta = STATUS_INFO[status];
                return (
                  <div key={feature._id.toString()} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{feature.label}</span>
                        <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          {feature.key}
                        </code>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.colour}`}>
                          {meta.label}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                      )}
                      {/* Audience hint */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Users className="h-3 w-3" />
                        {meta.desc}
                      </div>
                    </div>
                    {/* Control */}
                    <div className="flex-shrink-0">
                      <FeatureStatusSelector
                        flagId={feature._id.toString()}
                        currentStatus={status}
                        canEdit={canEdit}
                      />
                    </div>
                  </div>
                );
              })}
              {features.length === 0 && (
                <div className="px-6 py-12 text-center text-xs text-slate-400">
                  No features registered yet. Add one using the form on the right.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Feature Form — only visible to editors */}
        {canEdit && (
          <div className="lg:col-span-4">
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 sticky top-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand-primary" />
                Register New Feature
              </h3>
              <form action={createManagedFeature as any} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Feature Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="key"
                    required
                    placeholder="e.g. living_services"
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="label"
                    required
                    placeholder="e.g. Living Services"
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Initial State
                  </label>
                  <select
                    name="status"
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  >
                    <option value="disabled">Disabled (safe default)</option>
                    <option value="testing">Testing (internal only)</option>
                    <option value="enabled">Enabled (all users)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What feature does this toggle control?"
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors"
                >
                  Register Feature
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
