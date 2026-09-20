'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Flag, AlertTriangle, CheckCircle2, ShieldAlert, X, Send, Lock, Loader2
} from "lucide-react";

interface Props {
  propertyId: string;
  propertyTitle: string;
  isLoggedIn: boolean;
  currentUser?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

const REPORT_REASONS = [
  { value: "inaccurate_info", label: "Incorrect Price, Deposit, or Amenities" },
  { value: "already_rented", label: "Property Already Rented / Unavailable" },
  { value: "fake_listing", label: "Fake Listing / Photos Are Not Real" },
  { value: "broker_pretending_owner", label: "Broker Posing as Direct Owner / Hidden Brokerage" },
  { value: "scam_or_fraud", label: "Suspicious Activity / Potential Scam / Fraud" },
  { value: "inappropriate_content", label: "Inappropriate Content / Harassment" },
  { value: "other", label: "Other Policy Violation" },
];

export default function ReportPropertyModal({
  propertyId,
  propertyTitle,
  isLoggedIn,
  currentUser,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-open modal if redirected back with ?report=true
  useEffect(() => {
    if (searchParams.get("report") === "true") {
      if (isLoggedIn) {
        setIsOpen(true);
      } else {
        setShowLoginPrompt(true);
      }

      // Clean URL without triggering re-render
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("report");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, isLoggedIn]);

  const handleOpenClick = () => {
    setErrorMsg(null);
    setIsSuccess(false);

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleRedirectToLogin = () => {
    const callbackUrl = encodeURIComponent(`/flat/${propertyId}?report=true`);
    router.push(`/login?callbackUrl=${callbackUrl}`);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg("Please provide at least a few details explaining why you are reporting this listing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/property/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          reason,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report. Please try again.");
      }

      setIsSuccess(true);
      setDescription("");
    } catch (err: any) {
      console.error("Report submit error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowLoginPrompt(false);
    setErrorMsg(null);
    setIsSuccess(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenClick}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 border border-slate-200/80 transition shadow-2xs group cursor-pointer"
        title="Report this listing to moderation team"
      >
        <Flag className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
        <span>Report this listing</span>
      </button>

      {/* Login Required Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Sign In to Report</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To prevent spam and maintain verified community standards, you need to sign in before reporting a property.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">You will return right here</p>
              <p className="text-[11px] text-slate-500">
                After logging in, you will automatically be brought back to this property with the report dialog ready.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRedirectToLogin}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primaryHover transition shadow-sm"
              >
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Report Listing</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-sm">
                    {propertyTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Report Submitted</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for helping us maintain genuine listings on FlatNFlatmates. Our moderation team will investigate this listing and take appropriate action.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Reason for Reporting <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Additional Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Please explain the issue in detail (e.g. owner asked for undisclosed fees, property is already taken, photo doesn't match reality)..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition resize-none"
                  />
                </div>

                {/* Reporter Identity Info */}
                {currentUser && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                    <span>Reporting as: <strong className="text-slate-800 font-semibold">{currentUser.name || "User"}</strong></span>
                    <span className="font-mono text-[10px] text-slate-600">{currentUser.phone || currentUser.email || ""}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}
