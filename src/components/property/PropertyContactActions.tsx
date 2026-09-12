'use client';

import React, { useState, useTransition } from "react";
import { Phone, Send, CheckCircle2, MessageCircle, Heart, Loader2 } from "lucide-react";
import { recordPropertyCallAction, recordPropertyWhatsappAction, submitPropertyInterestSmsAction } from "@/app/flat/[id]/actions";
import { formatMsg91Phone } from "@/lib/phoneUtils";

// WhatsApp brand SVG icon
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

interface PropertyContactActionsProps {
  propertyId: string;
  propertyTitle: string;
  ownerPhone?: string;
  allowWhatsappContact?: boolean;
  showInterestButton?: boolean;
  currentUserName?: string;
}

export default function PropertyContactActions({
  propertyId,
  propertyTitle,
  ownerPhone,
  allowWhatsappContact = true,
  showInterestButton = true,
  currentUserName,
}: PropertyContactActionsProps) {
  const [interestShared, setInterestShared] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCalling, startCallingTransition] = useTransition();
  const [isInterestPending, startInterestTransition] = useTransition();

  // 1. Direct Phone Call (Does not display raw phone on UI, logs call inquiry)
  const handleDirectCall = () => {
    startCallingTransition(async () => {
      const res = await recordPropertyCallAction(propertyId);
      if (res.requireLogin) {
        alert(res.error || "Please sign in to call the property owner.");
        window.location.href = `/login?callbackUrl=/flat/${propertyId}`;
        return;
      }
      if (res.success && res.telUrl) {
        window.location.href = res.telUrl;
      } else {
        alert(res.error || "Failed to initiate call. Please try again.");
      }
    });
  };

  // 2. Direct WhatsApp Pre-filled Chat
  const handleWhatsAppChat = () => {
    startCallingTransition(async () => {
      const res = await recordPropertyWhatsappAction(propertyId);
      if (res.requireLogin) {
        alert(res.error || "Please sign in to contact the owner on WhatsApp.");
        window.location.href = `/login?callbackUrl=/flat/${propertyId}`;
        return;
      }

      if (!ownerPhone) {
        alert("Owner contact information is unavailable.");
        return;
      }

      const cleanOwnerMobile = formatMsg91Phone(ownerPhone);
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : "https://flatandflatmates.in";
      const propertyLink = `${siteUrl}/flat/${propertyId}`;
      const senderName = currentUserName || "a prospective tenant";

      const message = `Hi, I am interested in ${propertyTitle}. Wanted to discuss with you about the same. Regards, ${senderName}. ${propertyLink}`;
      const encodedText = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanOwnerMobile}?text=${encodedText}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
  };

  // 3. Share Interest via SMS (MSG91 Flow / SMS triggered)
  const handleShareInterest = () => {
    startInterestTransition(async () => {
      const res = await submitPropertyInterestSmsAction(propertyId);
      if (res.success) {
        setInterestShared(true);
        setFeedbackMessage(res.message || "Interest shared with owner!");
      } else if (res.requireLogin) {
        alert(res.error || "Please log in to share interest with the owner.");
        window.location.href = `/login?callbackUrl=/flat/${propertyId}`;
      } else {
        alert(res.error || "Failed to share interest. Please try again.");
      }
    });
  };

  const visibleButtonCount = 1 + (allowWhatsappContact ? 1 : 0) + (showInterestButton ? 1 : 0);
  const gridLayoutClass = visibleButtonCount === 3
    ? "grid-cols-1 sm:grid-cols-3"
    : visibleButtonCount === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1";

  return (
    <div className="space-y-3 font-sans">
      {/* Contact Action Buttons in responsive grid */}
      <div className={`grid ${gridLayoutClass} gap-2`}>
        {/* BUTTON 1: CALL */}
        <button
          type="button"
          onClick={handleDirectCall}
          disabled={isCalling}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          title="Call Owner directly from your phone"
        >
          {isCalling ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Phone className="h-4 w-4 text-emerald-400" />
          )}
          <span>{isCalling ? "Connecting..." : "Call"}</span>
        </button>

        {/* BUTTON 2: WHATSAPP (Conditionally visible if owner enabled WhatsApp) */}
        {allowWhatsappContact && (
          <button
            type="button"
            onClick={handleWhatsAppChat}
            className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl text-xs shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            title="Chat with Owner on WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4 text-white" />
            <span>WhatsApp</span>
          </button>
        )}

        {/* BUTTON 3: INTERESTED (Triggers MSG91 SMS, only if feature enabled) */}
        {showInterestButton && (
          <button
            type="button"
            onClick={handleShareInterest}
            disabled={isInterestPending || interestShared}
            className={`flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              interestShared
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                : "bg-brand-primary hover:bg-brand-primaryHover text-white transform hover:-translate-y-0.5"
            }`}
            title="Notify owner via instant SMS that you are interested"
          >
            {isInterestPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : interestShared ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Heart className="h-4 w-4 text-rose-300 fill-rose-300" />
            )}
            <span>
              {isInterestPending
                ? "Notifying..."
                : interestShared
                ? "Interest Shared!"
                : "Interested"}
            </span>
          </button>
        )}
      </div>

      {/* Confirmation Toast / Feedback Banner */}
      {interestShared && feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start space-x-2.5 text-emerald-800 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">{feedbackMessage}</p>
            <p className="text-[11px] text-emerald-700">
              The owner has been notified via instant SMS with your contact details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
