'use client';

import React, { useState, useMemo, useTransition } from "react";
import { verifyAndCompleteVibeRequest, releaseVibeDeposit } from "./actions";
import { Check, Coins, Ticket, Lock, Unlock, Clock, User, Home, ShieldAlert, Search, Filter } from "lucide-react";

interface RequestItem {
  _id: string;
  tenantName: string;
  tenantPhone: string;
  packageName: string;
  propertyTitle: string;
  monthlyAddonAmount: number;
  refundableDepositAmount: number;
  status: 'requested' | 'in_progress' | 'completed' | 'cancelled';
  depositRefundStatus: 'held' | 'released';
  otp: string; 
  completedByAdminName?: string;
  completedAt?: string;
  createdAt: string;
}

export default function VibeRequestsTable({ requests }: { requests: RequestItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depositFilter, setDepositFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [otps, setOtps] = useState<{ [key: string]: string }>({});
  const [isPending, startTransition] = useTransition();
  const pageSize = 15;

  const handleOtpChange = (id: string, value: string) => {
    setOtps({ ...otps, [id]: value });
  };

  const handleVerify = (id: string) => {
    const code = otps[id];
    if (!code) {
      alert("Please enter the verification OTP first.");
      return;
    }

    startTransition(async () => {
      const res = await verifyAndCompleteVibeRequest(id, code);
      if (res.success) {
        alert("OTP verified! Vibe request marked as completed.");
        setOtps({ ...otps, [id]: "" });
      } else {
        alert(res.error || "Failed to verify OTP.");
      }
    });
  };

  const handleRelease = (id: string) => {
    if (!confirm("Are you sure you want to release this tenant's security deposit?")) {
      return;
    }

    startTransition(async () => {
      const res = await releaseVibeDeposit(id);
      if (res.success) {
        alert("Deposit released successfully!");
      } else {
        alert(res.error || "Failed to release deposit.");
      }
    });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.tenantName.toLowerCase().includes(q) ||
        item.tenantPhone.includes(q) ||
        item.packageName.toLowerCase().includes(q) ||
        item.propertyTitle.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesDeposit = depositFilter === "all" || item.depositRefundStatus === depositFilter;

      return matchesSearch && matchesStatus && matchesDeposit;
    });
  }, [requests, searchQuery, statusFilter, depositFilter]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, phone, package, property..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Request Statuses</option>
              <option value="requested">Requested</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={depositFilter}
              onChange={(e) => {
                setDepositFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Deposits</option>
              <option value="held">Held in Escrow</option>
              <option value="released">Released</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== "all" || depositFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setDepositFilter("all");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-brand-primary hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Tenant Details</th>
                <th className="p-4">Upgrade Package</th>
                <th className="p-4">Target Property</th>
                <th className="p-4">Pricing</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Deposit</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRequests.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Tenant Details */}
                  <td className="p-4 space-y-1 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">{item.tenantName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block pl-5">{item.tenantPhone}</span>
                  </td>

                  {/* Package */}
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{item.packageName}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Submitted: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </td>

                  {/* Property */}
                  <td className="p-4 space-y-1 max-w-[200px]">
                    <div className="flex items-center space-x-1.5">
                      <Home className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{item.propertyTitle}</span>
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="p-4 space-y-1 whitespace-nowrap">
                    <div className="flex items-center text-slate-700 font-semibold">
                      <span>Rent: +₹{item.monthlyAddonAmount.toLocaleString()}/mo</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Deposit: ₹{item.refundableDepositAmount.toLocaleString()}</span>
                  </td>

                  {/* Request Status */}
                  <td className="p-4 text-center">
                    {item.status === 'requested' && (
                      <span className="inline-flex items-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border">
                        Requested
                      </span>
                    )}
                    {item.status === 'in_progress' && (
                      <span className="inline-flex items-center bg-brand-primary/10 text-brand-primaryHover px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-brand-primary/15">
                        In Progress
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-emerald-200" title={`Completed at ${item.completedAt ? new Date(item.completedAt).toLocaleString() : ''}`}>
                        Completed
                      </span>
                    )}
                    {item.status === 'cancelled' && (
                      <span className="inline-flex items-center bg-brand-secondary/10 text-brand-secondaryHover px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-brand-secondary/15">
                        Cancelled
                      </span>
                    )}
                  </td>

                  {/* Deposit Refund Status */}
                  <td className="p-4 text-center">
                    {item.depositRefundStatus === 'held' ? (
                      <span className="inline-flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-amber-100">
                        <Lock className="h-3 w-3 mr-1" /> Held
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-sky-100">
                        <Unlock className="h-3 w-3 mr-1" /> Released
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center space-x-2">
                      {/* OTP verification box */}
                      {item.status === 'requested' && (
                        <div className="flex items-center space-x-1.5 bg-slate-50 border rounded-lg p-1">
                          <div className="flex items-center space-x-1 px-1">
                            <Ticket className="h-3 w-3 text-brand-primary" />
                            <span className="text-[8px] text-slate-400 select-none">OTP: {item.otp}</span>
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="OTP"
                            value={otps[item._id] || ""}
                            onChange={(e) => handleOtpChange(item._id, e.target.value)}
                            className="w-16 border rounded bg-white px-1.5 py-0.5 text-center text-xs font-bold outline-brand-primary"
                          />
                          <button
                            onClick={() => handleVerify(item._id)}
                            disabled={isPending}
                            className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded px-2.5 py-0.5 text-[10px] font-bold transition-colors"
                          >
                            Verify
                          </button>
                        </div>
                      )}

                      {/* Deposit Release button */}
                      {item.status === 'completed' && item.depositRefundStatus === 'held' && (
                        <button
                          onClick={() => handleRelease(item._id)}
                          disabled={isPending}
                          className="bg-sky-600 hover:bg-sky-700 text-white rounded px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center space-x-1 shadow-sm"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          <span>Release Deposit</span>
                        </button>
                      )}

                      {/* Idle state */}
                      {item.status === 'completed' && item.depositRefundStatus === 'released' && (
                        <span className="text-[10px] text-slate-400 flex items-center pr-2">
                          <Check className="h-4 w-4 text-brand-primary mr-1" /> Request Closed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-xs text-slate-400 italic">
                    {requests.length === 0
                      ? "No Vibe Upgrade requests found in the operations pipeline."
                      : "No requests match the filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} entries
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
