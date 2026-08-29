import dbConnect from "@/lib/db";
import VibeUpgradeRequest from "@/models/VibeUpgradeRequest";
import User from "@/models/User";
import Property from "@/models/Property";
import VibeUpgradePackage from "@/models/VibeUpgradePackage";
import VibeRequestsTable from "./VibeRequestsTable";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminVibeRequestsPage() {
  let requests: any[] = [];
  const stats = {
    total: 0,
    pending: 0,
    completed: 0,
    heldDeposit: 0,
  };

  try {
    await dbConnect();
    
    // Fetch all requests populated with relevant relationships
    const docs = await VibeUpgradeRequest.find()
      .populate('userId', 'name phone')
      .populate('propertyId', 'title')
      .populate('packageId', 'name')
      .populate('completedByAdminId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    requests = docs.map((doc: any) => ({
      _id: doc._id.toString(),
      tenantName: doc.userId?.name || "Unknown Tenant",
      tenantPhone: doc.userId?.phone || "N/A",
      packageName: doc.packageId?.name || "Deleted Package",
      propertyTitle: doc.propertyId?.title || "Deleted Property",
      monthlyAddonAmount: doc.packageId?.monthlyAddonAmount || 0,
      refundableDepositAmount: doc.packageId?.refundableDepositAmount || 0,
      status: doc.status,
      depositRefundStatus: doc.depositRefundStatus,
      otp: doc.otp,
      completedByAdminName: doc.completedByAdminId?.name,
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : undefined,
      createdAt: doc.createdAt.toISOString(),
    }));

    stats.total = requests.length;
    stats.pending = requests.filter(r => r.status === 'requested').length;
    stats.completed = requests.filter(r => r.status === 'completed').length;
    stats.heldDeposit = requests.filter(r => r.depositRefundStatus === 'held').length;

  } catch (error) {
    console.error("Failed to fetch admin vibe requests:", error);
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
            <Sparkles className="h-5 w-5 mr-2 text-brand-primary" />
            Vibe Upgrade Operations Queue
          </h2>
          <p className="text-xs text-slate-500">Verify installation codes and manage accessory security deposits for Pune tenants.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Requests</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending setup</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed setups</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deposits held</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.heldDeposit}</p>
        </div>
      </div>

      {/* Main Table */}
      <VibeRequestsTable requests={requests} />
    </div>
  );
}
