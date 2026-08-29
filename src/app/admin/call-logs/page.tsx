import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import User from "@/models/User";
import Property from "@/models/Property";
import CallLogsTable from "./CallLogsTable";
import Link from "next/link";
import { ArrowLeft, Phone, AlertTriangle, ShieldCheck } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminCallLogsPage() {
  let logs: any[] = [];
  const stats = {
    total: 0,
    warnings: 0,
    available: 0,
  };

  try {
    await dbConnect();
    
    // Fetch all logs
    const docs = await CallLog.find()
      .populate('callerUserId', 'name phone')
      .populate('calleeUserId', 'name phone')
      .populate('propertyId', 'title')
      .sort({ startedAt: -1 })
      .lean();

    logs = docs.map((doc: any) => ({
      _id: doc._id.toString(),
      callerName: doc.callerUserId?.name || "Unknown Caller",
      callerPhone: doc.callerUserId?.phone || "N/A",
      calleeName: doc.calleeUserId?.name || "Unknown Callee",
      calleePhone: doc.calleeUserId?.phone || "N/A",
      propertyId: doc.propertyId?._id?.toString(),
      propertyTitle: doc.propertyId?.title,
      providerCallSid: doc.providerCallSid,
      recordingUrl: doc.recordingUrl,
      transcript: doc.transcript,
      detectedAvailability: doc.detectedAvailability || 'unknown',
      startedAt: doc.startedAt.toISOString(),
      duration: doc.duration || 0,
    }));

    stats.total = logs.length;
    stats.warnings = logs.filter(l => l.detectedAvailability === 'rented').length;
    stats.available = logs.filter(l => l.detectedAvailability === 'available').length;

  } catch (error) {
    console.error("Failed to fetch admin call logs:", error);
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div>
        <Link href="/admin" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Operations Center</span>
        </Link>
      </div>

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-brand-primary" />
            Masked Call Logs Oversight
          </h2>
          <p className="text-xs text-slate-500">Monitor in-app telephony connections, review speech-to-text transcripts, and resolve soft availability warnings.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Total Calls Connected</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Availability Alerts (Rented)</span>
          <p className="text-xl font-extrabold text-brand-secondary mt-1">{stats.warnings}</p>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Confirmed Available</span>
          <p className="text-xl font-extrabold text-brand-primary mt-1">{stats.available}</p>
        </div>
      </div>

      {/* Main Table */}
      <CallLogsTable logs={logs} />
    </div>
  );
}
