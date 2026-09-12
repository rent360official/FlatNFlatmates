'use client';

import React from "react";
import { Phone, MessageCircle } from "lucide-react";
import { formatMsg91Phone, formatE164Phone } from "@/lib/phoneUtils";

export default function FlatmateContactActions({
  calleePhone,
  calleeName,
  isLoggedIn = false,
  flatmateId,
}: {
  calleePhone?: string;
  calleeName: string;
  isLoggedIn?: boolean;
  flatmateId?: string;
}) {
  const handleCall = () => {
    if (!isLoggedIn) {
      alert("Please sign in to call this flatmate seeker.");
      window.location.href = `/login?callbackUrl=${flatmateId ? `/flatmate/${flatmateId}` : '/search/flatmates'}`;
      return;
    }
    if (!calleePhone) {
      alert("Contact number is not available.");
      return;
    }
    const formatted = formatE164Phone(calleePhone);
    window.location.href = `tel:${formatted}`;
  };

  const handleWhatsApp = () => {
    if (!isLoggedIn) {
      alert("Please sign in to message this flatmate seeker on WhatsApp.");
      window.location.href = `/login?callbackUrl=${flatmateId ? `/flatmate/${flatmateId}` : '/search/flatmates'}`;
      return;
    }
    if (!calleePhone) {
      alert("Contact number is not available.");
      return;
    }
    const formatted = formatMsg91Phone(calleePhone);
    const msg = encodeURIComponent(`Hi ${calleeName}, I saw your flatmate profile on FlatNFlatmates. Wanted to connect regarding sharing a flat in Pune!`);
    window.open(`https://wa.me/${formatted}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2.5 font-sans">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCall}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          title={`Call ${calleeName}`}
        >
          <Phone className="h-4 w-4 text-emerald-400" />
          <span>Call</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl text-xs shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          title={`Chat with ${calleeName} on WhatsApp`}
        >
          <MessageCircle className="h-4 w-4 text-white" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
