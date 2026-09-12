import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import Locality from "@/models/Locality";
import City from "@/models/City";
import PropertyInquiry from "@/models/PropertyInquiry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import AdminPropertyCardActions from "./AdminPropertyCardActions";
import Link from "next/link";
import {
  ArrowLeft, Home, Eye, PhoneCall, Calendar, Activity,
  Info, Image as ImageIcon, Sparkles, Building, User as UserIcon
} from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AdminUserPropertiesPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const adminRole = (session?.user as any)?.role || "";
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(adminRole);

  if (!session || !isAdmin) {
    redirect("/admin");
  }

  const canEdit = ['super_admin', 'ops_admin', 'moderator'].includes(adminRole);

  await dbConnect();

  // Ensure Mongoose models are initialized
  const _User = User;
  const _Locality = Locality;
  const _City = City;
  const _PropertyInquiry = PropertyInquiry;
  const _Property = Property;

  let user: any = null;
  let properties: any[] = [];
  const callCountsMap: Record<string, number> = {};
  const interestCountsMap: Record<string, number> = {};

  try {
    user = await User.findById(params.id).lean();
    if (!user) {
      notFound();
    }

    properties = await Property.find({
      ownerId: params.id,
      status: { $ne: 'removed' },
    })
      .populate('localityId', 'name')
      .populate('cityId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const propertyIds = properties.map((p: any) => p._id).filter(Boolean);

    if (propertyIds.length > 0) {
      const inquiriesAggregation = await PropertyInquiry.aggregate([
        { $match: { propertyId: { $in: propertyIds } } },
        {
          $group: {
            _id: {
              propertyId: '$propertyId',
              inquiryType: '$inquiryType',
              userKey: { $ifNull: ['$userId', '$userPhone'] },
            },
          },
        },
        {
          $group: {
            _id: {
              propertyId: '$_id.propertyId',
              inquiryType: '$_id.inquiryType',
            },
            count: { $sum: 1 },
          },
        },
      ]);

      inquiriesAggregation.forEach((item: any) => {
        const pid = item._id?.propertyId?.toString();
        const type = item._id?.inquiryType;
        if (pid) {
          if (type === 'call') {
            callCountsMap[pid] = item.count;
          } else if (type === 'sms_interested') {
            interestCountsMap[pid] = item.count;
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to fetch user properties:", err);
    notFound();
  }

  // Calculate user-level property analytics
  const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalInquiries = Object.values(callCountsMap).reduce((acc, count) => acc + count, 0);
  const activeCount = properties.filter((p) => p.status === 'active').length;
  const pausedCount = properties.filter((p) => p.status === 'paused').length;
  const draftCount = properties.filter((p) => p.status === 'draft').length;
  const pendingOwnerApprovalCount = properties.filter((p) => p.status === 'pending_owner_approval').length;
  const totalRentYield = properties
    .filter((p) => p.status === 'active')
    .reduce((acc, p) => acc + (p.rentAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Paused
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Draft
          </span>
        );
      case 'pending_owner_approval':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            Pending Owner Approval
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Navigation Links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <Link
            href="/admin/users"
            className="font-semibold text-slate-500 hover:text-brand-primary hover:underline"
          >
            Users Management
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href={`/admin/users/${user._id}`}
            className="font-semibold text-brand-primary hover:underline flex items-center space-x-1"
          >
            <span>{user.name || "User Details"}</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">Properties & Analytics</span>
        </div>

        <div>
          <Link
            href={`/admin/users/${user._id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white border rounded-lg px-3 py-1.5 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            <span>Edit User Details</span>
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Home className="h-5 w-5 mr-2 text-brand-primary" />
            {user.name ? `${user.name}'s Properties & Analytics` : "User Properties & Analytics"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed performance tracking, telemetry, and backoffice controls for listings owned by this user.
          </p>
        </div>

        {!canEdit && (
          <div className="flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <Info className="h-4 w-4 text-amber-600" />
            <span>Read-only: Support agents cannot modify property listings.</span>
          </div>
        )}
      </div>

      {/* Summary KPI Analytics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Portfolio Listings
            </span>
            <Building className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1.5">{properties.length}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {activeCount} active | {pausedCount} paused | {draftCount} drafts{pendingOwnerApprovalCount > 0 ? ` | ${pendingOwnerApprovalCount} pending approval` : ''}
          </span>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Property Views
            </span>
            <Eye className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-1.5">{totalViews.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {properties.length > 0 ? Math.round(totalViews / properties.length) : 0} avg views/listing
          </span>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Connected Call Inquiries
            </span>
            <PhoneCall className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-600 mt-1.5">{totalInquiries}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {properties.length > 0 ? (totalInquiries / properties.length).toFixed(1) : 0} calls/listing
          </span>
        </div>

        <div className="bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Active Monthly Rent
            </span>
            <Activity className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-xl font-extrabold text-violet-600 mt-1.5">
            ₹{totalRentYield.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            From {activeCount} active listing{activeCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Property Listings Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
          Listed Properties ({properties.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property) => {
            const coverImage =
              property.images?.find((img: any) => img.isCover)?.url ||
              property.images?.[0]?.url;
            const callCount = callCountsMap[property._id.toString()] || 0;
            const interestCount = interestCountsMap[property._id.toString()] || 0;

            return (
              <div
                key={property._id.toString()}
                className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image and Header */}
                  <div className="relative h-44 w-full bg-slate-100">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-xs">No preview photo uploaded</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">{getStatusBadge(property.status)}</div>
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      ₹{property.rentAmount?.toLocaleString()}/month
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {property.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {property.localityId?.name || "Locality N/A"}
                        {property.cityId?.name ? `, ${property.cityId.name}` : ""}
                      </p>
                    </div>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {property.bhkConfig}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium capitalize">
                        {property.propertyType?.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium capitalize">
                        {property.furnishingStatus?.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium capitalize">
                        Prefers: {property.tenantPreference}
                      </span>
                    </div>

                    {/* Telemetry Metrics Card */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">
                            Views
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {property.viewsCount || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneCall className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">
                            Calls
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {callCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-rose-500" />
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">
                            Interests
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {interestCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 pb-5">
                  <AdminPropertyCardActions
                    propertyId={property._id.toString()}
                    status={property.status}
                    ownerId={user._id.toString()}
                    canEdit={canEdit}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {properties.length === 0 && (
          <div className="bg-white border rounded-2xl p-12 text-center space-y-3">
            <Home className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No properties listed by this user</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This account has not uploaded any apartment or flatmate listings yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
