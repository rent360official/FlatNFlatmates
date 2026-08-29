'use client';

import { useState, useTransition } from "react";
import { confirmPropertyRented, dismissPropertyWarning } from "./actions";
import { Phone, Check, ShieldAlert, AlertTriangle, Eye, EyeOff, Music, MessageSquare } from "lucide-react";

interface CallLogItem {
  _id: string;
  callerName: string;
  callerPhone: string;
  calleeName: string;
  calleePhone: string;
  propertyId?: string;
  propertyTitle?: string;
  providerCallSid: string;
  recordingUrl?: string;
  transcript?: string;
  detectedAvailability: 'available' | 'rented' | 'unknown';
  startedAt: string;
  duration: number;
}

export default function CallLogsTable({ logs }: { logs: CallLogItem[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleConfirmRented = (id: string) => {
    if (!confirm("Are you sure you want to mark this flat as rented and pause the listing?")) {
      return;
    }
    startTransition(async () => {
      const res = await confirmPropertyRented(id);
      if (res.success) {
        alert("Flat soft-delisted successfully!");
      } else {
        alert(res.error || "Failed to confirm rented.");
      }
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      const res = await dismissPropertyWarning(id);
      if (res.success) {
        alert("Availability warning dismissed.");
      } else {
        alert(res.error || "Failed to dismiss warning.");
      }
    });
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Time & ID</th>
              <th className="p-4">Caller</th>
              <th className="p-4">Callee</th>
              <th className="p-4">Target Listing / Seeker</th>
              <th className="p-4">Call Details</th>
              <th className="p-4 text-center">Availability Flag</th>
              <th className="p-4 text-right">Oversight Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((item) => {
              const isExpanded = expandedRow === item._id;
              return (
                <>
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">

                    {/* Time */}
                    <td className="p-4 space-y-1">
                      <span className="font-semibold text-slate-800">
                        {new Date(item.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">{item.providerCallSid}</span>
                    </td>

                    {/* Caller */}
                    <td className="p-4 space-y-0.5">
                      <span className="font-bold text-slate-850">{item.callerName}</span>
                      <span className="text-[10px] text-slate-450 block">{item.callerPhone}</span>
                    </td>

                    {/* Callee */}
                    <td className="p-4 space-y-0.5">
                      <span className="font-bold text-slate-850">{item.calleeName}</span>
                      <span className="text-[10px] text-slate-450 block">{item.calleePhone}</span>
                    </td>

                    {/* Target */}
                    <td className="p-4 max-w-[200px]">
                      {item.propertyTitle ? (
                        <span className="font-semibold text-slate-705 truncate block">{item.propertyTitle}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block italic">Flatmate Connection</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="p-4 space-y-0.5">
                      <span className="text-slate-700 font-semibold">{item.duration} seconds</span>
                      {item.recordingUrl && (
                        <span className="text-[9px] text-brand-primary font-bold block flex items-center">
                          <Music className="h-3 w-3 mr-0.5" /> Recording Logged
                        </span>
                      )}
                    </td>

                    {/* Flag */}
                    <td className="p-4 text-center">
                      {item.detectedAvailability === 'available' && (
                        <span className="inline-flex items-center bg-bg-status-successBg/15 text-brand-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-emerald-100">
                          Available
                        </span>
                      )}
                      {item.detectedAvailability === 'rented' && (
                        <span className="inline-flex items-center bg-brand-secondary/10 text-brand-secondaryHover px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border border-brand-secondary/15 animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Rented
                        </span>
                      )}
                      {item.detectedAvailability === 'unknown' && (
                        <span className="inline-flex items-center bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border">
                          Unknown
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">

                        <button
                          onClick={() => toggleRow(item._id)}
                          className="p-1 border rounded hover:bg-slate-100 text-slate-500 transition-colors"
                          title={isExpanded ? "Hide transcript" : "View transcript"}
                        >
                          {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>

                        {item.detectedAvailability === 'rented' && item.propertyId && (
                          <>
                            <button
                              onClick={() => handleConfirmRented(item._id)}
                              disabled={isPending}
                              className="bg-brand-secondary hover:bg-brand-secondaryHover text-white rounded px-2.5 py-1 text-[10px] font-bold transition-colors"
                            >
                              Confirm Rented
                            </button>
                            <button
                              onClick={() => handleDismiss(item._id)}
                              disabled={isPending}
                              className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded px-2.5 py-1 text-[10px] font-semibold transition-colors"
                            >
                              Dismiss
                            </button>
                          </>
                        )}

                      </div>
                    </td>

                  </tr>

                  {/* Expandable Transcript Row */}
                  {isExpanded && (
                    <tr key={`${item._id}-details`} className="bg-slate-50/50">
                      <td colSpan={7} className="p-4">
                        <div className="space-y-3 bg-white border rounded-xl p-4 shadow-inner max-w-3xl">
                          <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1 text-brand-primary" /> Speech-to-Text Conversation Transcript
                          </h4>

                          <p className="text-xs text-slate-650 font-sans italic leading-relaxed">
                            &ldquo;{item.transcript || "No transcript logged for this call connection."}&rdquo;
                          </p>

                          {item.recordingUrl && (
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-600">Mock Audio:</span>
                              <code>https://s3.ap-south-1.amazonaws.com/flatnflatmate-call-recordings{item.recordingUrl}</code>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-xs text-slate-400 italic">
                  No call networking records logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
