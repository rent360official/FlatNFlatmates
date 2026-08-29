'use client';

import { useState, useTransition } from "react";
import { PhoneCall, ShieldCheck, Activity } from "lucide-react";

export default function CallButton({ propertyId }: { propertyId: string }) {
  const [callInitiated, setCallInitiated] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [consented, setConsented] = useState(false);

  const handleCall = () => {
    if (!consented) {
      alert("Please consent to the recording notice to make a proxy call.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/calls/bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
        const data = await res.json();
        if (data.success) {
          setCallInitiated(true);
        } else {
          // If user is not logged in, redirect them
          if (res.status === 401) {
            alert("Please log in to contact landlords.");
            window.location.href = `/login?callbackUrl=/flat/${propertyId}`;
          } else {
            alert(data.error || "Failed to initiate call");
          }
        }
      } catch (e) {
        console.error("Failed to initiate call proxy bridge", e);
        alert("Failed to initiate secure proxy call.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {!callInitiated ? (
        <div className="space-y-3">
          {/* Consent Checkbox */}
          <label className="flex items-start space-x-2 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
            <input 
              type="checkbox" 
              checked={consented} 
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary accent-brand-primary cursor-pointer"
            />
            <span className="text-[10px] text-slate-550 leading-relaxed font-sans">
              I consent to the recording of this call in compliance with Indian telecom regulations. I agree to share call status details with the platform.
            </span>
          </label>

          <button
            onClick={handleCall}
            disabled={isPending || !consented}
            className="w-full bg-brand-primary hover:bg-brand-primaryHover disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:cursor-not-allowed text-white rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <PhoneCall className="h-4.5 w-4.5" />
            <span>{isPending ? "Connecting Masked Proxy..." : "Call Owner Securely"}</span>
          </button>
        </div>
      ) : (
        <div className="bg-status-successBg/15 border border-emerald-100 rounded-xl p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-primary" />
            <span>Proxy Bridge Active</span>
          </div>
          <p className="text-[11px] text-brand-primary leading-normal">
            Your call is masked to preserve privacy. Calling via proxy line: <code className="bg-emerald-100 font-bold px-1 py-0.5 rounded">020-6721-9988</code>.
          </p>
          <span className="block text-[9px] text-slate-400 mt-1 flex items-center">
            <Activity className="h-3 w-3 mr-1 text-slate-400 animate-pulse" />
            Connection bridge is logged for safety.
          </span>
        </div>
      )}
    </div>
  );
}
