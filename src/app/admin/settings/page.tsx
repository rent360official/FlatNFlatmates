import dbConnect from "@/lib/db";
import FeatureFlag from "@/models/FeatureFlag";
import { createFeatureFlag, updateMediaLimitsConfig } from "./actions";
import { getMediaUploadConfig } from "@/lib/mediaConfig";
import FlagToggle from "./FlagToggle";
import { Settings, Plus, Film, Image as ImageIcon, Save, ShieldCheck } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function SettingsAdminPage() {
  await dbConnect();
  
  const flags = await FeatureFlag.find({ category: 'system_config' }).sort({ key: 1 }).lean();
  const mediaConfig = await getMediaUploadConfig();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Configuration & Platform Settings</h2>
        <p className="text-xs text-slate-500">Configure global platform limits (media upload quotas and size restrictions) and dynamic backend toggles without deploying new code.</p>
      </div>

      {/* Media Upload Limits Config Section */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Film className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Media Upload Limits & Constraints
            </h3>
            <p className="text-xs text-slate-500">Control the maximum number of videos/photos and max file sizes allowed per property listing on the platform.</p>
          </div>
          <span className="inline-flex items-center text-[11px] font-semibold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full border border-brand-primary/20">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Live Platform Rules
          </span>
        </div>

        <form action={updateMediaLimitsConfig as any} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Max Videos */}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <Film className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                Max Videos Per Listing
              </label>
              <input
                type="number"
                name="max_property_videos"
                defaultValue={mediaConfig.maxPropertyVideos}
                min="1"
                max="20"
                required
                className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-white outline-brand-primary"
              />
              <p className="text-[10px] text-slate-400">Default: 5 videos</p>
            </div>

            {/* Max Video Size MB */}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <Film className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                Max Video Size (MB)
              </label>
              <input
                type="number"
                name="max_video_size_mb"
                defaultValue={mediaConfig.maxVideoSizeMb}
                min="5"
                max="500"
                required
                className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-white outline-brand-primary"
              />
              <p className="text-[10px] text-slate-400">Default: 100 MB per video</p>
            </div>

            {/* Max Images */}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                Max Images Per Listing
              </label>
              <input
                type="number"
                name="max_property_images"
                defaultValue={mediaConfig.maxPropertyImages}
                min="1"
                max="50"
                required
                className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-white outline-brand-primary"
              />
              <p className="text-[10px] text-slate-400">Default: 10 images</p>
            </div>

            {/* Max Image Size MB */}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                Max Image Size (MB)
              </label>
              <input
                type="number"
                name="max_image_size_mb"
                defaultValue={mediaConfig.maxImageSizeMb}
                min="1"
                max="50"
                required
                className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-white outline-brand-primary"
              />
              <p className="text-[10px] text-slate-400">Default: 10 MB per image</p>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-5 py-2.5 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>Save Media Constraints</span>
            </button>
          </div>
        </form>
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
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
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
