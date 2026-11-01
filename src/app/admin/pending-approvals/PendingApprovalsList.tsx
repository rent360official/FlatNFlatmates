'use client';

import React, { useState, useTransition, useMemo } from 'react';
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
  Users,
  LayoutGrid,
  Filter,
  Image as ImageIcon,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  adminMakePropertyLive,
  adminRejectProperty,
  adminToggleImageUpdateRequired,
} from './actions';
import {
  formatPropertyApprovalMessage,
  formatBulkPropertyApprovalMessage,
} from '@/lib/propertyApprovalConfig';

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
  imageUpdateRequired?: boolean;
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
  messageTemplate,
  bulkMessageTemplate,
}: {
  initialProperties: PropertyItem[];
  appBaseUrl: string;
  messageTemplate?: string;
  bulkMessageTemplate?: string;
}) {
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties);
  const [viewMode, setViewMode] = useState<'property' | 'user'>('property');
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

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

  const handleCopySingleMessage = (property: PropertyItem) => {
    const reviewUrl = `${appBaseUrl || window.location.origin}/approve-property/${property._id}`;
    const message = formatPropertyApprovalMessage(messageTemplate || '', {
      ownerName: property.owner?.name,
      propertyTitle: property.title,
      bhkConfig: property.bhkConfig,
      localityName: property.localityName,
      cityName: property.cityName,
      rentAmount: property.rentAmount,
      depositAmount: property.depositAmount,
      magicLink: reviewUrl,
      propertyId: property._id,
    });

    navigator.clipboard.writeText(message);
    setCopiedMsgId(property._id);
    showToast(`Copied configured approval message & link to clipboard!`);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const handleCopyBulkMessage = (owner: any, ownerProps: PropertyItem[]) => {
    const reviewUrl = `${appBaseUrl || window.location.origin}/approve-all-property/${owner._id}`;
    const message = formatBulkPropertyApprovalMessage(bulkMessageTemplate || '', {
      ownerName: owner.name,
      propertyCount: ownerProps.length,
      magicLink: reviewUrl,
      userId: owner._id,
    });

    navigator.clipboard.writeText(message);
    setCopiedMsgId(`user_${owner._id}`);
    showToast(`Copied bulk approval message & magic link for ${owner.name || 'owner'}!`);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const handleToggleImageUpdate = async (propertyId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    // Optimistic UI update
    setProperties((prev) =>
      prev.map((p) => (p._id === propertyId ? { ...p, imageUpdateRequired: nextVal } : p))
    );
    setToggleLoadingId(propertyId);
    const res = await adminToggleImageUpdateRequired(propertyId, nextVal);
    setToggleLoadingId(null);
    if (res.error) {
      // Revert optimistic update
      setProperties((prev) =>
        prev.map((p) => (p._id === propertyId ? { ...p, imageUpdateRequired: currentVal } : p))
      );
      showToast(`Error: ${res.error}`);
    } else {
      showToast(
        nextVal
          ? 'Image update required: YES (Owner cannot make live until updated)'
          : 'Image update required: NO (Make live enabled for owner)'
      );
    }
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

  // Extract distinct localities from all pending properties
  const allLocalities = useMemo(() => {
    const locMap = new Map<string, number>();
    properties.forEach((p) => {
      if (p.localityName && p.localityName !== 'Unknown Locality') {
        locMap.set(p.localityName, (locMap.get(p.localityName) || 0) + 1);
      }
    });
    return Array.from(locMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  // Filter properties based on locality and search query
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Locality filter
      if (selectedLocality !== 'all') {
        if (p.localityName.toLowerCase() !== selectedLocality.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchLocality = p.localityName.toLowerCase().includes(q);
      const matchBhk = p.bhkConfig.toLowerCase().includes(q);
      const matchPhone = p.owner?.phone?.toLowerCase().includes(q);
      const matchOwnerName = p.owner?.name?.toLowerCase().includes(q);
      const matchOwnerId = p.owner?._id?.toLowerCase().includes(q);
      return matchTitle || matchLocality || matchBhk || matchPhone || matchOwnerName || matchOwnerId;
    });
  }, [properties, selectedLocality, searchQuery]);

  // Group filtered properties by Owner for User View
  const groupedUsers = useMemo(() => {
    const userMap = new Map<
      string,
      {
        owner: {
          _id: string;
          name?: string;
          phone: string;
          email?: string;
          verificationStatus?: string;
        };
        properties: PropertyItem[];
        localities: string[];
        totalRent: number;
        hasImageUpdateRequired: boolean;
      }
    >();

    filteredProperties.forEach((p) => {
      const ownerId = p.owner?._id || 'unknown';
      if (!userMap.has(ownerId)) {
        userMap.set(ownerId, {
          owner: p.owner || {
            _id: 'unknown',
            name: 'Unassigned Owner',
            phone: '',
          },
          properties: [],
          localities: [],
          totalRent: 0,
          hasImageUpdateRequired: false,
        });
      }

      const userGroup = userMap.get(ownerId)!;
      userGroup.properties.push(p);
      userGroup.totalRent += p.rentAmount || 0;
      if (p.localityName && !userGroup.localities.includes(p.localityName)) {
        userGroup.localities.push(p.localityName);
      }
      if (p.imageUpdateRequired) {
        userGroup.hasImageUpdateRequired = true;
      }
    });

    return Array.from(userMap.values()).sort(
      (a, b) => b.properties.length - a.properties.length
    );
  }, [filteredProperties]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
                <span>Pending Owner Approval</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {properties.length} total listings awaiting activation
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-black text-slate-900">
              Pending Property Approvals
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Field-collected properties awaiting owner review. Switch between Property view and User view to send single or bulk approval magic links.
            </p>
          </div>

          {/* View Toggle: Property View vs User View */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('property')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'property'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4 text-violet-600" />
              <span>Property View ({filteredProperties.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('user')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'user'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4 text-indigo-600" />
              <span>User View ({groupedUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row: Locality & Search */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Locality Dropdown Filter */}
          <div className="flex items-center gap-2 sm:w-72">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary cursor-pointer"
            >
              <option value="all">All Localities ({properties.length} listings)</option>
              {allLocalities.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.count})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by owner name, phone, locality, title..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROPERTY VIEW                                                          */}
      {/* ========================================================================= */}
      {viewMode === 'property' && (
        <>
          {filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-800">
                {searchQuery || selectedLocality !== 'all'
                  ? 'No matching properties found'
                  : 'No properties pending owner approval'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedLocality !== 'all'
                  ? 'Try adjusting your search query or locality filter.'
                  : 'All field-collected properties have been approved or none have been submitted as unapproved yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredProperties.map((prop) => {
                const coverImg =
                  prop.images?.find((i) => i.isCover)?.url ||
                  prop.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';

                const isActionLoading = actionLoadingId === prop._id;
                const isToggleLoading = toggleLoadingId === prop._id;
                const imgReq = Boolean(prop.imageUpdateRequired);

                return (
                  <div
                    key={prop._id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5">
                      {/* Top row: Badges, Date, and Quality Toggle */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            Pending Approval
                          </span>

                          {/* Image Update Required Status Badge */}
                          {imgReq && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Image Update Required
                            </span>
                          )}
                        </div>

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

                      {/* Requirement 2: "Image update required?" Toggle */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 p-2.5 rounded-xl border">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-slate-500" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Image update required?
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {imgReq
                                ? 'Owner will be blocked from making live until photos are updated'
                                : 'Make live button is fully enabled for owner'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleImageUpdate(prop._id, imgReq)}
                          disabled={isToggleLoading}
                          className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
                            imgReq ? 'bg-amber-600' : 'bg-slate-300'
                          } ${isToggleLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          title={`Toggle: Image update required (Currently ${imgReq ? 'Yes' : 'No'})`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                              imgReq ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* 3 Primary Action Buttons: Copy Phone, Copy Message, Review Page */}
                    <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Button 1: Copy Phone */}
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

                        {/* Button 2: Copy Message */}
                        <button
                          type="button"
                          onClick={() => handleCopySingleMessage(prop)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 shadow-sm transition"
                          title="Copy formatted WhatsApp/SMS message with approval link"
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

                        {/* Button 3: Review Page */}
                        <Link
                          href={`/approve-property/${prop._id}`}
                          target="_blank"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Review Page</span>
                        </Link>
                      </div>

                      {/* Admin Quick Action (Make Live / Reject) */}
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. USER VIEW (Requirement 1)                                              */}
      {/* ========================================================================= */}
      {viewMode === 'user' && (
        <>
          {groupedUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-800">
                {searchQuery || selectedLocality !== 'all'
                  ? 'No owners found matching criteria'
                  : 'No users with pending property approvals'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedLocality !== 'all'
                  ? 'Try selecting a different locality or resetting your search query.'
                  : 'All properties for all owners have been approved.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {groupedUsers.map((group) => {
                const owner = group.owner;
                const ownerProps = group.properties;
                const userCopyKey = `user_${owner._id}`;
                const magicUrl = `${appBaseUrl || ''}/approve-all-property/${owner._id}`;

                return (
                  <div
                    key={owner._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Owner Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                            {owner.name ? owner.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-black text-slate-900">
                                {owner.name || 'Owner (Unset)'}
                              </h2>
                              {owner.verificationStatus === 'verified' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              Phone: <strong className="text-slate-800">{owner.phone || 'N/A'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Property Count Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{ownerProps.length} {ownerProps.length === 1 ? 'Property' : 'Properties'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Details Pills: Localities & Total Rent */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Localities
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {group.localities.map((loc) => (
                              <span
                                key={loc}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold"
                              >
                                <MapPin className="h-2.5 w-2.5 text-slate-400" />
                                {loc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Total Rent Volume
                          </span>
                          <div className="mt-1 text-sm font-black text-slate-900">
                            ₹{group.totalRent.toLocaleString('en-IN')}
                            <span className="text-[11px] font-normal text-slate-500"> /mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Property Preview List under this user */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Pending Properties ({ownerProps.length})</span>
                          {group.hasImageUpdateRequired && (
                            <span className="text-amber-700 font-extrabold flex items-center gap-1 normal-case text-[10px]">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Some require images
                            </span>
                          )}
                        </div>

                        <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                          {ownerProps.map((p) => (
                            <div
                              key={p._id}
                              className="p-2 px-3 text-xs flex items-center justify-between gap-2 hover:bg-white transition"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-800 truncate">
                                  {p.title}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>{p.bhkConfig}</span>
                                  <span>·</span>
                                  <span>{p.localityName}</span>
                                  <span>·</span>
                                  <span className="font-bold text-slate-700">
                                    ₹{p.rentAmount.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {p.imageUpdateRequired && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    Img Req
                                  </span>
                                )}
                                <Link
                                  href={`/approve-property/${p._id}`}
                                  target="_blank"
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                  title="View single approval page"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for User Card: Copy Phone, Copy Message (bulk link), Review Page */}
                    <div className="bg-slate-50 border-t border-slate-200 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Button 1: Copy Phone */}
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(owner.phone, userCopyKey)}
                          disabled={!owner.phone}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition disabled:opacity-50"
                          title="Copy owner contact number"
                        >
                          {copiedId === userCopyKey ? (
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

                        {/* Button 2: Copy Message (Bulk format with /approve-all-property/{USER_ID}) */}
                        <button
                          type="button"
                          onClick={() => handleCopyBulkMessage(owner, ownerProps)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 shadow-sm transition"
                          title="Copy pre-formatted bulk WhatsApp message with magic link"
                        >
                          {copiedMsgId === userCopyKey ? (
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

                        {/* Button 3: Review Page (Bulk /approve-all-property/{USER_ID}) */}
                        <Link
                          href={`/approve-all-property/${owner._id}`}
                          target="_blank"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm transition"
                          title="Open owner multi-property bulk approval page"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Review Page</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
