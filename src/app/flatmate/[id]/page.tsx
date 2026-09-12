import dbConnect from "@/lib/db";
import User from "@/models/User";
import PointOfInterest from "@/models/PointOfInterest";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import Locality from "@/models/Locality";
import Property from "@/models/Property";
import { notFound } from "next/navigation";
import Link from "next/link";
import CallButton from "./CallButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  ArrowLeft, Check, Sparkles, Navigation, User as UserIcon,
  Heart, ShieldCheck, MapPin, Smile, Home, DollarSign
} from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function FlatmateDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  await dbConnect();
  // Prevent Next.js tree-shaking of models to ensure registration
  const _Locality = Locality;
  const _Property = Property;

  const user = await User.findById(params.id)
    .populate('targetLocations')
    .lean();

  if (!user) {
    notFound();
  }

  // Get active Pune POIs to calculate commute anchor distances
  const pois = await PointOfInterest.find({ isActive: true }).lean();

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

  // Map user's target localities with nearest commute landmarks
  const localitiesWithCommute = (user.targetLocations || []).map((loc: any) => {
    const locLng = loc.location?.coordinates[0];
    const locLat = loc.location?.coordinates[1];

    let commuteData: any[] = [];
    if (locLat !== undefined && locLng !== undefined) {
      commuteData = pois.map((poi: any) => {
        const dist = getDistanceInKm(
          locLat,
          locLng,
          poi.location.coordinates[1],
          poi.location.coordinates[0]
        );
        return {
          poiName: poi.name,
          poiType: poi.type,
          distanceKm: parseFloat(dist.toFixed(2)),
          commuteTimeMin: Math.round(dist * 3.5 + 2),
        };
      })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 2); // get top 2 nearest POIs per locality
    }

    return {
      _id: loc._id.toString(),
      name: loc.name,
      commute: commuteData,
    };
  });

  // Fetch listing information for budget and property attachments
  const listing = await FlatmateProfileListing.findOne({ userId: user._id, isActive: true })
    .populate('propertyId')
    .lean();

  const getVibeVal = (prefix: string) => {
    const found = user.vibePreferences?.find(vp => vp.startsWith(prefix));
    return found ? found.split(":")[1] : "not specified";
  };

  const cleanliness = getVibeVal("cleanliness");
  const food = getVibeVal("food");
  const smoking = getVibeVal("smoking");
  const sleep = getVibeVal("sleep");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-grow space-y-8">
      {/* Back link */}
      <div>
        <Link href="/search/flatmates" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to roommate search</span>
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Seeker Profile Column */}
        <div className="lg:col-span-8 space-y-8">

          {/* Main User Card Details */}
          <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-20 w-20 rounded-full bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary font-extrabold text-3xl uppercase flex-shrink-0 shadow-inner">
              {user.name ? user.name.charAt(0) : "S"}
            </div>

            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user.name || "Pune Seeker"}</h1>
                {user.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center bg-brand-primary/10 text-brand-primaryHover px-2 py-0.5 rounded text-[10px] font-bold border border-brand-primary/15 uppercase tracking-wide">
                    <ShieldCheck className="h-3 w-3 mr-1 text-brand-primary" /> Verified Seeker
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {user.age ? `${user.age} years old` : ""} • <span className="capitalize">{user.gender || "other"}</span> • {user.profession || "Professional"}
              </p>
              {user.bio && (
                <p className="text-xs text-slate-600 leading-relaxed font-sans italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                  &ldquo;{user.bio}&ldquo;
                </p>
              )}
            </div>
          </div>

          {/* Lifestyle / Habits Widgets */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Roommate Lifestyle preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-1">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cleanliness Level</span>
                <span className="text-xs font-bold text-slate-850 capitalize">
                  {cleanliness === 'high' ? 'Obsessive (Very Clean)' : cleanliness === 'moderate' ? 'Moderate (Standard)' : cleanliness === 'low' ? 'Laid-back (Relaxed)' : 'Not Specified'}
                </span>
              </div>
              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-1">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Food Habits</span>
                <span className="text-xs font-bold text-slate-850 capitalize">
                  {food === 'veg_only' ? 'Strictly Vegetarian' : food === 'egg_allowed' ? 'Eggetarian' : food === 'any' ? 'No Restrictions' : 'Not Specified'}
                </span>
              </div>
              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-1">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Smoking / Drinking</span>
                <span className="text-xs font-bold text-slate-850 capitalize">
                  {smoking === 'no' ? 'Strictly Non-smoker/drinker' : smoking === 'occasional' ? 'Occasional / Outside only' : smoking === 'yes' ? 'No restrictions' : 'Not Specified'}
                </span>
              </div>
              <div className="p-4 border rounded-xl bg-white shadow-sm space-y-1">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sleep Schedule</span>
                <span className="text-xs font-bold text-slate-850 capitalize">
                  {sleep === 'early_bird' ? 'Early Bird (Rise early, sleep early)' : sleep === 'night_owl' ? 'Night Owl (Late hours)' : sleep === 'flexible' ? 'Flexible' : 'Not Specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Hobbies & Houselist Prefs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Heart className="h-4 w-4 mr-1.5 text-brand-primary" /> Hobbies & Interests
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {user.hobbies?.map((hobby: string) => (
                  <span key={hobby} className="text-xs bg-brand-primary/10/50 text-brand-primaryHover px-3 py-1 rounded-lg font-semibold border border-brand-primary/15">
                    {hobby}
                  </span>
                ))}
                {(!user.hobbies || user.hobbies.length === 0) && (
                  <span className="text-xs text-slate-400">No hobbies listed.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Smile className="h-4 w-4 mr-1.5 text-brand-primary" /> Flat Preference Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {user.flatPreferences?.map((tag: string) => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-650 px-3 py-1 rounded-lg font-semibold border border-slate-200">
                    {tag}
                  </span>
                ))}
                {(!user.flatPreferences || user.flatPreferences.length === 0) && (
                  <span className="text-xs text-slate-400">No preferences listed.</span>
                )}
              </div>
            </div>
          </div>

          {/* Target Localities and Commute Distance */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-brand-primary" /> Target Localities & Commutes
              </h3>
              <p className="text-[11px] text-slate-400">Showing the candidate&apos;s preferred Pune living zones and their commute landmark proximities.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {localitiesWithCommute.map((loc: any) => (
                <div key={loc._id} className="bg-slate-50 border rounded-xl p-4 space-y-3 shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block border-b pb-1.5">{loc.name}</span>

                  {loc.commute && loc.commute.length > 0 ? (
                    <div className="space-y-2.5">
                      {loc.commute.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start space-x-2 text-[10px]">
                          <Navigation className="h-3.5 w-3.5 text-brand-primary mt-0.5 flex-shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-700 block">{item.poiName}</span>
                            <span className="text-brand-primary font-semibold block">{item.distanceKm} km away (~{item.commuteTimeMin} mins drive)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 block italic">No POI commute landmarks computed.</span>
                  )}
                </div>
              ))}
              {localitiesWithCommute.length === 0 && (
                <span className="text-xs text-slate-400 italic">No specific localities targeted. Open to all Pune regions.</span>
              )}
            </div>
          </div>

        </div>

        {/* Action Panel Column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Contact Box */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-6 sticky top-24">

            {/* Budget Panel */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <DollarSign className="h-3.5 w-3.5 text-brand-primary mr-1" /> Budget Range
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {listing?.budgetMin && listing?.budgetMax
                    ? `₹${listing.budgetMin.toLocaleString()} - ₹${listing.budgetMax.toLocaleString()}`
                    : listing?.budgetMax
                    ? `Up to ₹${listing.budgetMax.toLocaleString()}`
                    : listing?.budgetMin
                    ? `From ₹${listing.budgetMin.toLocaleString()}`
                    : "Flexible"}
                </span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Proposed share of monthly rental budget.</p>
            </div>

            {/* Calling & WhatsApp Contact */}
            <CallButton
              calleePhone={user.phone}
              calleeName={user.name || "Seeker"}
              isLoggedIn={Boolean(session?.user)}
              flatmateId={params.id}
            />

            {/* Attached Flat Card */}
            {listing?.propertyId && (
              <div className="border-t pt-5 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Home className="h-3.5 w-3.5 text-brand-primary mr-1" /> Attached Flat Listing
                </span>

                <div className="border rounded-xl p-3 bg-slate-50 border-slate-200 shadow-inner space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{(listing.propertyId as any).title}</h4>
                    <span className="text-[9px] text-slate-450 block uppercase font-medium">
                      {(listing.propertyId as any).bhkConfig} • {(listing.propertyId as any).furnishingStatus?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 mt-1">
                    <div>
                      <span className="text-[8px] text-slate-400 block uppercase">Rent</span>
                      <span className="text-xs font-bold text-slate-850">₹{(listing.propertyId as any).rentAmount?.toLocaleString()}</span>
                    </div>

                    <Link href={`/flat/${(listing.propertyId as any)._id}`}>
                      <button className="bg-brand-primary/10 hover:bg-brand-primary/15 text-brand-primaryHover px-3 py-1 rounded text-[10px] font-bold border border-brand-primary/20 transition-colors">
                        View Flat
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Disclaimer */}
            <div className="border-t pt-4">
              <span className="block text-[9px] text-slate-400 leading-relaxed">
                Connect directly with verified flatmates. Always discuss lifestyle preferences, shared bills, and visit properties in person before finalizing agreements.
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
