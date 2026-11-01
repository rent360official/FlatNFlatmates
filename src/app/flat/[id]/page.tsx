import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import PointOfInterest from "@/models/PointOfInterest";
import User from "@/models/User";
import Locality from "@/models/Locality";
import City from "@/models/City";
import AmenityCache from "@/models/AmenityCache";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import { notFound } from "next/navigation";
import Link from "next/link";
import FlatBackButton from "./FlatBackButton";
import PropertyContactActions from "@/components/property/PropertyContactActions";
import PropertyMediaGallery, { MediaItem } from "@/components/property/PropertyMediaGallery";
import PropertyCommuteSection from "./PropertyCommuteSection";
import PropertyNeighborhoodSection from "./PropertyNeighborhoodSection";
import ReportPropertyModal from "@/components/property/ReportPropertyModal";
import { 
  Navigation, ArrowLeft, Sparkles, Check, Film
} from "lucide-react";
import React from "react";

import { recordPropertyViewDemand } from "@/lib/demandTelemetry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isFeatureActive } from "@/lib/featureAccess";
import { formatTenantPreference } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function FlatDetailPage({ params }: { params: { id: string } }) {
  await dbConnect();
  // Prevent Next.js tree-shaking of models to ensure registration
  const _Locality = Locality;
  const _City = City;

  const property: any = await Property.findById(params.id)
    .populate('localityId', 'name')
    .populate('cityId', 'name')
    .lean();

  if (!property) {
    notFound();
  }

  // Increment real page views count
  await Property.findByIdAndUpdate(params.id, { $inc: { viewsCount: 1 } });

  // Record Demand Telemetry asynchronously
  const session = await getServerSession(authOptions);
  recordPropertyViewDemand(
    {
      _id: property._id,
      title: property.title,
      localityId: property.localityId?._id,
      localityName: property.localityId?.name,
      bhkConfig: property.bhkConfig,
      rentAmount: property.rentAmount,
      furnishingStatus: property.furnishingStatus,
      tenantType: formatTenantPreference(property.tenantPreference),
    },
    session?.user ? { id: (session.user as any).id, role: (session.user as any).role } : null
  ).catch(() => {});

  // Fetch cached amenities counts if available
  const amenityDoc = await AmenityCache.findOne({ propertyId: property._id }).lean();
  const amenities = (amenityDoc?.amenities as any) || null;

  // Calculate distances to Pune POIs dynamically
  const pois = await PointOfInterest.find({ isActive: true }).lean();
  const propLat = property.location?.coordinates?.[1] || 18.5204;
  const propLng = property.location?.coordinates?.[0] || 73.8567;
  
  const nearbyPois = pois.map((poi: any) => {
    const [poiLng, poiLat] = poi.location?.coordinates || [73.8567, 18.5204];
    const dLat = (poiLat - propLat) * (Math.PI / 180);
    const dLon = (poiLng - propLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(propLat * (Math.PI / 180)) * Math.cos(poiLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = parseFloat((6371 * c).toFixed(1));
    return {
      ...poi,
      distanceKm: dist,
      commuteTimeMin: Math.max(5, Math.round(dist * 3.5))
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);

  const owner: any = await User.findById(property.ownerId).lean();
  const flatmateListing: any = await FlatmateProfileListing.findOne({ propertyId: property._id }).lean();
  const flatmateUser: any = flatmateListing ? await User.findById(flatmateListing.userId).lean() : null;

  const rawImages: any[] = Array.isArray(property.images) ? property.images : [];
  const rawVideos: any[] = Array.isArray(property.videos) ? property.videos : [];

  const mediaList: MediaItem[] = [];

  // Add images
  rawImages.forEach((img: any, idx: number) => {
    const url = typeof img === 'string' ? img : img?.url;
    if (url) {
      mediaList.push({
        type: 'image',
        url,
        isCover: typeof img === 'object' ? Boolean(img.isCover) : idx === 0,
        status: typeof img === 'object' ? img.status : 'ready',
        processedUrls: typeof img === 'object' ? img.processedUrls : undefined,
        error: typeof img === 'object' ? img.error : undefined,
      });
    }
  });

  // Add videos
  rawVideos.forEach((vid: any) => {
    const url = typeof vid === 'string' ? vid : vid?.url;
    if (url) {
      mediaList.push({
        type: 'video',
        url,
        status: typeof vid === 'object' ? vid.status : 'ready',
        processedUrl: typeof vid === 'object' ? vid.processedUrl : undefined,
        thumbnailUrl: typeof vid === 'object' ? vid.thumbnailUrl : undefined,
        durationSeconds: typeof vid === 'object' ? vid.durationSeconds : undefined,
        error: typeof vid === 'object' ? vid.error : undefined,
      });
    }
  });

  // Add tourVideoUrl if present and not already added
  if (property.tourVideoUrl && !mediaList.some(m => m.url === property.tourVideoUrl)) {
    mediaList.push({
      type: 'video',
      url: property.tourVideoUrl,
      status: 'ready',
    });
  }

  // Fallback if no media items provided
  if (mediaList.length === 0) {
    mediaList.push({
      type: 'image',
      url: '/placeholder-property.jpg',
      status: 'ready',
    });
  }

  const isInterestSmsEnabled = await isFeatureActive('property_interest_sms', (session?.user as any)?.role);

  const isNA = (fieldKey: string) => {
    return Array.isArray(property.notAvailableFields) && property.notAvailableFields.includes(fieldKey);
  };

  const renderValOrNA = (fieldKey: string, value: React.ReactNode) => {
    if (isNA(fieldKey)) {
      return <span className="text-amber-600 font-medium italic">Information not available</span>;
    }
    return value;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <FlatBackButton />
      </div>

      {/* Property Media Gallery (Images + Videos, Desktop Split, Mobile Swipe Carousel, Lightbox Fullscreen) */}
      <PropertyMediaGallery
        media={mediaList}
        brokerageFlag={property.brokerageFlag}
        propertyTitle={property.title}
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Detail text column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Title */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {property.title}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-slate-500 flex-wrap gap-y-2">
              <span className="font-semibold text-slate-700">
                {renderValOrNA('bhkConfig', property.bhkConfig)}
              </span>
              <span>•</span>
              <span>Locality: {(property.localityId as any)?.name || "N/A"}, Pune</span>
              <span>•</span>
              <span>
                Furnishing: {renderValOrNA('furnishingStatus', property.furnishingStatus.replace('_', ' '))}
              </span>
              <span>•</span>
              <span className="inline-flex items-center bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs uppercase tracking-wide">
                Listed by {property.listerRelation === 'broker' ? 'Broker' : property.listerRelation === 'flatmate' ? 'Flatmate' : 'Owner'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Property Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {renderValOrNA('description', property.description)}
            </p>
          </div>

          {/* Pricing Parameters */}
          <div className="grid grid-cols-3 gap-4 border-t border-b py-6 my-2">
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Rent</span>
              {isNA('rentAmount') ? (
                <span className="text-xs font-semibold text-amber-600 italic block mt-1">Information not available</span>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-slate-900">₹{property.rentAmount.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">/ month</span>
                </>
              )}
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Security Deposit</span>
              {isNA('depositAmount') ? (
                <span className="text-xs font-semibold text-amber-600 italic block mt-1">Information not available</span>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-slate-900">₹{property.depositAmount.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Refundable</span>
                </>
              )}
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Maintenance</span>
              {isNA('maintenanceAmount') ? (
                <span className="text-xs font-semibold text-amber-600 italic block mt-1">Information not available</span>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-slate-900">₹{property.maintenanceAmount.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">/ month</span>
                </>
              )}
            </div>
          </div>

          {/* Amenities & Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Amenities Provided</h3>
              <div className="grid grid-cols-2 gap-2">
                {property.amenities?.map((a: string) => (
                  <div key={a} className="flex items-center space-x-2 text-xs text-slate-600">
                    <Check className="h-4.5 w-4.5 text-brand-primary flex-shrink-0" />
                    <span>{a.replace('_', ' ').toUpperCase()}</span>
                  </div>
                ))}
                {(!property.amenities || property.amenities.length === 0) && (
                  <span className="text-xs text-slate-400">No amenities specified.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">House / Society Rules</h3>
              <div className="grid grid-cols-2 gap-2">
                {property.houseRules?.map((r: string) => (
                  <div key={r} className="flex items-center space-x-2 text-xs text-slate-600">
                    <Check className="h-4.5 w-4.5 text-brand-primary flex-shrink-0" />
                    <span>{r.replace('_', ' ').toUpperCase()}</span>
                  </div>
                ))}
                {(!property.houseRules || property.houseRules.length === 0) && (
                  <span className="text-xs text-slate-400">No specific rules set.</span>
                )}
              </div>
            </div>
          </div>

          {/* Property Details — new fields */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                Property Details
                {property.isVerified && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                    ✓ Verified Listing
                    {property.verifiedAt && (
                      <span className="ml-1 font-normal text-brand-primary">
                        · {new Date(property.verifiedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </span>
                )}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lease Flexibility */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lease Terms</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available From</span>
                    <span className="font-semibold">
                      {renderValOrNA(
                        'availableFrom',
                        new Date(property.availableFrom).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min Lease</span>
                    <span className="font-semibold">
                      {renderValOrNA('minLeaseMonths', `${property.minLeaseMonths} months`)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lock-in Period</span>
                    <span className="font-semibold">
                      {property.lockInMonths === 0 ? 'No lock-in' : `${property.lockInMonths} months`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tenant Fit */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenant Policies</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Tenants</span>
                    <span className="font-semibold">
                      {renderValOrNA('tenantPreference', formatTenantPreference(property.tenantPreference))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pet Policy</span>
                    <span className="font-semibold capitalize">
                      {renderValOrNA(
                        'petPolicy',
                        <span className={property.petPolicy === 'allowed' ? 'text-green-700' : property.petPolicy === 'not_allowed' ? 'text-red-600' : 'text-amber-700'}>
                          {property.petPolicy === 'allowed' ? '🐾 Allowed' : property.petPolicy === 'not_allowed' ? '✗ No Pets' : '⚠ Case by Case'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Occupants</span>
                    <span className="font-semibold">
                      {renderValOrNA('maxOccupants', `${property.maxOccupants} person${property.maxOccupants !== 1 ? 's' : ''}`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parking & EV */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parking & EV</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parking</span>
                    <span className="font-semibold capitalize">
                      {renderValOrNA(
                        'parkingType',
                        property.parkingType === 'none'
                          ? 'No Parking'
                          : property.parkingType === 'two_wheeler'
                          ? 'Two-Wheeler'
                          : property.parkingType === 'four_wheeler'
                          ? 'Four-Wheeler'
                          : 'Both (2W + 4W)'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EV Charging</span>
                    <span className={`font-semibold ${property.evChargingAvailable ? 'text-brand-primaryHover' : 'text-slate-500'}`}>
                      {renderValOrNA('evChargingAvailable', property.evChargingAvailable ? '⚡ Available' : 'Not Available')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infrastructure</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Power Backup</span>
                    <span className="font-semibold capitalize">
                      {renderValOrNA(
                        'powerBackup',
                        property.powerBackup === 'none'
                          ? 'None'
                          : property.powerBackup === 'partial'
                          ? 'Partial'
                          : 'Full Backup'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Water Supply</span>
                    <span className="font-semibold capitalize">
                      {renderValOrNA(
                        'waterSupplyType',
                        property.waterSupplyType === 'municipal' ? 'Municipal (PMC/PMRDA)' : property.waterSupplyType
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Internet & WFH */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WFH & Internet</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fiber Internet</span>
                    <span className={`font-semibold ${property.internetReadiness?.fiberAvailable ? 'text-brand-primaryHover' : 'text-slate-500'}`}>
                      {renderValOrNA(
                        'internetReadiness',
                        property.internetReadiness?.fiberAvailable ? '✓ Available' : 'Not confirmed'
                      )}
                    </span>
                  </div>
                  {property.internetReadiness?.avgSpeedMbps && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Speed</span>
                      <span className="font-semibold">{property.internetReadiness.avgSpeedMbps} Mbps</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Features */}
              {property.safetyFeatures && property.safetyFeatures.length > 0 && (
                <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Safety Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {property.safetyFeatures.map((f: string) => (
                      <span key={f} className="bg-white border text-xs text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Commute Landmark Distances & Interactive Map */}
          <PropertyCommuteSection
            propertyLocation={{ lat: propLat, lng: propLng }}
            propertyTitle={property.title}
            propertyAddress={property.addressLine}
            defaultNearbyPois={nearbyPois}
          />

          {/* Neighborhood Amenities */}
          <PropertyNeighborhoodSection amenities={amenities} />
        </div>

        {/* Action Panel Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-6 sticky top-24">
            
            {/* Price Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Monthly Cost</span>
              {isNA('rentAmount') ? (
                <div className="text-base font-bold text-amber-600 italic py-1">
                  Information not available
                </div>
              ) : (
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    ₹{(property.rentAmount + (isNA('maintenanceAmount') ? 0 : property.maintenanceAmount)).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-normal">
                {isNA('maintenanceAmount') ? 'Maintenance details not available.' : 'Inclusive of maintenance charges.'}
              </p>
            </div>

            {/* Calling & Contact Actions (Call, WhatsApp, Interested via MSG91) */}
            <PropertyContactActions
              propertyId={property._id.toString()}
              propertyTitle={`${property.bhkConfig} in ${property.title}`}
              ownerPhone={owner?.phone}
              allowWhatsappContact={property.allowWhatsappContact !== false}
              showInterestButton={isInterestSmsEnabled}
              currentUserName={session?.user?.name || undefined}
            />

            {/* Flatmate profile button (if registered) */}
            {flatmateListing && flatmateUser && (
              <div className="border-t pt-4 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Flatmate</span>
                <div className="bg-brand-primary/10/50 border border-brand-primary/15 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center font-bold text-brand-primary text-xs uppercase overflow-hidden">
                      {flatmateUser.profilePhoto ? (
                        <img src={flatmateUser.profilePhoto} alt={flatmateUser.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        flatmateUser.name?.charAt(0) || "F"
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{flatmateUser.name}</h4>
                      <span className="text-[9px] text-slate-400 block">{flatmateUser.profession || "Flatmate seeker"} • {flatmateUser.age} yrs</span>
                    </div>
                  </div>
                  <Link href={`/flatmate/${flatmateUser._id.toString()}?from=/flat/${property._id.toString()}`} className="block">
                    <button className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center space-x-1 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-brand-primary/20" />
                      <span>View Flatmate Profile</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Lister / Contact Profile */}
            <div className="border-t pt-4 space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {property.listerRelation === 'broker' ? 'Agent / Broker Contact' : property.listerRelation === 'flatmate' ? 'Flatmate Contact' : 'Owner Contact'}
              </span>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-700 text-sm">
                  {owner?.name?.[0] || "O"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{owner?.name || "Property Lister"}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Relation: <strong className="text-slate-800 capitalize">{property.listerRelation === 'broker' ? 'Broker / Agent' : property.listerRelation === 'flatmate' ? 'Flatmate' : 'Owner'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Report Listing Trigger Button */}
            <div className="border-t pt-3">
              <ReportPropertyModal
                propertyId={property._id.toString()}
                propertyTitle={`${property.bhkConfig ? property.bhkConfig + " in " : ""}${property.title}`}
                isLoggedIn={Boolean(session?.user)}
                currentUser={
                  session?.user
                    ? {
                        name: session.user.name,
                        phone: (session.user as any).phone,
                        email: session.user.email,
                      }
                    : null
                }
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
