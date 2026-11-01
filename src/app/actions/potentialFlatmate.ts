'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import FlatmatePreferences from "@/models/FlatmatePreferences";
import Locality from "@/models/Locality";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

/**
 * Retrieves the current user's flatmate discoverability status and essential profile details.
 */
export async function getPotentialFlatmateStatusAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        isAuthenticated: false,
        isSearchable: false,
        user: null,
        localities: await getTopLocalities(),
      };
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const [user, listing, prefs, topLocalities] = await Promise.all([
      User.findById(userId)
        .select('name phone gender isFlatmateSearchable targetLocations')
        .lean(),
      FlatmateProfileListing.findOne({ userId }).select('budgetMax budgetMin isActive').lean(),
      FlatmatePreferences.findOne({ userId }).select('userType').lean(),
      getTopLocalities(),
    ]);

    if (!user) {
      return {
        isAuthenticated: false,
        isSearchable: false,
        user: null,
        localities: topLocalities,
      };
    }

    return {
      isAuthenticated: true,
      isSearchable: Boolean(user.isFlatmateSearchable),
      user: {
        _id: user._id.toString(),
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        isSearchable: Boolean(user.isFlatmateSearchable),
        targetLocations: (user.targetLocations || []).map((loc: any) => loc.toString()),
        budgetMax: listing?.budgetMax || 15000,
        budgetMin: listing?.budgetMin || 5000,
        userType: prefs?.userType || 'Professional',
      },
      localities: topLocalities,
    };
  } catch (error: any) {
    console.error("Error fetching potential flatmate status:", error);
    return {
      isAuthenticated: false,
      isSearchable: false,
      user: null,
      localities: [],
    };
  }
}

/**
 * Helper to fetch top active Pune localities for quick selection.
 */
async function getTopLocalities() {
  try {
    await dbConnect();
    const raw = await Locality.find({ isActive: true })
      .select('_id name')
      .sort({ name: 1 })
      .limit(30)
      .lean();

    return raw.map((l: any) => ({
      _id: l._id.toString(),
      name: l.name,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * 1-click toggle to turn on/off flatmate discoverability.
 */
export async function toggleFlatmateSearchableAction(isSearchable: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Please log in to update your flatmate discoverability status." };
    }

    const userId = (session.user as any).id;
    await dbConnect();

    await User.findByIdAndUpdate(userId, {
      isFlatmateSearchable: isSearchable,
    });

    await FlatmateProfileListing.findOneAndUpdate(
      { userId },
      { $set: { isActive: isSearchable } },
      { upsert: true }
    );

    revalidatePath("/search/flatmates");
    revalidatePath("/search/flats");
    revalidatePath("/profile/roommate");

    return { success: true, isSearchable };
  } catch (error: any) {
    console.error("Error toggling flatmate searchable status:", error);
    return { error: error.message || "Failed to update discoverability status." };
  }
}

/**
 * Saves quick essential onboarding info from the highlighted popup and marks user as searchable.
 */
export async function saveQuickPotentialFlatmateAction(data: {
  isSearchable: boolean;
  targetLocations?: string[];
  budgetMax?: number;
  userType?: 'Student' | 'Professional' | 'Retired' | '';
  gender?: 'male' | 'female' | 'other';
  name?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Please log in to mark yourself as a searchable flatmate." };
    }

    const userId = (session.user as any).id;
    await dbConnect();

    // 1. Update User document with discoverability and target locations
    const userUpdate: any = {
      isFlatmateSearchable: data.isSearchable,
    };

    if (Array.isArray(data.targetLocations) && data.targetLocations.length > 0) {
      userUpdate.targetLocations = data.targetLocations
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    if (data.gender) {
      userUpdate.gender = data.gender;
    }

    if (data.name && data.name.trim()) {
      userUpdate.name = data.name.trim();
    }

    await User.findByIdAndUpdate(userId, { $set: userUpdate });

    // 2. Update FlatmateProfileListing (budget and discoverability)
    await FlatmateProfileListing.findOneAndUpdate(
      { userId },
      {
        $set: {
          isActive: data.isSearchable,
          budgetMin: Math.max(3000, (data.budgetMax || 15000) * 0.5),
          budgetMax: data.budgetMax || 15000,
        },
      },
      { upsert: true }
    );

    // 3. Update FlatmatePreferences (userType)
    if (data.userType) {
      await FlatmatePreferences.findOneAndUpdate(
        { userId },
        { $set: { userType: data.userType } },
        { upsert: true }
      );
    }

    revalidatePath("/search/flatmates");
    revalidatePath("/search/flats");
    revalidatePath("/profile/roommate");

    return { success: true, isSearchable: data.isSearchable };
  } catch (error: any) {
    console.error("Error saving quick flatmate profile:", error);
    return { error: error.message || "Failed to save profile and discoverability." };
  }
}
