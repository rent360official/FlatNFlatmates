'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  MapPin,
  Building2,
  Home,
  Check,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  Zap,
  Droplets,
  Wifi,
  Car,
  Clock,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ownerMakePropertyLive, ownerRejectProperty } from './actions';

interface PropertyData {
  _id: string;
  title: string;
  description: string;
  rentAmount: number;
  depositAmount: number;
  maintenanceAmount: number;
  bhkConfig: string;
  propertyType: string;
  floor?: number;
  totalFloors?: number;
  areaSqft?: number;
  addressLine: string;
  localityName: string;
  cityName: string;
  coordinates?: [number, number];
  furnishingStatus: string;
  tenantPreference: string;
  brokerageFlag: boolean;
  brokerageAmount: number;
  amenities: string[];
  houseRules: string[];
  safetyFeatures: string[];
  images: { url: string; isCover?: boolean }[];
  tourVideoUrl?: string;
  availableFrom?: string;
  minLeaseMonths?: number;
  lockInMonths?: number;
  petPolicy?: string;
  maxOccupants?: number;
  parkingType?: string;
  evChargingAvailable?: boolean;
  powerBackup?: string;
  waterSupplyType?: string;
  internetReadiness?: { fiberAvailable: boolean; avgSpeedMbps?: number };
  allowWhatsappContact?: boolean;
  status: string;
  createdAt: string;
  owner: {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
    verificationStatus?: string;
  } | null;
}

