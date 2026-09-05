import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import PointOfInterest from "@/models/PointOfInterest";
import User from "@/models/User";
import CallLog from "@/models/CallLog";
import Locality from "@/models/Locality";
import City from "@/models/City";
import AmenityCache from "@/models/AmenityCache";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import { notFound } from "next/navigation";
import Link from "next/link";
import CallButton from "./CallButton";
import { 
  Navigation, ArrowLeft, Sparkles, Check, AlertTriangle, Film
} from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function FlatDetailPage({ params }: { params: { id: string } }) {
  await dbConnect();
  // Prevent Next.js tree-shaking of models to ensure registration
  const _Locality = Locality;
  const _City = City;

  const property = await Property.findById(params.id)
    .populate('localityId', 'name')
    .populate('cityId', 'name')
    .lean();

  if (!property) {
    notFound();
  }

  // Increment real page views count
  await Property.findByIdAndUpdate(params.id, { $inc: { viewsCount: 1 } });

  // Fetch cached amenities counts
  const amenityDoc = await AmenityCache.findOne({ propertyId: property._id }).lean();
  const amenities = (amenityDoc?.amenities as any) || {
    gyms: 1,
    cafes: 3,
    nightlife: 2,
    supermarkets: 1,
    transit: 0,
    hospitals: 1,
    parks: 1
  };

  // Fetch the latest call log to check for soft availability warnings
  const latestCall = await CallLog.findOne({ propertyId: property._id })
    .sort({ createdAt: -1 })
    .lean();
  const isReportedRented = latestCall?.detectedAvailability === 'rented';

  // Calculate distances to Pune POIs dynamically
  const pois = await PointOfInterest.find({ isActive: true }).lean();
  
  const propLat = property.location.coordinates[1];
  const propLng = property.location.coordinates[0];

  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const nearbyPois = pois.map((poi: any) => {
    const dist = getDistanceInKm(
      propLat,
      propLng,
      poi.location.coordinates[1],
      poi.location.coordinates[0]
    );
    return {
      ...poi,
      distanceKm: parseFloat(dist.toFixed(2)),
      commuteTimeMin: Math.round(dist * 3.5 + 2),
    };
  })
  .sort((a, b) => a.distanceKm - b.distanceKm)
  .slice(0, 4);

  // Find owner/landlord profile
  const owner = await User.findById(property.ownerId).lean();

  // Find if there is a flatmate profile listing registered with this property
  const flatmateListing = await FlatmateProfileListing.findOne({
    propertyId: property._id,
    isActive: true,
  }).lean();

  let flatmateUser = null;
  if (flatmateListing) {
    flatmateUser = await User.findById(flatmateListing.userId).lean();
  }

  // Find roommates associated with this property's locality who are searchable
  const roommates = await User.find({
    isFlatmateSearchable: true,
    targetLocations: (property.localityId as any)?._id,
  })
  .limit(2)
  .lean();

  const primaryImage = property.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
  const detailImage = property.images?.[1]?.url || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-grow space-y-8">
      {/* Back link */}
      <div>
        <Link href="/search/flats" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Pune search</span>
        </Link>
      </div>

      {/* Soft warning banner if reported rented */}
      {isReportedRented && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-800 animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0 animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold">Soft Status: Reported as Rented</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
              Warning: A recent call connection log suggests this flat may no longer be available. Owner status confirmation is pending.
            </p>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[300px] md:h-[450px]">
        <div className="md:col-span-8 bg-slate-100 rounded-2xl overflow-hidden relative border">
          <img src={primaryImage} className="h-full w-full object-cover" alt="Primary Cover View" />
          {!property.brokerageFlag && (
            <span className="absolute top-4 left-4 bg-status-successBg/150 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg shadow-md border border-emerald-400 uppercase tracking-wider">
              Zero Brokerage
            </span>
          )}
        </div>
        <div className="hidden md:flex md:col-span-4 flex-col gap-4">
          <div className="h-1/2 bg-slate-100 rounded-2xl overflow-hidden border">
            <img src={detailImage} className="h-full w-full object-cover" alt="Interior Details" />
          </div>
          <div className="h-1/2 bg-slate-50 rounded-2xl border flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-1">
            <Sparkles className="h-6 w-6 text-brand-primary/60" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">More Photos</span>
            <p className="text-[9px] text-slate-400">Upgrade to Vibe Premium to see full VR tours</p>
          </div>
        </div>
      </div>

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
              <span className="font-semibold text-slate-700">{property.bhkConfig}</span>
              <span>•</span>
              <span>Locality: {(property.localityId as any)?.name || "N/A"}, Pune</span>
              <span>•</span>
              <span>Furnishing: {property.furnishingStatus.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Property Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{property.description}</p>
          </div>

          {/* Pricing Parameters */}
          <div className="grid grid-cols-3 gap-4 border-t border-b py-6 my-2">
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Rent</span>
              <span className="text-lg font-extrabold text-slate-900">₹{property.rentAmount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">/ month</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Security Deposit</span>
              <span className="text-lg font-extrabold text-slate-900">₹{property.depositAmount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Refundable</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Maintenance</span>
              <span className="text-lg font-extrabold text-slate-900">₹{property.maintenanceAmount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">/ month</span>
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
                    <span className="font-semibold">{new Date(property.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min Lease</span>
                    <span className="font-semibold">{property.minLeaseMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lock-in Period</span>
                    <span className="font-semibold">{property.lockInMonths === 0 ? 'No lock-in' : `${property.lockInMonths} months`}</span>
                  </div>
                </div>
              </div>

              {/* Tenant Fit */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenant Policies</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pet Policy</span>
                    <span className={`font-semibold capitalize ${property.petPolicy === 'allowed' ? 'text-green-700' : property.petPolicy === 'not_allowed' ? 'text-red-600' : 'text-amber-700'}`}>
                      {property.petPolicy === 'allowed' ? '🐾 Allowed' : property.petPolicy === 'not_allowed' ? '✗ No Pets' : '⚠ Case by Case'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Occupants</span>
                    <span className="font-semibold">{property.maxOccupants} person{property.maxOccupants !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Parking & EV */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parking & EV</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parking</span>
                    <span className="font-semibold capitalize">{property.parkingType === 'none' ? 'No Parking' : property.parkingType === 'two_wheeler' ? 'Two-Wheeler' : property.parkingType === 'four_wheeler' ? 'Four-Wheeler' : 'Both (2W + 4W)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EV Charging</span>
                    <span className={`font-semibold ${property.evChargingAvailable ? 'text-brand-primaryHover' : 'text-slate-500'}`}>
                      {property.evChargingAvailable ? '⚡ Available' : 'Not Available'}
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
                    <span className="font-semibold capitalize">{property.powerBackup === 'none' ? 'None' : property.powerBackup === 'partial' ? 'Partial' : 'Full Backup'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Water Supply</span>
                    <span className="font-semibold capitalize">{property.waterSupplyType === 'municipal' ? 'Municipal (PMC/PMRDA)' : property.waterSupplyType}</span>
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
                      {property.internetReadiness?.fiberAvailable ? '✓ Available' : 'Not confirmed'}
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

          {/* Property Video Tours */}
          {((property.videos && property.videos.length > 0) || property.tourVideoUrl) && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-brand-primary" />
                  Video Tour & Walkthroughs ({property.videos?.length || 1})
                </h3>
                <p className="text-[11px] text-slate-400">High-definition video walkthroughs uploaded by the property owner.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(property.videos && property.videos.length > 0
                  ? property.videos
                  : [{ url: property.tourVideoUrl!, fileName: 'Tour Video' }]
                ).map((vid: any, idx: number) => (
                  <div key={idx} className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-800 flex flex-col">
                    <video
                      src={vid.url}
                      controls
                      preload="metadata"
                      className="w-full max-h-56 bg-black object-contain"
                    />
                    {vid.fileName && (
                      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 text-[11px] font-medium text-slate-300 truncate">
                        {vid.fileName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commute Distances Locator */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Commute Landmark Distances</h3>
              <p className="text-[11px] text-slate-400">Exact coordinates distance mapping to main Pune transit & office nodes.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyPois.map((poi: any) => (
                <div key={poi._id.toString()} className="flex items-start space-x-3 p-3 bg-slate-50 border rounded-xl">
                  <div className="p-2 bg-brand-primary/10 text-brand-primary rounded mt-0.5">
                    <Navigation className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-850">{poi.name}</h4>
                    <p className="text-[10px] text-slate-400 block capitalize">{poi.type} node</p>
                    <span className="text-[10px] font-bold text-brand-primaryHover block mt-1">
                      {poi.distanceKm} km away (~{poi.commuteTimeMin} mins driving)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neighborhood Amenities */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Neighborhood Amenities</h3>
              <p className="text-[11px] text-slate-400">Nearby establishments mapped within 1.5 km of this property location.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Gyms", val: amenities.gyms, minDist: (amenities as any).gymsMinDist, icon: "🏋️" },
                { label: "Cafés/Eateries", val: amenities.cafes, minDist: (amenities as any).cafesMinDist, icon: "🍕" },
                { label: "Supermarkets", val: amenities.supermarkets, minDist: (amenities as any).supermarketsMinDist, icon: "🛒" },
                { label: "Transit Points", val: amenities.transit, minDist: (amenities as any).transitMinDist, icon: "🚇" },
                { label: "Hospitals/Clinics", val: amenities.hospitals, minDist: (amenities as any).hospitalsMinDist, icon: "🏥" },
                { label: "Parks/Greenery", val: amenities.parks, minDist: (amenities as any).parksMinDist, icon: "🌳" },
                { label: "Nightlife/Bars", val: amenities.nightlife, minDist: (amenities as any).nightlifeMinDist, icon: "🍺" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-slate-50 border rounded-xl flex items-center space-x-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-800">{item.val} {item.label}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">
                      {item.minDist ? `Closest: ${item.minDist} km` : "Nearby"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-6 sticky top-24">
            
            {/* Price Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Monthly Cost</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-extrabold text-slate-900">₹{(property.rentAmount + property.maintenanceAmount).toLocaleString()}</span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Inclusive of maintenance charges.</p>
            </div>

            {/* Calling trigger */}
            <CallButton propertyId={property._id.toString()} />

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
                  <Link href={`/flatmate/${flatmateUser._id.toString()}`} className="block">
                    <button className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center space-x-1 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-brand-primary/20" />
                      <span>View Flatmate Profile</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Landlord Profile */}
            <div className="border-t pt-4 space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Landlord Contact</span>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-700 text-sm">
                  {owner?.name?.[0] || "O"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{owner?.name || "Landlord Owner"}</h4>
                  <span className="text-[10px] text-slate-400 capitalize">Role: {owner?.role || "Landlord"}</span>
                </div>
              </div>
            </div>

            {/* Attached roommate finder info */}
            {roommates.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flatmate Match</span>
                <div className="space-y-2">
                  {roommates.map((r: any) => (
                    <div key={r._id.toString()} className="bg-slate-50 border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{r.name}</h4>
                        <span className="text-[9px] text-slate-400 block">{r.profession || "Roommate seeker"}</span>
                      </div>
                      <span className="text-[9px] bg-brand-primary/10 text-brand-primaryHover px-2 py-0.5 rounded font-bold border border-brand-primary/15">
                        Compatible
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
