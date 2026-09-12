'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Phone,
  Copy,
  Check,
  ExternalLink,
  Search,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  MessageSquare,
  Sparkles,
  Share2,
} from 'lucide-react';
import { adminMakePropertyLive, adminRejectProperty } from './actions';

interface PropertyItem {
  _id: string;
  title: string;
  description?: string;
  rentAmount: number;
  depositAmount: number;
  bhkConfig: string;
  propertyType: string;
  addressLine: string;
  localityName: string;
  cityName: string;
  images: { url: string; isCover?: boolean }[];
  createdAt: string;
  owner: {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
    verificationStatus?: string;
  } | null;
}

export default function PendingApprovalsList({
  initialProperties,
  appBaseUrl,
}: {
  initialProperties: PropertyItem[];
  appBaseUrl: string;
}) {
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast(`Copied phone number: ${phone}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyMessage = (property: PropertyItem) => {
    const ownerName = property.owner?.name ? property.owner.name.trim() : 'Property Owner';
    const reviewUrl = `${appBaseUrl || window.location.origin}/approve-property/${property._id}`;
    const message = `Hi ${ownerName}! We have drafted your property listing "${property.title}" (${property.bhkConfig} in ${property.localityName}, ₹${property.rentAmount.toLocaleString('en-IN')}/mo) on FlatNFlatmates.

Please review your listing details, photos, and make it live in 1-click here:
${reviewUrl}

- FlatNFlatmates Team`;

    navigator.clipboard.writeText(message);
    setCopiedMsgId(property._id);
    showToast(`Copied approval message & link to clipboard!`);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const handleMakeLive = (propertyId: string) => {
    if (!confirm('Are you sure you want to approve and make this property LIVE immediately?')) return;
    setActionLoadingId(propertyId);
    startTransition(async () => {
      const res = await adminMakePropertyLive(propertyId);
      setActionLoadingId(null);
      if (res.error) {
        showToast(`Error: ${res.error}`);
      } else {
        setProperties((prev) => prev.filter((p) => p._id !== propertyId));
        showToast('Property is now LIVE on the platform!');
      }
    });
  };

  const handleReject = (propertyId: string) => {
    if (!confirm('Are you sure you want to REJECT and remove this unapproved listing?')) return;
    setActionLoadingId(propertyId);
    startTransition(async () => {
      const res = await adminRejectProperty(propertyId);
      setActionLoadingId(null);
      if (res.error) {
        showToast(`Error: ${res.error}`);
      } else {
        setProperties((prev) => prev.filter((p) => p._id !== propertyId));
        showToast('Property has been rejected and removed.');
      }
    });
  };

  // Filter properties
  const filtered = properties.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTitle = p.title.toLowerCase().includes(q);
    const matchLocality = p.localityName.toLowerCase().includes(q);
    const matchBhk = p.bhkConfig.toLowerCase().includes(q);
    const matchPhone = p.owner?.phone?.toLowerCase().includes(q);
    const matchOwnerName = p.owner?.name?.toLowerCase().includes(q);
    return matchTitle || matchLocality || matchBhk || matchPhone || matchOwnerName;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
              <Clock className="h-3.5 w-3.5 text-violet-600" />
              <span>Pending Owner Approval</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {filtered.length} listings awaiting activation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Pending Property Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Field-collected properties awaiting owner review. Copy the review link or message to send via WhatsApp / SMS.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by owner phone, name, locality..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* List / Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            {searchQuery ? 'No matching properties found' : 'No properties pending owner approval'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'All field-collected properties have been approved or none have been submitted as unapproved yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((prop) => {
            const coverImg =
              prop.images?.find((i) => i.isCover)?.url ||
              prop.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';

            const isActionLoading = actionLoadingId === prop._id;

            return (
              <div
                key={prop._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  {/* Top row: Badges and Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      Pending Approval
                    </span>

                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Middle Layout: Thumbnail + Details */}
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImg}
                        alt={prop.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {prop.bhkConfig}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {prop.title}
                      </h2>

                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">
                          {prop.localityName}, {prop.cityName}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{prop.rentAmount.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-slate-500">/mo</span>
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          Dep: ₹{prop.depositAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Owner Box */}
                      <div className="mt-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                            <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prop.owner?.name || 'Owner (Unset)'}</span>
                          </div>
                          {prop.owner?.verificationStatus === 'verified' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-slate-600 flex items-center justify-between font-mono font-medium">
                          <span>{prop.owner?.phone || 'No phone'}</span>
                          <span className="text-[10px] font-sans text-slate-400">
                            ID: {prop.owner?._id ? prop.owner._id.slice(-6) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Primary Action Buttons (Requested) */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Button 1: Copy Owner Phone Number */}
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(prop.owner?.phone || '', prop._id)}
                      disabled={!prop.owner?.phone}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition disabled:opacity-50"
                      title="Copy owner contact number"
                    >
                      {copiedId === prop._id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Phone Copied</span>
                        </>
                      ) : (
                        <>
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy Phone</span>
                        </>
                      )}
                    </button>

                    {/* Button 2: Copy Approval Message with Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(prop)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 shadow-sm transition"
                      title="Copy formatted message with approval link"
                    >
                      {copiedMsgId === prop._id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-violet-700" />
                          <span>Message Copied!</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3.5 w-3.5 text-violet-600" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>

                    {/* Button 3: View / Open Review Page */}
                    <Link
                      href={`/approve-property/${prop._id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Review Page</span>
                    </Link>
                  </div>

                  {/* Secondary Quick Admin Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-medium">Admin Quick Action:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(prop._id)}
                        disabled={isActionLoading || isPending}
                        className="text-rose-600 hover:text-rose-800 font-semibold disabled:opacity-50"
                      >
                        Reject & Delete
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleMakeLive(prop._id)}
                        disabled={isActionLoading || isPending}
                        className="text-emerald-700 hover:text-emerald-900 font-bold disabled:opacity-50"
                      >
                        Approve & Make Live
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
