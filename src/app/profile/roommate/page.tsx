import dbConnect from "@/lib/db";
import User from "@/models/User";
import Locality from "@/models/Locality";
import Property from "@/models/Property";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import FlatmatePreferences from "@/models/FlatmatePreferences";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import RoommateOnboardingForm from "./RoommateOnboardingForm";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function RoommateSettingsPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();

  const userId = (session?.user as any)?.id;
  const user = await User.findById(userId).lean();
  const localities = await Locality.find({ isActive: true }).sort({ name: 1 }).lean();

  if (!user) {
    return <div className="text-sm text-slate-500 font-sans">Loading profile data...</div>;
  }

  // Fetch flatmate profile listing
  const listing = await FlatmateProfileListing.findOne({ userId: user._id }).lean();

  // Fetch flatmate preferences
  const preferences = await FlatmatePreferences.findOne({ userId: user._id }).lean();

  // Fetch properties registered by this user (owner)
  const properties = await Property.find({ ownerId: user._id, status: 'active' }).lean();

  // Serialize IDs for client component
  const initialTargetLocations = user.targetLocations?.map((locId: any) => locId.toString()) || [];
  
  const serializedLocalities = localities.map((loc: any) => ({
    _id: loc._id.toString(),
    name: loc.name,
  }));

  const serializedProperties = properties.map((prop: any) => ({
    _id: prop._id.toString(),
    title: prop.title,
  }));

  // Parse vibe preferences from user document (cleanliness:high -> high)
  const findVibe = (key: string) => {
    const entry = user.vibePreferences?.find((v: string) => v.startsWith(`${key}:`));
    return entry ? entry.split(":")[1] : "";
  };

  const initialVibes = {
    cleanliness: findVibe("cleanliness"),
    food: findVibe("food"),
    smoking: findVibe("smoking"),
    sleep: findVibe("sleep"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-sans">Roommate Settings</h2>
        <p className="text-xs text-slate-500">Configure your discoverability options, target areas, property status, lifestyle vibes, and roommate preferences in Pune.</p>
      </div>

      <RoommateOnboardingForm 
        initialSearchable={user.isFlatmateSearchable || false}
        initialTargetLocations={initialTargetLocations}
        localities={serializedLocalities}
        properties={serializedProperties}
        initialListing={{
          budgetMin: listing?.budgetMin || 5000,
          budgetMax: listing?.budgetMax || 20000,
          propertyId: listing?.propertyId ? listing.propertyId.toString() : "",
        }}
        initialPreferences={{
          userType: preferences?.userType || "",
          profession: preferences?.profession || "",
          shift: preferences?.shift || "",
          socialType: preferences?.socialType || "",
          gymGuy: preferences?.gymGuy || "",
          outsideEater: preferences?.outsideEater || "",
        }}
        initialVibes={initialVibes}
      />
    </div>
  );
}
