import dbConnect from "@/lib/db";
import User from "@/models/User";
import Property from "@/models/Property";
import Locality from "@/models/Locality";
import PropertyInquiry from "@/models/PropertyInquiry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isFeatureActive } from "@/lib/featureAccess";
import PropertyCardActions from "./PropertyCardActions";
import PropertyInquiriesStats from "./PropertyInquiriesStats";
import { Eye, Calendar, Activity, Home, ArrowUpRight, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  // Ensure referenced models are registered in Mongoose
  const _User = User;
  const _Locality = Locality;
  const _PropertyInquiry = PropertyInquiry;
  const _Property = Property;

  const ownerId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  if (!ownerId) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 space-y-3">
        <Home className="h-8 w-8 text-slate-400 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-700">Please sign in</h3>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">You must be signed in to view and manage your properties.</p>
        </div>
      </div>
    );
  }

  // Check Feature Flag for Interest SMS
  const isInterestSmsEnabled = await isFeatureActive('property_interest_sms', userRole);

  let properties: any[] = [];
  try {
    properties = await Property.find({
      ownerId,
      status: { $ne: 'removed' },
    })
    .populate('localityId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  } catch (err) {
    console.error("Error fetching owner properties:", err);
  }

  // Aggregate real inquiries (separated strictly by inquiryType: 'call' vs 'sms_interested')
  const callCountsMap: Record<string, number> = {};
  const interestCountsMap: Record<string, number> = {};
  const propertyIds = properties.map((p: any) => p._id).filter(Boolean);
  
  if (propertyIds.length > 0) {
    try {
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
    } catch (e) {
      console.error("Error aggregating property inquiries:", e);
    }
  }

  // Aggregate real average rent across active properties by locality
  const localityAveragesMap: Record<string, { avgRent: number; count: number }> = {};
  try {
    const localityAverages = await Property.aggregate([
      { $match: { status: 'active', rentAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$localityId',
          avgRent: { $avg: '$rentAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    localityAverages.forEach((item: any) => {
      if (item._id) {
        localityAveragesMap[item._id.toString()] = {
          avgRent: Math.round(item.avgRent || 0),
          count: item.count || 0,
        };
      }
    });
  } catch (e) {
    console.error("Error aggregating locality averages:", e);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-50 text-brand-primary px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase">Active</span>;
      case 'paused':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 uppercase">Paused</span>;
      case 'pending_owner_approval':
        return <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded text-[10px] font-bold border border-violet-200 uppercase">Pending Approval</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border uppercase">{status || 'Draft'}</span>;
    }
  };

  const getDaysLive = (createdAt?: any) => {
    if (!createdAt) return 1;
    const time = new Date(createdAt).getTime();
    if (isNaN(time)) return 1;
    const diffTime = Math.abs(Date.now() - time);
    const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans">My Properties & Analytics</h2>
          <p className="text-xs text-slate-500">Track real views, call inquiries, and market comparison of your listed Pune properties.</p>
        </div>
        <div>
          <Link
            href="/list-property"
            className="inline-flex items-center px-3.5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            + Add New Listing
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {properties && properties.length > 0 ? (
          properties.map((prop: any) => {
            const propId = prop._id ? prop._id.toString() : '';
            const days = getDaysLive(prop.createdAt);
            const views = Number(prop.viewsCount) || 0;
            const calls = propId ? (callCountsMap[propId] || 0) : 0;
            const interests = propId ? (interestCountsMap[propId] || 0) : 0;

            const locId = prop.localityId?._id ? prop.localityId._id.toString() : (prop.localityId?.toString() || '');
            const localityStats = locId ? localityAveragesMap[locId] : null;

            let marketCompareText = "Locality baseline";
            let marketCompareColor = "text-slate-700";

            const rent = Number(prop.rentAmount) || 0;
            if (rent > 0 && localityStats && localityStats.count > 1 && localityStats.avgRent > 0) {
              const diffPct = Math.round(((rent - localityStats.avgRent) / localityStats.avgRent) * 100);
              if (diffPct > 0) {
                marketCompareText = `+${diffPct}% vs locality avg`;
                marketCompareColor = "text-amber-700";
              } else if (diffPct < 0) {
                marketCompareText = `${diffPct}% vs locality avg`;
                marketCompareColor = "text-emerald-700";
              } else {
                marketCompareText = "At locality avg";
                marketCompareColor = "text-brand-primary";
              }
            }

            const coverImage = prop.images?.find((img: any) => img?.isCover)?.url || prop.images?.[0]?.url;

            return (
              <div key={propId} className="bg-white border rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Thumbnail */}
                    <Link
                      href={`/flat/${propId}`}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 group"
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={prop.title || "Property"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/flat/${propId}`}
                          className="text-sm font-bold text-slate-800 hover:text-brand-primary transition-colors flex items-center gap-1 group"
                        >
                          <span>{prop.title || "Untitled Property"}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
                        </Link>
                        {getStatusBadge(prop.status)}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2 text-[11px] text-slate-500 font-medium">
                        <span>{prop.bhkConfig || "1 BHK"}</span>
                        <span>•</span>
                        <span className="capitalize">{prop.furnishingStatus ? prop.furnishingStatus.replace('_', ' ') : 'Unfurnished'}</span>
                        <span>•</span>
                        <span>Locality: {prop.localityId?.name || "Pune"}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-800">₹{(rent || 0).toLocaleString()}/mo</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {prop.addressLine || ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real Performance Stats Grid */}
                <div className={`grid grid-cols-2 ${isInterestSmsEnabled ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100`}>
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Views</span>
                      <span className="text-sm font-bold text-slate-800">{views}</span>
                    </div>
                  </div>

                  {/* Interactive Call Inquiries & Interests Shared with seeker list popup */}
                  <PropertyInquiriesStats
                    propertyId={propId}
                    propertyTitle={prop.title || prop.bhkConfig || "Property"}
                    callCount={calls}
                    interestCount={interests}
                    showInterestStats={isInterestSmsEnabled}
                  />

                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Days Live</span>
                      <span className="text-sm font-bold text-slate-800">{days} {days === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-violet-50 text-brand-secondaryHover rounded-lg">
                      <Activity className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Market Compare</span>
                      <span className={`text-xs font-bold ${marketCompareColor}`}>{marketCompareText}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: View Listing, Edit, Pause/Resume, Remove */}
                {propId && (
                  <PropertyCardActions 
                    propertyId={propId} 
                    status={prop.status || 'active'} 
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 space-y-3">
            <Home className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-700">No properties listed yet</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">List your flat in Pune to track real views, connection analytics, and manage tenant preferences.</p>
            </div>
            <div className="pt-2">
              <Link href="/list-property">
                <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold transition-all shadow-sm">
                  List Your Property
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
