import dbConnect from "@/lib/db";
import FeatureFlag from "@/models/FeatureFlag";
import { createFeatureFlag } from "./actions";
import FlagToggle from "./FlagToggle";
import { Settings, Plus } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function SettingsAdminPage() {
  await dbConnect();
  
  const flags = await FeatureFlag.find({ category: 'system_config' }).sort({ key: 1 }).lean();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Configuration & Feature Toggles</h2>
        <p className="text-xs text-slate-500">Enable or disable backend system configs dynamically without deploying new code. For user-facing feature rollouts, use <a href="/admin/features" className="text-brand-primary hover:underline font-semibold">Feature Management</a>.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Create Flag Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Plus className="mr-2 h-4 w-4 text-brand-primary" />
              Add Feature Configuration
            </h3>
            <form action={createFeatureFlag as any} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Configuration Key</label>
                <input 
                  type="text" 
                  name="key" 
                  required
                  placeholder="e.g. vibe_upgrade_enabled" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Default Value</label>
                <select name="value" required className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                  <option value="true">True (Enabled)</option>
                  <option value="false">False (Disabled)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  name="description" 
                  placeholder="What feature does this config toggle?" 
                  rows={3}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors"
              >
                Create Flag
              </button>
            </form>
          </div>
        </div>

        {/* Flags List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Settings className="mr-2 h-4 w-4 text-brand-primary" />
              Active System Toggles ({flags.length})
            </h3>
            
            <div className="divide-y divide-gray-100">
              {flags.map((flag: any) => (
                <div key={flag._id.toString()} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <code className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {flag.key}
                      </code>
                      {flag.value === true ? (
                        <span className="text-[9px] bg-bg-status-successBg/15 text-brand-primary px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border">
                          Off
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {flag.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FlagToggle flag={JSON.parse(JSON.stringify(flag))} />
                  </div>
                </div>
              ))}
              {flags.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No feature configurations added yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
