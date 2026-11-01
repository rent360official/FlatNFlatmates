'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Calendar,
  Check,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Sparkles,
  Phone,
  ShieldCheck,
  ArrowRight,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ownerMakeBulkPropertiesLive } from './actions';

interface PropertyItem {
  _id: string;
  title: string;
  description: string;
  rentAmount: number;
  depositAmount: number;
  bhkConfig: string;
  propertyType: string;
  addressLine: string;
  localityName: string;
  cityName: string;
  images: { url: string; isCover?: boolean }[];
  furnishingStatus: string;
  status: string;
  imageUpdateRequired: boolean;
  createdAt: string;
}

interface OwnerData {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  verificationStatus: string;
}

export default function ApproveAllPropertiesClient({
  owner,
  properties: initialProperties,
}: {
  owner: OwnerData;
  properties: PropertyItem[];
}) {
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties);
  // Requirement 1: "By default, all should be selected."
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialProperties.map((p) => p._id)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    activatedCount: number;
    skippedCount: number;
  } | null>(null);

  const toggleSelectProperty = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(properties.map((p) => p._id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkMakeLive = () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one property to make live.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await ownerMakeBulkPropertiesLive(selectedIds, owner._id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessInfo({
          activatedCount: res.activatedCount || 0,
          skippedCount: res.skippedCount || 0,
        });
        // Remove activated properties from pending list
        setProperties((prev) =>
          prev.filter((p) => !selectedIds.includes(p._id) || p.imageUpdateRequired)
        );
        setSelectedIds([]);
      }
    });
  };

  const eligibleSelectedCount = selectedIds.filter((id) => {
    const prop = properties.find((p) => p._id === id);
    return prop && !prop.imageUpdateRequired;
  }).length;

  const selectedWithImageReqCount = selectedIds.filter((id) => {
    const prop = properties.find((p) => p._id === id);
    return prop && prop.imageUpdateRequired;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="font-bold text-violet-300">
              Bulk Property Activation · Owner Verification
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Owner: <strong className="text-white">{owner.name}</strong></span>
            <span>·</span>
            <span className="font-mono">Phone: {owner.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Success Banner */}
        {successInfo && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 shadow-md animate-in fade-in slide-in-from-top-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-emerald-950">
                  Congratulations! {successInfo.activatedCount} {successInfo.activatedCount === 1 ? 'property is' : 'properties are'} now LIVE!
                </h2>
                <p className="text-xs text-emerald-700">
                  Verified tenants across Pune can now view and inquire about your listings.
                  {successInfo.skippedCount > 0 &&
                    ` Note: ${successInfo.skippedCount} property was skipped because an image update is required.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/profile/properties"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
              >
                <span>Manage My Properties</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Owner Profile Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase tracking-wider">
                  Owner Property Dashboard
                </span>
                {owner.verificationStatus === 'verified' && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    Verified Owner
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                Welcome, {owner.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Select the properties below that you want to publish live immediately. By default, all collected properties are selected.
              </p>
            </div>

            {/* Quick Stats Box */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 self-start sm:self-auto">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Pending Review
                </span>
                <span className="text-xl font-black text-slate-900">
                  {properties.length}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Selected
                </span>
                <span className="text-xl font-black text-brand-primary">
                  {selectedIds.length}
                </span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          {properties.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-brand-primary" />
                  <span>Select All ({properties.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </button>
              </div>

              <div className="text-xs font-medium text-slate-500">
                {eligibleSelectedCount} eligible to make live now
                {selectedWithImageReqCount > 0 && (
                  <span className="text-amber-700 font-bold ml-1">
                    ({selectedWithImageReqCount} require image updates)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Property List */}
        {properties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">
              No pending properties awaiting activation
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All your properties have been reviewed and activated, or none are currently awaiting owner approval.
            </p>
            <div className="pt-2">
              <Link
                href="/profile/properties"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primaryHover transition"
              >
                <span>Go to My Properties</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((prop) => {
              const isSelected = selectedIds.includes(prop._id);
              const coverImg =
                prop.images?.find((i) => i.isCover)?.url ||
                prop.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={prop._id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-md'
                      : 'border-slate-200/90 shadow-sm hover:shadow'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Checkbox + Thumbnail + Details */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectProperty(prop._id)}
                        className="mt-1 sm:mt-0 shrink-0 p-1 rounded-lg text-brand-primary hover:bg-slate-100 transition"
                        title={isSelected ? 'Deselect this property' : 'Select this property'}
                      >
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-md bg-brand-primary text-white flex items-center justify-center shadow-sm">
                            <Check className="h-4 w-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-md border-2 border-slate-300 bg-white hover:border-slate-400" />
                        )}
                      </button>

                      {/* Thumbnail */}
                      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImg}
                          alt={prop.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1.5 py-0.2 text-[9px] font-bold text-white">
                          {prop.bhkConfig}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {prop.title}
                          </h2>
                          {prop.imageUpdateRequired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Image update required
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {prop.localityName}, {prop.cityName}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            ₹{prop.rentAmount.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-500">
                            Deposit: ₹{prop.depositAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Image update warning notice */}
                        {prop.imageUpdateRequired && (
                          <p className="mt-1.5 text-[11px] text-amber-800 font-medium">
                            ⚠️ Image update is required to make it live! Please update photos first.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {prop.imageUpdateRequired ? (
                        <Link
                          href={`/list-property?edit=${prop._id}&approveOnSave=true`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition shadow-sm"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                          <span>Update Photos</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/approve-property/${prop._id}`}
                          target="_blank"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm"
                        >
                          <span>Review Full Details</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (Requirement 1: "make all of them live in single click") */}
      {properties.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4 sm:p-5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Selection info on left */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 w-full sm:w-auto justify-between sm:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                <span>
                  <strong>{selectedIds.length}</strong> of <strong>{properties.length}</strong> properties selected
                </span>
              </span>

              {isPending && (
                <span className="text-brand-primary animate-pulse font-bold ml-2">
                  Activating selected properties...
                </span>
              )}
            </div>

            {/* Single Click Make Live Action Button */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleBulkMakeLive}
                disabled={isPending || eligibleSelectedCount === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 active-press"
              >
                {isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>
                  {eligibleSelectedCount > 0
                    ? `Make Selected Properties Live (${eligibleSelectedCount})`
                    : 'Select Eligible Properties'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
