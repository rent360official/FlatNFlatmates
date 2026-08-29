import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
import CallLog from "@/models/CallLog";
import AuditLog from "@/models/AuditLog";
import { 
  Users, Home, Sparkles, Phone, 
  ArrowUpRight, ListTodo, History
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = {
    users: 0,
    properties: 0,
    vibeRequests: 0,
    calls: 0
  };

  const propertyStatuses = {
    active: 0,
    draft: 0,
    paused: 0,
    removed: 0
  };

  const vibeStatuses = {
    requested: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  };

  let recentLogs: any[] = [];

  try {
    await dbConnect();
    stats.users = await User.countDocuments();
    stats.properties = await Property.countDocuments();
    stats.vibeRequests = await VibeUpgradeRequest.countDocuments();
    stats.calls = await CallLog.countDocuments();

    propertyStatuses.active = await Property.countDocuments({ status: 'active' });
    propertyStatuses.draft = await Property.countDocuments({ status: 'draft' });
    propertyStatuses.paused = await Property.countDocuments({ status: 'paused' });
    propertyStatuses.removed = await Property.countDocuments({ status: 'removed' });

    vibeStatuses.requested = await VibeUpgradeRequest.countDocuments({ status: 'requested' });
    vibeStatuses.in_progress = await VibeUpgradeRequest.countDocuments({ status: 'in_progress' });
    vibeStatuses.completed = await VibeUpgradeRequest.countDocuments({ status: 'completed' });
    vibeStatuses.cancelled = await VibeUpgradeRequest.countDocuments({ status: 'cancelled' });

    recentLogs = await AuditLog.find()
      .populate('actorId', 'name phone')
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();
  } catch (error) {
    console.error("Dashboard database fetch failed:", error);
  }

  const statCards = [
    { name: "Total Users Onboarded", value: stats.users, icon: Users, href: "/admin/users", color: "indigo" },
    { name: "Total Property Listings", value: stats.properties, icon: Home, href: "/admin/properties", color: "sky" },
    { name: "Vibe Upgrade Requests", value: stats.vibeRequests, icon: Sparkles, href: "/admin/vibe-requests", color: "violet" },
    { name: "Masked Connected Calls", value: stats.calls, icon: Phone, href: "/admin/call-logs", color: "emerald" },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Operations Control Center</h2>
          <p className="text-xs text-slate-500">Real-time status overview of Pune housing listings and user matches.</p>
        </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-status-successBg/15/50 border border-emerald-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Active</span>
                <p className="text-xl font-bold text-emerald-950 mt-1">{propertyStatuses.active}</p>
              </div>
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Drafts</span>
                <p className="text-xl font-bold text-amber-950 mt-1">{propertyStatuses.draft}</p>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Paused</span>
                <p className="text-xl font-bold text-slate-950 mt-1">{propertyStatuses.paused}</p>
              </div>
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
              <div className="p-4 bg-brand-primary/10/50 border border-brand-primary/15 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primaryHover uppercase tracking-wider">In Progress</span>
                <p className="text-xl font-bold text-brand-secondary mt-1">{vibeStatuses.in_progress}</p>
              </div>
              <div className="p-4 bg-status-successBg/15/50 border border-emerald-100 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Completed</span>
                <p className="text-xl font-bold text-emerald-950 mt-1">{vibeStatuses.completed}</p>
              </div>
              <div className="p-4 bg-brand-secondary/10/50 border border-brand-secondary/15 rounded-lg text-center">
                <span className="text-[10px] font-bold text-brand-secondaryHover uppercase tracking-wider">Cancelled</span>
                <p className="text-xl font-bold text-brand-secondary mt-1">{vibeStatuses.cancelled}</p>
              </div>
            </div>
          </div>

          {/* Simple conversion funnel stub */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Conversion Funnel Overview
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Search Queries Initiated</span>
                  <span>100% (1,450 searches)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Listing View Detail Clicks</span>
                  <span>62% (899 views)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Connect Inquiries (Call Networking)</span>
                  <span>18% (261 connections)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-brand-primary/60 h-full rounded-full" style={{ width: '18%' }}></div>
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
    </div>
  );
}
