'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  User as UserIcon,
  Phone,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Calendar,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { formatPropertyApprovalMessage } from '@/lib/propertyApprovalConfig';

export interface PropertyGridItem {
  _id: string;
  title: string;
  rentAmount: number;
  depositAmount: number;
  bhkConfig: string;
  propertyType: string;
  furnishingStatus: string;
  status: string;
  localityId?: string;
  localityName: string;
  cityName: string;
  addressLine?: string;
  coverImage?: string;
  viewsCount?: number;
  createdAt: string;
  owner: {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
    verificationStatus?: string;
    role?: string;
  } | null;
}

export default function PropertiesTable({
  properties,
  localities = [],
  appBaseUrl = '',
  messageTemplate = '',
  canEdit = true,
}: {
  properties: PropertyGridItem[];
  localities?: { _id: string; name: string }[];
  appBaseUrl?: string;
  messageTemplate?: string;
  canEdit?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pageSize = 15;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    showToast(`Copied phone: ${phone}`);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handleCopyMagicMessage = (property: PropertyGridItem) => {
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
    showToast('Copied approval message with magic link!');
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  // Compile unique locality options from both passed localities and properties list
  const availableLocalities = useMemo(() => {
    const set = new Set<string>();
    localities.forEach((loc) => {
      if (loc.name) set.add(loc.name.trim());
    });
    properties.forEach((p) => {
      if (p.localityName && p.localityName !== 'Unknown Locality') {
        set.add(p.localityName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [localities, properties]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prop.title.toLowerCase().includes(q) ||
        prop.localityName.toLowerCase().includes(q) ||
        (prop.addressLine && prop.addressLine.toLowerCase().includes(q)) ||
        (prop.owner?.name && prop.owner.name.toLowerCase().includes(q)) ||
        (prop.owner?.phone && prop.owner.phone.includes(q));

      const matchesLocality =
        localityFilter === 'all' ||
        prop.localityName.toLowerCase() === localityFilter.toLowerCase();

      const matchesStatus = statusFilter === 'all' || prop.status === statusFilter;

      return matchesSearch && matchesLocality && matchesStatus;
    });
  }, [properties, searchQuery, localityFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProperties.length / pageSize) || 1;
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, currentPage, pageSize]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'pending_owner_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <Clock className="h-3 w-3 text-violet-600" />
            Pending Approval
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Draft
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const hasActiveFilters = searchQuery !== '' || localityFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocalityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-brand-primary" />
            All Properties Repository ({properties.length} Total)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Full inventory of housing listings across Pune with owner contact links and instant inspection.
          </p>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold self-start sm:self-auto bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          Showing {filteredProperties.length} matching {filteredProperties.length === 1 ? 'property' : 'properties'}
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, owner name, phone, or locality..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Locality Filter Dropdown */}
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={localityFilter}
              onChange={(e) => {
                setLocalityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary text-slate-800 max-w-[200px]"
            >
              <option value="all">All Localities</option>
              {availableLocalities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_owner_approval">Pending Owner Approval</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-2 rounded-lg hover:bg-slate-100 transition"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Properties Data Table */}
      {paginatedProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />
          <h4 className="mt-3 text-sm font-bold text-slate-800">
            {hasActiveFilters ? 'No matching properties found' : 'No properties in system yet'}
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try modifying your search or locality filter.'
              : 'Properties listed by users or field collectors will appear here.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Rent & Locality</th>
                <th className="py-3 px-4">Owner / Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProperties.map((prop) => {
                const cover =
                  prop.coverImage ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80';
                const ownerName = prop.owner?.name ? prop.owner.name.trim() : 'Unnamed Owner';
                const ownerPhone = prop.owner?.phone || '';
                const isPendingApproval = prop.status === 'pending_owner_approval';

                // Target URL for Details button
                const detailsUrl = isPendingApproval
                  ? `/approve-property/${prop._id}`
                  : `/flat/${prop._id}`;

                return (
                  <tr key={prop._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Property info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover}
                            alt={prop.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[260px]">
                          <span
                            className="font-bold text-slate-900 block truncate hover:text-brand-primary"
                            title={prop.title}
                          >
                            {prop.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{prop.bhkConfig}</span>
                            <span>·</span>
                            <span className="capitalize">{prop.propertyType.replace('_', ' ')}</span>
                            <span>·</span>
                            <span className="capitalize">{prop.furnishingStatus.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rent & Locality */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-900">
                          ₹{prop.rentAmount.toLocaleString('en-IN')}
                          <span className="text-[10px] font-normal text-slate-500">/mo</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[180px]">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={`${prop.localityName}, ${prop.cityName}`}>
                            {prop.localityName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Basic User Details (Requested: Name & Phone Number) */}
                    <td className="py-3.5 px-4">
                      {prop.owner ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {ownerName.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className="font-bold text-slate-800 truncate max-w-[140px]"
                              title={ownerName}
                            >
                              {ownerName}
                            </span>
                            {prop.owner.verificationStatus === 'verified' && (
                              <span
                                className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                title="Verified Owner"
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{ownerPhone || 'No phone'}</span>
                            {ownerPhone && (
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(ownerPhone, prop._id)}
                                className="text-slate-400 hover:text-brand-primary transition p-0.5 rounded"
                                title="Copy phone number"
                              >
                                {copiedPhoneId === prop._id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No owner assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(prop.status)}
                        <span className="text-[10px] text-slate-400 font-sans">
                          {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Buttons: Details | User (Requested) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* If pending owner approval, provide 1-click magic message copy button */}
                        {isPendingApproval && (
                          <button
                            type="button"
                            onClick={() => handleCopyMagicMessage(prop)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition shadow-xs"
                            title="Copy configured WhatsApp/SMS approval message & magic link"
                          >
                            {copiedMsgId === prop._id ? (
                              <>
                                <Check className="h-3 w-3 text-violet-700" />
                                <span className="text-[11px]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3 w-3 text-violet-600" />
                                <span className="text-[11px]">Magic Link</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Button 1: Details */}
                        <Link
                          href={detailsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                          title={isPendingApproval ? 'Review & Approve Listing' : 'View Public Property Details'}
                        >
                          <span>Details</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>

                        {/* Button 2: User */}
                        {prop.owner?._id ? (
                          <Link
                            href={`/admin/users/${prop.owner._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition shadow-xs"
                            title={`Inspect ${ownerName}'s Account & Portfolio`}
                          >
                            <UserIcon className="h-3 w-3" />
                            <span>User</span>
                          </Link>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                            title="Owner record not found"
                          >
                            <UserIcon className="h-3 w-3" />
                            <span>User</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-[11px] text-slate-500 font-medium">
            Page {currentPage} of {totalPages} ({filteredProperties.length} items)
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 text-xs rounded-lg font-semibold transition ${
                      currentPage === pageNum
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'border hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
