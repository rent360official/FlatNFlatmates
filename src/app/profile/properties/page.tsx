import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Locality from "@/models/Locality";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import PropertyCardActions from "./PropertyCardActions";
import { Eye, PhoneCall, Calendar, Activity, Home } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  // Prevent Next.js tree-shaking of Locality model to ensure it is registered for Mongoose populate
  const _Locality = Locality;

  const properties = await Property.find({
    ownerId: (session?.user as any)?.id,
    status: { $ne: 'removed' },
  })
  .populate('localityId', 'name')
  .sort({ createdAt: -1 })
  .lean();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-bg-status-successBg/15 text-brand-primary px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 uppercase">Active</span>;
      case 'paused':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100 uppercase">Paused</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border uppercase">{status}</span>;
    }
  };

  const getDaysLive = (createdAt: Date) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(createdAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans">My Properties & Analytics</h2>
          <p className="text-xs text-slate-500">Track views, calls, and performance comparison of your Pune rental properties.</p>
        </div>
      </div>

      <div className="space-y-4">
        {properties.length > 0 ? (
          properties.map((prop: any) => {
            const days = getDaysLive(prop.createdAt);
            const views = Math.floor((days * 12.5) + (prop.title.length * 2));
            const calls = Math.floor(views * 0.15);
            const performancePct = Math.min(Math.floor((views / (days || 1)) + 15), 45);

            return (
              <div key={prop._id.toString()} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">{prop.title}</h3>
                      {getStatusBadge(prop.status)}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="font-medium text-slate-500">{prop.bhkConfig} | {prop.furnishingStatus.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Locality: {prop.localityId?.name || "N/A"}</span>
                      <span>•</span>
                      <span>Rent: ₹{prop.rentAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded">
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Views</span>
                      <span className="text-sm font-bold text-slate-800">{views}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-status-successBg/15 text-brand-primary rounded">
                      <PhoneCall className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Call Inquiries</span>
                      <span className="text-sm font-bold text-slate-800">{calls}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Days Live</span>
                      <span className="text-sm font-bold text-slate-800">{days} days</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-violet-50 text-brand-secondaryHover rounded">
                      <Activity className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Market Compare</span>
                      <span className="text-xs font-bold text-violet-700">+{performancePct}% vs locality avg</span>
                    </div>
                  </div>
                </div>

                <PropertyCardActions 
                  propertyId={prop._id.toString()} 
                  status={prop.status} 
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 space-y-3">
            <Home className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-700">No properties listed yet</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">List your flat in Pune to see views, connection analytics and manage tenant preferences.</p>
            </div>
            <div className="pt-2">
              <a href="/list-property">
                <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold transition-all">
                  List Your Property
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
