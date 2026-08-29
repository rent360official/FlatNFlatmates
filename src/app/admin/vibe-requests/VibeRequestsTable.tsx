'use client';

import { useState, useTransition } from "react";
import { verifyAndCompleteVibeRequest, releaseVibeDeposit } from "./actions";
import { Check, Coins, Ticket, Lock, Unlock, Clock, User, Home, ShieldAlert } from "lucide-react";

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
  const [otps, setOtps] = useState<{ [key: string]: string }>({});
  const [isPending, startTransition] = useTransition();

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

  return (
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
            {requests.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                
                {/* Tenant Details */}
                <td className="p-4 space-y-1">
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
                <td className="p-4 space-y-1">
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
                  {item.status === 'completed' && (
                    <span className="inline-flex items-center bg-bg-status-successBg/15 text-brand-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-emerald-100" title={`Completed at ${item.completedAt ? new Date(item.completedAt).toLocaleString() : ''}`}>
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
                          {/* Dev tool tip: display correct OTP for test operations */}
                          <span className="text-[8px] text-slate-350 select-none">OTP: {item.otp}</span>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="OTP Code"
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

            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-xs text-slate-400 italic">
                  No Vibe Upgrade requests found in the operations pipeline.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
