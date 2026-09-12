'use client';

import { useState, useTransition } from "react";
import {
  Sparkles, Check, DollarSign, ShieldAlert, X,
  HelpCircle, Calendar, ShieldCheck, Ticket
} from "lucide-react";

interface Package {
  _id: string;
  name: string;
  description: string;
  accessoryList: string[];
  monthlyAddonAmount: number;
  refundableDepositAmount: number;
  images: string[];
}

export default function VibeUpgradeCatalog({
  packages,
  isLoggedIn,
  activeLease
}: {
  packages: Package[];
  isLoggedIn: boolean;
  activeLease: any;
}) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [isPending, startTransition] = useTransition();
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'confirm' | 'success'>('idle');
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  const handleOpenCheckout = (pkg: Package) => {
    setSelectedPkg(pkg);
    setCheckoutStep('confirm');
  };

  const handleClose = () => {
    setSelectedPkg(null);
    setCheckoutStep('idle');
    setGeneratedOtp("");
  };

  const handleCheckoutSubmit = () => {
    if (!isLoggedIn) {
      alert("Please log in to place upgrade requests.");
      window.location.href = `/login?callbackUrl=/services/vibe-upgrade`;
      return;
    }

    if (!activeLease) {
      return; // gated by UI
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/services/vibe-upgrade/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: selectedPkg?._id }),
        });
        const json = await res.json();
        if (json.success) {
          setGeneratedOtp(json.data.otp);
          setCheckoutStep('success');
        } else {
          alert(json.error || "Failed to submit upgrade request");
        }
      } catch (e) {
        console.error("Failed to checkout vibe upgrade request", e);
        alert("Failed to submit request.");
      }
    });
  };

  return (
    <div className="space-y-12 pb-16">

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Sparkles className="h-96 w-96 text-brand-primary/60" />
        </div>
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-bold text-brand-primary/60 uppercase tracking-widest block">FlatNFlatmates Vibe Premium</span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none">
            Style Your Rented Space. <br />
            No Long-term Commitments.
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Move into any apartment in Pune and let us furnish and style it to match your vibe. Rent beautiful furniture, accessories, and greens for a low monthly fee and a fully refundable security deposit.
          </p>
          <div className="flex items-center space-x-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span className="flex items-center"><Check className="h-4 w-4 text-brand-primary mr-1.5" /> 48-Hour Installation</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-brand-primary mr-1.5" /> Fully Refundable Deposit</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-brand-primary mr-1.5" /> Free Setup & Transport</span>
          </div>
        </div>
      </div>

      {/* active-tenancy notification banner */}
      {!activeLease && isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-800 animate-in fade-in duration-200">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold">Active Tenancy Required</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              You are currently logged in but do not have an active lease on FlatNFlatmates.in. You can browse the vibe catalog, but you must register a lease (available under your profile dashboard) to checkout packages.
            </p>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {packages.map((pkg) => {
          // Use standard matching fallback photos if seeded paths don't resolve
          const imageUrl = pkg.images?.[0] || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80";
          return (
            <div key={pkg._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
              <div className="relative h-64 bg-slate-100 border-b">
                <img src={imageUrl} alt={pkg.name} className="h-full w-full object-cover" />
                <span className="absolute top-4 left-4 bg-brand-primary text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-lg border border-brand-primary/60 shadow-md uppercase tracking-wider">
                  {pkg.name} Package
                </span>
              </div>

              <div className="p-6 space-y-6 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{pkg.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">{pkg.description}</p>

                  <div className="space-y-2 border-t pt-4">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Included Accessories:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pkg.accessoryList?.map((acc, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-[11px] text-slate-650">
                          <Check className="h-4 w-4 text-brand-primary flex-shrink-0" />
                          <span className="truncate">{acc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-baseline space-x-4">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Add-on Rent</span>
                      <span className="text-base font-extrabold text-slate-850">₹{pkg.monthlyAddonAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">/mo</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Deposit</span>
                      <span className="text-xs font-bold text-slate-500">₹{pkg.refundableDepositAmount.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 block">Refundable</span>
                    </div>
                  </div>

                  {activeLease ? (
                    <button
                      onClick={() => handleOpenCheckout(pkg)}
                      className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors shadow-sm"
                    >
                      Request Setup
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-slate-100 text-slate-400 rounded-lg px-4 py-2 text-xs font-bold border cursor-not-allowed"
                      title="Active lease required to request setup"
                    >
                      Tenant Only
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT FLOW MODAL */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border shadow-2xl p-6 md:p-8 space-y-6 relative animate-in zoom-in-95 duration-200">

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {checkoutStep === 'confirm' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Informational Checkout</span>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Confirm Vibe Upgrade Request</h2>
                  <p className="text-xs text-slate-550">Review the catalog subscription and confirm your active property address.</p>
                </div>

                <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs text-slate-600">Selected Package</span>
                    <strong className="text-xs text-slate-850 font-bold">{selectedPkg.name}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs text-slate-600">Monthly Add-on Rate</span>
                    <strong className="text-xs text-slate-850 font-bold">₹{selectedPkg.monthlyAddonAmount.toLocaleString()}/mo</strong>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-xs text-slate-600">Accessory Security Deposit</span>
                    <strong className="text-xs text-slate-850 font-bold">₹{selectedPkg.refundableDepositAmount.toLocaleString()} (Refundable)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Target Leased Property</span>
                    <div className="text-right">
                      <strong className="text-xs text-slate-850 font-bold block">{activeLease?.propertyId?.title}</strong>
                      <span className="text-[10px] text-slate-400 block">{activeLease?.propertyId?.addressLine}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-primary/10 border border-brand-primary/15 rounded-xl p-3 flex items-start space-x-2 text-brand-secondary">
                  <HelpCircle className="h-4.5 w-4.5 text-brand-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-brand-primaryHover leading-normal">
                    This is an informational request flow. No money will be transacted online. Upon confirmation, we will generate a verification OTP to validate installation offline.
                  </p>
                </div>

                <button
                  onClick={handleCheckoutSubmit}
                  disabled={isPending}
                  className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <span>{isPending ? "Submitting Request..." : "Request Vibe Setup"}</span>
                </button>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center space-y-6 py-4 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-brand-primary flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Vibe Request Submitted!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We have successfully registered your request for <strong className="text-slate-800">{selectedPkg.name}</strong>. Provide the verification code below to the installation crew to confirm delivery.
                  </p>
                </div>

                {/* OTP Display code */}
                <div className="bg-slate-50 border rounded-2xl p-6 max-w-xs mx-auto text-center space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
                    <Ticket className="h-3.5 w-3.5 text-brand-primary mr-1" /> Verification OTP Code
                  </span>
                  <span className="block text-3xl font-extrabold text-brand-primary tracking-wider">
                    {generatedOtp}
                  </span>
                  <span className="block text-[8px] text-slate-400">Valid until completed by installation admin.</span>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full border rounded-lg py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close & Back to Catalog
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
