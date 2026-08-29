export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Locality from "@/models/Locality";
import PointOfInterest from "@/models/PointOfInterest";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import FlatmatePreferences from "@/models/FlatmatePreferences";
import CommuteCache from "@/models/CommuteCache";
import AmenityCache from "@/models/AmenityCache";
import Lease from "@/models/Lease";
import Property from "@/models/Property";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";

// Haversine distance calculator in km
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Call Google Maps Distance Matrix or use cached commute details
async function getCommuteForPoi(
  propertyId: string,
  propLat: number,
  propLng: number,
  poi: { label: string; lat: number; lng: number }
) {
  try {
    // 1. Check cache
    const cached = await CommuteCache.findOne({
      propertyId,
      destLat: poi.lat,
      destLng: poi.lng,
    }).lean();
    if (cached) {
      return { distanceKm: cached.distanceKm, durationMin: cached.durationMin };
    }

    // 2. Fetch from Distance Matrix API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && !apiKey.includes("PLACEHOLDER") && !apiKey.includes("mock") && apiKey !== "") {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${propLat},${propLng}&destinations=${poi.lat},${poi.lng}&key=${apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      const data = await response.json();
      if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
        const element = data.rows[0].elements[0];
        const distanceKm = parseFloat((element.distance.value / 1000).toFixed(2));
        const durationMin = Math.round(element.duration.value / 60);

        // Save to cache
        await CommuteCache.create({
          propertyId,
          destLat: poi.lat,
          destLng: poi.lng,
          distanceKm,
          durationMin,
        }).catch((err) => console.error("Commute cache save error:", err));

        return { distanceKm, durationMin };
      }
    }
  } catch (err) {
    console.error("Distance Matrix call failed or timed out for POI:", poi.label, err);
  }

  // Fallback: Haversine straight-line distance
  const dist = getDistanceInKm(propLat, propLng, poi.lat, poi.lng);
  const distanceKm = parseFloat(dist.toFixed(2));
  const durationMin = Math.round(dist * 3.5 + 2); // 3.5 min/km drive speed + 2 min overhead
  return { distanceKm, durationMin };
}

// Call Google Places API or read from cache
async function getAmenitiesForProperty(propertyId: string, propLat: number, propLng: number) {
  try {
    // 1. Check cache
    const cached = await AmenityCache.findOne({ propertyId }).lean();
    if (cached) {
      return cached.amenities;
    }

    const amenities: Record<string, any> = {
      gyms: 0,
      gymsMinDist: null,
      cafes: 0,
      cafesMinDist: null,
      nightlife: 0,
      nightlifeMinDist: null,
      supermarkets: 0,
      supermarketsMinDist: null,
      transit: 0,
      transitMinDist: null,
      hospitals: 0,
      hospitalsMinDist: null,
      parks: 0,
      parksMinDist: null,
    };

    // 2. Fetch from Places API Nearby Search
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && !apiKey.includes("PLACEHOLDER") && !apiKey.includes("mock") && apiKey !== "") {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${propLat},${propLng}&radius=1500&key=${apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      const data = await response.json();
      if (data.status === "OK" && Array.isArray(data.results)) {
        data.results.forEach((place: any) => {
          const types = place.types || [];
          const placeLat = place.geometry?.location?.lat;
          const placeLng = place.geometry?.location?.lng;
          if (placeLat === undefined || placeLng === undefined) return;

          const dist = getDistanceInKm(propLat, propLng, placeLat, placeLng);

          const updateMinDist = (key: string, distance: number) => {
            const minKey = `${key}MinDist`;
            if (amenities[minKey] === null || distance < amenities[minKey]) {
              amenities[minKey] = parseFloat(distance.toFixed(2));
            }
          };

          if (types.includes("gym") || types.includes("health")) {
            amenities.gyms++;
            updateMinDist("gyms", dist);
          }
          if (types.includes("cafe") || types.includes("restaurant") || types.includes("food")) {
            amenities.cafes++;
            updateMinDist("cafes", dist);
          }
          if (types.includes("bar") || types.includes("nightclub")) {
            amenities.nightlife++;
            updateMinDist("nightlife", dist);
          }
          if (types.includes("supermarket") || types.includes("grocery_or_supermarket") || types.includes("convenience_store")) {
            amenities.supermarkets++;
            updateMinDist("supermarkets", dist);
          }
          if (types.includes("transit_station") || types.includes("subway_station") || types.includes("bus_station") || types.includes("train_station")) {
            amenities.transit++;
            updateMinDist("transit", dist);
          }
          if (types.includes("hospital") || types.includes("doctor")) {
            amenities.hospitals++;
            updateMinDist("hospitals", dist);
          }
          if (types.includes("park") || types.includes("tourist_attraction")) {
            amenities.parks++;
            updateMinDist("parks", dist);
          }
        });

        // Save to cache
        await AmenityCache.create({
          propertyId,
          amenities,
        }).catch((err) => console.error("Amenity cache save error:", err));

        return amenities;
      }
    }
  } catch (err) {
    console.error("Google Places API call failed or timed out for property:", propertyId, err);
  }

  // Fallback defaults if Places API is unavailable
  return {
    gyms: 1,
    gymsMinDist: 0.6,
    cafes: 2,
    cafesMinDist: 0.3,
    nightlife: 1,
    nightlifeMinDist: 0.8,
    supermarkets: 1,
    supermarketsMinDist: 0.5,
    transit: 0,
    transitMinDist: null,
    hospitals: 1,
    hospitalsMinDist: 1.2,
    parks: 1,
    parksMinDist: 0.7,
  };
}