export default function ApprovePropertyClient({
  property,
}: {
  property: PropertyData;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(property.status);
  const [selectedImage, setSelectedImage] = useState<string>(
    property.images?.find((i) => i.isCover)?.url ||
      property.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80'
  );
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<'live' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessLive, setIsSuccessLive] = useState(false);

  const handleMakeLive = () => {
    setError(null);
    setActionType('live');
    startTransition(async () => {
      const res = await ownerMakePropertyLive(property._id);
      if (res.error) {
        setError(res.error);
        setActionType(null);
      } else {
        setCurrentStatus('active');
        setIsSuccessLive(true);
      }
    });
  };

  const handleReject = () => {
    if (
      !confirm(
        'Are you sure you do not want to publish this property? It will be removed from the platform.'
      )
    ) {
      return;
    }
    setError(null);
    setActionType('reject');
    startTransition(async () => {
      const res = await ownerRejectProperty(property._id);
      if (res.error) {
        setError(res.error);
        setActionType(null);
      } else {
        setCurrentStatus('removed');
      }
    });
  };

  const isPendingApproval = currentStatus === 'pending_owner_approval';
  const isLive = currentStatus === 'active';
  const isRemoved = currentStatus === 'removed';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="font-bold text-violet-300">
              {isPendingApproval
                ? 'Action Required: Review & Activate Your Property'
                : isLive
                ? 'Listing is LIVE on FlatNFlatmates'
                : 'Listing Removed'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Collected: {new Date(property.createdAt).toLocaleDateString('en-IN')}</span>
            <span>·</span>
            <span className="font-mono">ID: {property._id.slice(-8)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Success Live Banner */}
        {isSuccessLive && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900 shadow-md animate-in fade-in slide-in-from-top-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-emerald-950">
                  Congratulations! Your listing is now LIVE!
                </h2>
                <p className="text-xs text-emerald-700">
                  Verified prospective tenants in Pune can now find, view, and connect with you directly on FlatNFlatmates.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/flat/${property._id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
              >
                <span>View Public Flat Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/profile/properties"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/60 transition"
              >
                <span>Manage My Properties</span>
              </Link>
            </div>
          </div>
        )}

        {/* Removed Banner */}
        {isRemoved && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              <h2 className="text-base font-bold text-rose-950">This listing has been rejected and removed</h2>
            </div>
            <p className="text-xs text-rose-700">
              The property is no longer active in the system. You can list a new property whenever you are ready.
            </p>
            <div className="pt-2">
              <Link
                href="/list-property"
                className="inline-flex items-center gap-1 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
              >
                <span>List a New Property</span>
              </Link>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* Main Hero Card: Title, Rent, and Photos */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase tracking-wider">
                  {property.bhkConfig} · {property.propertyType}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                  {property.furnishingStatus.replace('_', ' ')}
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                {property.title}
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  {property.addressLine}, {property.localityName}, {property.cityName}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right sm:min-w-[200px]">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{property.rentAmount.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500"> /month</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                <div>Deposit: ₹{property.depositAmount.toLocaleString('en-IN')}</div>
                {property.maintenanceAmount > 0 ? (
                  <div>Maintenance: ₹{property.maintenanceAmount.toLocaleString('en-IN')}/mo</div>
                ) : (
                  <div className="text-emerald-600 font-medium">Zero Maintenance</div>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="space-y-3">
            <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt={property.title}
                className="h-full w-full object-cover transition-all"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white">
                {property.images.length} Photos Captured
              </div>
            </div>

            {/* Thumbnail Row */}
            {property.images && property.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === img.url
                        ? 'border-brand-primary ring-2 ring-brand-primary/30'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid: Property Specs & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Specs & Features (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-primary" />
                <span>About this Property</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Property Key Parameters */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Listing Specifications</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Configuration</div>
                  <div className="mt-1 font-bold text-slate-800">{property.bhkConfig} ({property.propertyType})</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Floor & Area</div>
                  <div className="mt-1 font-bold text-slate-800">
                    {property.floor !== undefined ? `Floor ${property.floor}` : 'N/A'}
                    {property.totalFloors ? ` of ${property.totalFloors}` : ''}
                    {property.areaSqft ? ` · ${property.areaSqft} sqft` : ''}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Tenant Fit</div>
                  <div className="mt-1 font-bold text-slate-800 uppercase">{property.tenantPreference}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Min Lease</div>
                  <div className="mt-1 font-bold text-slate-800">{property.minLeaseMonths || 11} Months</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Pet Policy</div>
                  <div className="mt-1 font-bold text-slate-800 capitalize">
                    {property.petPolicy ? property.petPolicy.replace('_', ' ') : 'Case by case'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Brokerage</div>
                  <div className="mt-1 font-bold text-slate-800">
                    {property.brokerageFlag ? `₹${property.brokerageAmount}` : 'Zero Brokerage'}
                  </div>
                </div>
              </div>
            </div>

            {/* Infrastructure & Utilities */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Infrastructure & Utility Support</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Power Backup</div>
                    <div className="font-bold text-slate-800 capitalize">{property.powerBackup || 'None'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Droplets className="h-4 w-4 text-sky-500 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Water Supply</div>
                    <div className="font-bold text-slate-800 capitalize">{property.waterSupplyType || 'Municipal'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Car className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Parking</div>
                    <div className="font-bold text-slate-800 capitalize">
                      {property.parkingType ? property.parkingType.replace('_', ' ') : 'None'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Wifi className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Fiber Internet</div>
                    <div className="font-bold text-slate-800">
                      {property.internetReadiness?.fiberAvailable ? 'Ready' : 'Not installed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities & Rules */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900">Amenities & Inclusions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Owner / User Details & Contact preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Owner Contact Profile</h3>
                  <p className="text-[11px] text-slate-400">Registered phone & identity</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400">Owner Name:</span>
                  <div className="font-bold text-slate-900 text-sm">{property.owner?.name || 'Name not provided'}</div>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Phone Number:</span>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-brand-primary" />
                    <span>{property.owner?.phone || 'No phone'}</span>
                  </div>
                </div>

                {property.owner?.email && (
                  <div className="border-t border-slate-200 pt-2">
                    <span className="text-slate-400">Email:</span>
                    <div className="font-medium text-slate-700 truncate">{property.owner.email}</div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">WhatsApp Inquiries:</span>
                  <span className="font-bold text-emerald-700">
                    {property.allowWhatsappContact !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Assurance */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-6 space-y-2.5 text-xs text-indigo-900">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-sm">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>FlatNFlatmates Assurance</span>
              </div>
              <p className="text-indigo-800/80 leading-relaxed">
                By clicking <strong>Make it Live</strong>, your listing becomes immediately searchable by verified tenants with zero middleman brokerage fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Requested) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4 sm:p-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Label on Left */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 w-full sm:w-auto justify-between sm:justify-start">
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500' : isRemoved ? 'bg-rose-500' : 'bg-violet-500'}`} />
              <span>Status: <strong className="uppercase">{currentStatus.replace(/_/g, ' ')}</strong></span>
            </span>

            {isPending && (
              <span className="text-brand-primary animate-pulse font-bold">Processing request...</span>
            )}
          </div>

          {/* 3 Sticky Buttons (Requested: "Make it Live" / "Don't & delete" / "Update details first") */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Button 1: Don't & delete */}
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending || isRemoved}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 text-xs font-bold transition disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Don&apos;t & Delete</span>
            </button>

            {/* Button 2: Update details first */}
            <Link
              href={`/list-property?edit=${property._id}&approveOnSave=true`}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-sm"
            >
              <Edit3 className="h-4 w-4 text-slate-500" />
              <span>Update Details First</span>
            </Link>

            {/* Button 3: Make it Live */}
            <button
              type="button"
              onClick={handleMakeLive}
              disabled={isPending || isLive}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 active-press"
            >
              {actionType === 'live' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{isLive ? 'Already Live' : 'Make It Live'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
