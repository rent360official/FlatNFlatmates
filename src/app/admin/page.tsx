import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
import PropertyInquiry from "@/models/PropertyInquiry";
import AuditLog from "@/models/AuditLog";
import { getDemandAnalytics } from "@/lib/demandAnalytics";
import { 
  Users, Home, Sparkles, MessageSquare, 
  ArrowUpRight, ListTodo, History, TrendingUp, MapPin, Search, Database
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const propertyCollectorUrl = process.env.PROPERTY_COLLECTOR_URL || process.env.NEXT_PUBLIC_PROPERTY_COLLECTOR_URL;
  const stats = {
    users: 0,
    properties: 0,
    vibeRequests: 0,
    inquiries: 0
  };

  const propertyStatuses = {
    active: 0,
    draft: 0,
    paused: 0,
    pending_owner_approval: 0,
    removed: 0
  };

  const vibeStatuses = {
    requested: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  };

  let recentLogs: any[] = [];
  let totalViews = 0;

  try {
    await dbConnect();
    stats.users = await User.countDocuments();
    stats.properties = await Property.countDocuments();
    stats.vibeRequests = await VibeUpgradeRequest.countDocuments();
    stats.inquiries = await PropertyInquiry.countDocuments();

    propertyStatuses.active = await Property.countDocuments({ status: 'active' });
    propertyStatuses.draft = await Property.countDocuments({ status: 'draft' });
    propertyStatuses.paused = await Property.countDocuments({ status: 'paused' });
    propertyStatuses.pending_owner_approval = await Property.countDocuments({ status: 'pending_owner_approval' });
    propertyStatuses.removed = await Property.countDocuments({ status: 'removed' });

    vibeStatuses.requested = await VibeUpgradeRequest.countDocuments({ status: 'requested' });
    vibeStatuses.in_progress = await VibeUpgradeRequest.countDocuments({ status: 'in_progress' });
    vibeStatuses.completed = await VibeUpgradeRequest.countDocuments({ status: 'completed' });
    vibeStatuses.cancelled = await VibeUpgradeRequest.countDocuments({ status: 'cancelled' });

    const viewsAgg = await Property.aggregate([{ $group: { _id: null, totalViews: { $sum: "$viewsCount" } } }]);
    totalViews = viewsAgg[0]?.totalViews || 0;

    recentLogs = await AuditLog.find()
      .populate('actorId', 'name phone')
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();
  } catch (error) {
    console.error("Dashboard database fetch failed:", error);
  }

  let demandData: any = null;
  try {
    demandData = await getDemandAnalytics(7, 'all');
  } catch (err) {
    console.error("Failed to fetch demand analytics for dashboard:", err);
  }

  const statCards = [
    { name: "Total Users Onboarded", value: stats.users, icon: Users, href: "/admin/users", color: "indigo" },
    { name: "Total Property Listings", value: stats.properties, icon: Home, href: "/search/flats", color: "sky" },
    { name: "Vibe Upgrade Requests", value: stats.vibeRequests, icon: Sparkles, href: "/admin/vibe-requests", color: "violet" },
    { name: "Direct Property Inquiries", value: stats.inquiries, icon: MessageSquare, href: "/admin/users", color: "emerald" },
  ];

  // Dynamic funnel calculations based on real platform activity
  const activeRatio = stats.properties > 0 ? Math.round((propertyStatuses.active / stats.properties) * 100) : 0;
  const inquiriesPerListing = stats.properties > 0 ? (stats.inquiries / stats.properties).toFixed(1) : "0";
  const viewsPerListing = stats.properties > 0 ? Math.round(totalViews / stats.properties) : 0;
  const vibeAdoptionRatio = stats.users > 0 ? Math.round((stats.vibeRequests / stats.users) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Operations Control Center</h2>
          <p className="text-xs text-slate-500">Real-time status overview of platform housing listings, telephony connections, and user matches.</p>
        </div>
        {propertyCollectorUrl && (
          <a
            href={propertyCollectorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors group"
          >
            <Database className="h-4 w-4 text-brand-primary" />
            <span>Open Property Collector</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </a>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.name}</span>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 text-slate-700 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px] text-slate-500">
                <span>View Details</span>
                <Link href={card.href}>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 hover:text-brand-primary cursor-pointer" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Listings & Vibe Pipelines */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <ListTodo className="mr-2 h-4 w-4 text-brand-primary" />
              Listing Pipelines (Property Status)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Active</span>
                <p className="text-xl font-bold text-emerald-950 mt-1">{propertyStatuses.active}</p>
              </div>
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Drafts</span>
                <p className="text-xl font-bold text-amber-950 mt-1">{propertyStatuses.draft}</p>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Paused</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{propertyStatuses.paused}</p>
              </div>
              <Link
                href="/admin/pending-approvals"
                className="p-4 bg-violet-50/50 hover:bg-violet-100/70 border border-violet-200 rounded-lg text-center transition-all block group"
              >
                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider group-hover:underline">
                  Pending Approval →
                </span>
                <p className="text-xl font-bold text-violet-950 mt-1">{propertyStatuses.pending_owner_approval}</p>
              </Link>
              <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Removed</span>
                <p className="text-xl font-bold text-red-950 mt-1">{propertyStatuses.removed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-brand-primary" />
              Vibe Upgrade Request Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50/80 border rounded-lg text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requested</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{vibeStatuses.requested}</p>
              </div>
              <div className="p-4 bg-brand-primary/10 border border-brand-primary/15 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primaryHover uppercase tracking-wider">In Progress</span>
                <p className="text-xl font-bold text-brand-secondary mt-1">{vibeStatuses.in_progress}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Completed</span>
                <p className="text-xl font-bold text-emerald-950 mt-1">{vibeStatuses.completed}</p>
              </div>
              <div className="p-4 bg-brand-secondary/10/50 border border-brand-secondary/15 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-secondaryHover uppercase tracking-wider">Cancelled</span>
                <p className="text-xl font-bold text-brand-secondary mt-1">{vibeStatuses.cancelled}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Platform Engagement Metrics */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Platform Engagement & Conversion Activity
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Active Listings Ratio</span>
                  <span className="font-semibold text-slate-800">{activeRatio}% ({propertyStatuses.active} of {stats.properties} listings)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: `${Math.max(5, activeRatio)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Total Listing Impressions / Views</span>
                  <span className="font-semibold text-slate-800">{totalViews.toLocaleString()} views ({viewsPerListing} avg/listing)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(5, totalViews > 0 ? 80 : 0))}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Direct Property Inquiries (Calls, WhatsApp & SMS)</span>
                  <span className="font-semibold text-slate-800">{stats.inquiries} inquiries ({inquiriesPerListing} per listing)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(5, stats.inquiries > 0 ? 65 : 0))}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Vibe Package Conversion Ratio</span>
                  <span className="font-semibold text-slate-800">{vibeAdoptionRatio}% ({stats.vibeRequests} requests across {stats.users} users)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full transition-all" style={{ width: `${Math.max(5, vibeAdoptionRatio)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col h-full space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <History className="mr-2 h-4 w-4 text-brand-primary" />
              Recent Operations Log
            </h3>
            
            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto space-y-3 pr-1 max-h-[420px]">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div key={log._id.toString()} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Admin <strong className="text-slate-800">{log.actorId?.name || log.actorId?.phone || 'System'}</strong> modified {log.entityType}.
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No admin activities logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demand & Search Intelligence Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-blue-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">
              <TrendingUp className="h-3 w-3" />
              <span>Real-Time Seeker Demand (Last 7 Days)</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Platform Demand & Search Velocity
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Track what prospective tenants and flatmate seekers are actively searching for across Pune localities, budgets, and room configurations.
            </p>
          </div>

          {/* Quick Snapshot Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">7D Searches</span>
              <span className="text-lg font-black text-white">{demandData?.totalSearches ?? 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Top Locality</span>
              <span className="text-xs font-bold text-emerald-300 block truncate mt-1">
                {demandData?.topLocalities?.[0]?.locality || '—'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Top BHK</span>
              <span className="text-xs font-bold text-blue-300 block mt-1">
                {demandData?.bhkDistribution?.[0]?.bhk || '—'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Avg Budget</span>
              <span className="text-xs font-bold text-amber-300 block mt-1">
                {demandData?.averageBudget ? `₹${demandData.averageBudget.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Link href="/admin/demand-analytics">
              <button className="w-full lg:w-auto inline-flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-xs transition-all cursor-pointer">
                <span>Explore Full Demand Analytics</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