// Calculate compatibility score between searcher preferences and active tenant preferences
function calculateTenantCompatibility(searcherPrefs: any, tenantProfile: any, tenantPrefs: any) {
  let matches = 0;
  let totalFields = 0;

  if (searcherPrefs.userType && searcherPrefs.userType !== "Any") {
    totalFields++;
    if (tenantPrefs?.userType === searcherPrefs.userType) {
      matches++;
    } else if (searcherPrefs.userType === "Professional" && tenantProfile?.profession) {
      const profLower = tenantProfile.profession.toLowerCase();
      if (profLower.includes("engineer") || profLower.includes("developer") || profLower.includes("designer")) {
        matches++;
      }
    }
  }

  if (searcherPrefs.socialType && searcherPrefs.socialType !== "Any") {
    totalFields++;
    if (tenantPrefs?.socialType === searcherPrefs.socialType) {
      matches++;
    }
  }

  if (searcherPrefs.gymGuy) {
    totalFields++;
    if (tenantPrefs?.gymGuy === searcherPrefs.gymGuy) {
      matches++;
    } else if (searcherPrefs.gymGuy === "Definitely" && tenantPrefs?.gymGuy === "Maybe") {
      matches += 0.5;
    }
  }

  if (searcherPrefs.outsideEater) {
    totalFields++;
    if (tenantPrefs?.outsideEater === searcherPrefs.outsideEater) {
      matches++;
    }
  }

  if (totalFields === 0) return 100;
  return Math.round((matches / totalFields) * 100);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    // Get Searcher User to calculate personal compatibility fallback
    let searcherUser: any = null;
    if (session?.user) {
      searcherUser = await User.findById((session.user as any).id).lean();
    }

    // Parse new query parameters
    let searchType = searchParams.get("searchType") || "without_flat"; // "with_flat" or "without_flat"
    const searchIntent = searchParams.get("search_intent");
    if (searchIntent === "ROOMMATE_WITH_FLAT") {
      searchType = "with_flat";
    } else if (searchIntent === "FLATMATE_ONLY") {
      searchType = "without_flat";
    }
    const searchAreaLat = searchParams.get("searchAreaLat");
    const searchAreaLng = searchParams.get("searchAreaLng");
    const distanceVal = searchParams.get("distance"); // in meters
    const maxDistance = distanceVal ? parseInt(distanceVal) : 5000;

    const poisParam = searchParams.get("pois");
    let inputPois: { label: string; lat: number; lng: number }[] = [];
    if (poisParam) {
      try {
        inputPois = JSON.parse(poisParam);
      } catch (err) {
        console.error("Failed to parse pois parameter:", err);
      }
    }

    const flatmatePrefsParam = searchParams.get("flatmatePreferences");
    let searcherPrefs: any = null;
    if (flatmatePrefsParam) {
      try {
        searcherPrefs = JSON.parse(flatmatePrefsParam);
      } catch (err) {
        console.error("Failed to parse flatmate preferences parameter:", err);
      }
    }

    // Existing simple search parameters
    const gender = searchParams.get("gender");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");

    // Retrieve active Flatmate Profile Listings
    const listingsQuery: any = { isActive: true };
    if (searchType === "with_flat") {
      listingsQuery.propertyId = { $ne: null };
    } else {
      listingsQuery.propertyId = null;
    }

    const listings = await FlatmateProfileListing.find(listingsQuery)
      .populate({
        path: "propertyId",
        populate: { path: "localityId", select: "name" },
      })
      .lean();

    const candidateUserIds = listings.map((l: any) => l.userId.toString());

    // Retrieve Users corresponding to those listings
    const userQuery: any = { _id: { $in: candidateUserIds }, isFlatmateSearchable: true };
    if (gender && gender !== "any") userQuery.gender = gender;
    if (minAge || maxAge) {
      userQuery.age = {};
      if (minAge) userQuery.age.$gte = parseInt(minAge);
      if (maxAge) userQuery.age.$lte = parseInt(maxAge);
    }

    const users = await User.find(userQuery)
      .populate("targetLocations", "name location")
      .lean();

    const userMap = new Map();
    users.forEach((u) => userMap.set(u._id.toString(), u));

    // Retrieve FlatmatePreferences for all candidates
    const preferencesList = await FlatmatePreferences.find({ userId: { $in: candidateUserIds } }).lean();
    const prefsMap = new Map();
    preferencesList.forEach((p) => prefsMap.set(p.userId.toString(), p));

    // Map listings and filter/score
    let results: any[] = [];

    for (const listing of listings) {
      const user = userMap.get(listing.userId.toString());
      if (!user) continue; // Filtered out by gender/age query

      const prop = listing.propertyId as any;
      const userPrefs = prefsMap.get(user._id.toString());

      // 1. Geolocation Locality Filter
      let satisfiesAreaFilter = true;
      if (searchAreaLat && searchAreaLng) {
        const areaLat = parseFloat(searchAreaLat);
        const areaLng = parseFloat(searchAreaLng);

        if (prop) {
          // Candidate has flat: calculate distance to flat
          const propLng = prop.location.coordinates[0];
          const propLat = prop.location.coordinates[1];
          const dist = getDistanceInKm(areaLat, areaLng, propLat, propLng);
          if (dist * 1000 > maxDistance) {
            satisfiesAreaFilter = false;
          }
        } else if (user.targetLocations && user.targetLocations.length > 0) {
          // Candidate is searching: check target locations
          let minLocalityDist = Infinity;
          user.targetLocations.forEach((loc: any) => {
            if (loc.location?.coordinates) {
              const locLng = loc.location.coordinates[0];
              const locLat = loc.location.coordinates[1];
              const dist = getDistanceInKm(areaLat, areaLng, locLat, locLng);
              if (dist < minLocalityDist) {
                minLocalityDist = dist;
              }
            }
          });
          if (minLocalityDist * 1000 > maxDistance) {
            satisfiesAreaFilter = false;
          }
        } else {
          // No locality info: default out of range
          satisfiesAreaFilter = false;
        }
      }

      if (!satisfiesAreaFilter) continue;

      // 2. Commute POI distances calculation
      let commuteDetails: any[] = [];
      let commuteScore = 100;
      let primaryDistanceKm: number | null = null;
      let primaryCommuteTimeMin: number | null = null;

      if (inputPois.length > 0) {
        let totalDuration = 0;

        if (prop) {
          // Calculate exact drives using CommuteCache/Google API
          const propLng = prop.location.coordinates[0];
          const propLat = prop.location.coordinates[1];

          commuteDetails = await Promise.all(
            inputPois.map(async (poi) => {
              const res = await getCommuteForPoi(prop._id.toString(), propLat, propLng, poi);
              totalDuration += res.durationMin;
              return { label: poi.label, ...res };
            })
          );
        } else {
          // Searching roommate: calculate direct straight-line fallbacks from first target locality
          const firstLoc = user.targetLocations?.[0];
          const locLng = firstLoc?.location?.coordinates?.[0];
          const locLat = firstLoc?.location?.coordinates?.[1];

          commuteDetails = inputPois.map((poi) => {
            if (locLat !== undefined && locLng !== undefined) {
              const dist = getDistanceInKm(locLat, locLng, poi.lat, poi.lng);
              const distanceKm = parseFloat(dist.toFixed(2));
              const durationMin = Math.round(dist * 3.5 + 2);
              totalDuration += durationMin;
              return { label: poi.label, distanceKm, durationMin };
            }
            return { label: poi.label, distanceKm: 5, durationMin: 20 };
          });
        }

        const avgDuration = totalDuration / inputPois.length;
        commuteScore = Math.max(0, 100 - avgDuration * 2);
        primaryDistanceKm = commuteDetails[0]?.distanceKm || null;
        primaryCommuteTimeMin = commuteDetails[0]?.durationMin || null;
      }

      // 3. Roommate Compatibility Scoring
      const finalPrefs = searcherPrefs || {
        userType: "Any",
        socialType: "Any",
      };
      const matchScore = calculateTenantCompatibility(finalPrefs, user, userPrefs);

      // 4. Retrieve Amenities for Flats
      let nearbyAmenities: any = null;
      if (prop) {
        const propLng = prop.location.coordinates[0];
        const propLat = prop.location.coordinates[1];
        nearbyAmenities = await getAmenitiesForProperty(prop._id.toString(), propLat, propLng);
      }

      results.push({
        _id: user._id.toString(),
        name: user.name || "Pune Seeker",
        profilePhoto: user.profilePhoto || "",
        gender: user.gender,
        age: user.age,
        profession: user.profession || "Professional",
        bio: user.bio || "",
        hobbies: user.hobbies || [],
        targetLocations: user.targetLocations?.map((loc: any) => ({
          _id: loc._id.toString(),
          name: loc.name,
          lat: loc.location?.coordinates[1] || null,
          lng: loc.location?.coordinates[0] || null,
        })) || [],
        budgetMin: listing.budgetMin,
        budgetMax: listing.budgetMax,
        property: prop
          ? {
              _id: prop._id.toString(),
              title: prop.title,
              rentAmount: prop.rentAmount,
              bhkConfig: prop.bhkConfig,
              localityName: prop.localityId?.name || "",
              lat: prop.location.coordinates[1],
              lng: prop.location.coordinates[0],
              images: prop.images || [],
            }
          : null,
        matchScore,
        commuteDetails,
        distanceKm: primaryDistanceKm,
        commuteTimeMin: primaryCommuteTimeMin,
        nearbyAmenities,
      });
    }

    // Apply budget filters
    if (minBudget) {
      const minB = parseInt(minBudget);
      results = results.filter((r) => r.budgetMax >= minB);
    }
    if (maxBudget) {
      const maxB = parseInt(maxBudget);
      results = results.filter((r) => r.budgetMin <= maxB);
    }

    // Sort by matchScore descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Flatmate Search API Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during flatmate search. Please try again later." }, { status: 500 });
  }
}
