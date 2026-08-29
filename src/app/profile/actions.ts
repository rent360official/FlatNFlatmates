'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Access restricted to logged-in users");
  }
  return session.user as any;
}

export async function updatePersonalInfo(formData: FormData) {
  try {
    const sessionUser = await getSessionUser();
    
    const name = formData.get("name") as string;
    const age = parseInt(formData.get("age") as string);
    const gender = formData.get("gender") as any;
    const profession = formData.get("profession") as string;
    const bio = formData.get("bio") as string;

    // Hobbies and preferences are comma-separated or multiple fields
    const hobbiesRaw = formData.get("hobbies") as string;
    const hobbies = hobbiesRaw ? hobbiesRaw.split(",").map(h => h.trim()).filter(Boolean) : [];

    const flatPrefsRaw = formData.get("flatPreferences") as string;
    const flatPreferences = flatPrefsRaw ? flatPrefsRaw.split(",").map(fp => fp.trim()).filter(Boolean) : [];

    const cleanliness = formData.get("cleanliness") as string;
    const food = formData.get("food") as string;
    const smoking = formData.get("smoking") as string;
    const sleep = formData.get("sleep") as string;

    const vibePreferences = [];
    if (cleanliness) vibePreferences.push(`cleanliness:${cleanliness}`);
    if (food) vibePreferences.push(`food:${food}`);
    if (smoking) vibePreferences.push(`smoking:${smoking}`);
    if (sleep) vibePreferences.push(`sleep:${sleep}`);

    await dbConnect();
    await User.findByIdAndUpdate(sessionUser.id, {
      name,
      age: isNaN(age) ? undefined : age,
      gender,
      profession,
      bio,
      hobbies,
      flatPreferences,
      vibePreferences,
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" };
  }
}

export async function updateRoommateSettings(isSearchable: boolean, targetLocalityIds: string[]) {
  try {
    const sessionUser = await getSessionUser();
    
    await dbConnect();
    await User.findByIdAndUpdate(sessionUser.id, {
      isFlatmateSearchable: isSearchable,
      targetLocations: targetLocalityIds,
    });

    revalidatePath("/profile/roommate");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update roommate settings" };
  }
}

import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import FlatmatePreferences from "@/models/FlatmatePreferences";

export async function updateRoommateProfile(data: {
  isSearchable: boolean;
  targetLocations: string[];
  budgetMin: number;
  budgetMax: number;
  propertyId: string | null;
  // Flatmate Preferences
  userType: 'Student' | 'Professional' | 'Retired' | '';
  profession: 'Government Job' | 'Corporate Job' | 'Self Employed' | 'Others' | '';
  shift: 'Day Shift' | 'Night Shift' | '';
  socialType: 'Socializing' | 'Reserved' | '';
  gymGuy: 'Not at all' | 'Maybe' | 'Definitely' | '';
  outsideEater: 'Too much' | 'Only evening small snacks' | 'No, only homemade foodie' | '';
  // Vibe Preferences (User traits)
  cleanliness: string;
  food: string;
  smoking: string;
  sleep: string;
}) {
  try {
    const sessionUser = await getSessionUser();
    await dbConnect();

    // 1. Update User Document
    const vibePreferences = [];
    if (data.cleanliness) vibePreferences.push(`cleanliness:${data.cleanliness}`);
    if (data.food) vibePreferences.push(`food:${data.food}`);
    if (data.smoking) vibePreferences.push(`smoking:${data.smoking}`);
    if (data.sleep) vibePreferences.push(`sleep:${data.sleep}`);

    await User.findByIdAndUpdate(sessionUser.id, {
      isFlatmateSearchable: data.isSearchable,
      targetLocations: data.targetLocations,
      vibePreferences,
    });

    // 2. Update/Create FlatmateProfileListing Document
    let listing = await FlatmateProfileListing.findOne({ userId: sessionUser.id });
    if (!listing) {
      listing = new FlatmateProfileListing({ userId: sessionUser.id });
    }
    listing.budgetMin = data.budgetMin;
    listing.budgetMax = data.budgetMax;
    listing.propertyId = data.propertyId ? new mongoose.Types.ObjectId(data.propertyId) : undefined;
    listing.isActive = data.isSearchable;
    await listing.save();

    // 3. Update/Create FlatmatePreferences Document
    let prefs = await FlatmatePreferences.findOne({ userId: sessionUser.id });
    if (!prefs) {
      prefs = new FlatmatePreferences({ userId: sessionUser.id });
    }
    prefs.userType = data.userType || undefined;
    prefs.profession = data.profession || undefined;
    prefs.shift = data.shift || undefined;
    prefs.socialType = data.socialType || undefined;
    prefs.gymGuy = data.gymGuy || undefined;
    prefs.outsideEater = data.outsideEater || undefined;
    await prefs.save();

    revalidatePath("/profile/roommate");
    revalidatePath("/search/flatmates");
    return { success: true };
  } catch (error: any) {
    console.error("updateRoommateProfile server action error:", error);
    return { error: error.message || "Failed to update roommate profile settings" };
  }
}

