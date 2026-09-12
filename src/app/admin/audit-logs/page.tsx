import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import AuditLogsTable, { AuditLogItem } from "./AuditLogsTable";
import Link from "next/link";
import { ArrowLeft, ListCollapse, History, Shield, Activity, Users } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  let logs: AuditLogItem[] = [];
  const stats = {
    total: 0,
    last24Hours: 0,
    uniqueActors: 0,
    entityTypesCount: 0,
  };

  try {
    await dbConnect();

    // Ensure User model is registered for populate
    const _userModel = User;

    const rawDocs = await AuditLog.find()
      .populate('actorId', 'name email phone role')
      .sort({ timestamp: -1 })
      .lean();

    const actorsSet = new Set<string>();
    const entityTypesSet = new Set<string>();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    logs = rawDocs.map((doc: any) => {
      const actor = doc.actorId;
      const actorIdStr = actor?._id ? actor._id.toString() : (typeof doc.actorId === 'string' ? doc.actorId : 'system');
      actorsSet.add(actorIdStr);

      if (doc.entityType) {
        entityTypesSet.add(doc.entityType);
      }

      if (doc.timestamp && new Date(doc.timestamp) >= oneDayAgo) {
        stats.last24Hours += 1;
      }

      return {
        _id: doc._id.toString(),
        actorName: actor?.name || (actor?.phone ? `User (${actor.phone})` : "System / Direct"),
        actorEmail: actor?.email || undefined,
        actorPhone: actor?.phone || undefined,
        actorRole: actor?.role || undefined,
        action: doc.action || "UNKNOWN_ACTION",
        entityType: doc.entityType || "Unknown",
        entityId: doc.entityId ? doc.entityId.toString() : "N/A",
        beforeState: doc.beforeState ? JSON.parse(JSON.stringify(doc.beforeState)) : null,
        afterState: doc.afterState ? JSON.parse(JSON.stringify(doc.afterState)) : null,
        timestamp: doc.timestamp ? new Date(doc.timestamp).toISOString() : new Date().toISOString(),
      };
    });

    stats.total = logs.length;
    stats.uniqueActors = actorsSet.size;
    stats.entityTypesCount = entityTypesSet.size;

  } catch (error) {
    console.error("Failed to fetch admin audit logs:", error);
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Operations Center</span>
        </Link>
      </div>

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <ListCollapse className="h-5 w-5 mr-2 text-brand-primary" />
            System Audit Trail & Security Logs
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of all backoffice operations, administrative edits, role changes, verification updates, and feature flag toggles.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Logged Events
            </span>
            <History className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1.5">{stats.total}</p>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Events (Last 24h)
            </span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-1.5">{stats.last24Hours}</p>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Active Admin Actors
            </span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-600 mt-1.5">{stats.uniqueActors}</p>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Audited Entity Types
            </span>
            <Shield className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-xl font-extrabold text-violet-600 mt-1.5">{stats.entityTypesCount}</p>
        </div>
      </div>

      {/* Main Table with Filter & Inspection */}
      <AuditLogsTable logs={logs} />
    </div>
  );
}
