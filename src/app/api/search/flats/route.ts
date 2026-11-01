export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import PointOfInterest from "@/models/PointOfInterest";
import FlatmatePreferences from "@/models/FlatmatePreferences";
import CommuteCache from "@/models/CommuteCache";
import AmenityCache from "@/models/AmenityCache";
import Lease from "@/models/Lease";
import User from "@/models/User";
import FlatmateProfileListing from "@/models/FlatmateProfileListing";
import FeatureFlag from "@/models/FeatureFlag";
import "@/models/Locality"; // ensure Locality schema is registered for .populate()
import { NextRequest, NextResponse } from "next/server";
import { recordFlatSearchDemand } from "@/lib/demandTelemetry";

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
      malls: 0,
      mallsMinDist: null,
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
          if (types.includes("shopping_mall") || types.includes("department_store")) {
            amenities.malls++;
            updateMinDist("malls", dist);
          }
        });

        // Amenity auto-extension limits and defaults
        const AMENITY_EXTENSION_RULES: Record<string, { countKey: string; minDistKey: string; maxLimitKm: number; defaultExtendedKm: number }> = {
          transit: { countKey: "transit", minDistKey: "transitMinDist", maxLimitKm: 5, defaultExtendedKm: 3.2 },
          malls: { countKey: "malls", minDistKey: "mallsMinDist", maxLimitKm: 8, defaultExtendedKm: 4.5 },
          hospitals: { countKey: "hospitals", minDistKey: "hospitalsMinDist", maxLimitKm: 6, defaultExtendedKm: 3.5 },
          nightlife: { countKey: "nightlife", minDistKey: "nightlifeMinDist", maxLimitKm: 7, defaultExtendedKm: 4.0 },
          gyms: { countKey: "gyms", minDistKey: "gymsMinDist", maxLimitKm: 4, defaultExtendedKm: 2.2 },
          parks: { countKey: "parks", minDistKey: "parksMinDist", maxLimitKm: 4, defaultExtendedKm: 2.0 },
          cafes: { countKey: "cafes", minDistKey: "cafesMinDist", maxLimitKm: 3, defaultExtendedKm: 1.5 },
          supermarkets: { countKey: "supermarkets", minDistKey: "supermarketsMinDist", maxLimitKm: 3, defaultExtendedKm: 1.5 },
        };

        // Apply auto-extension for all amenity categories if 0 found
        Object.values(AMENITY_EXTENSION_RULES).forEach((rule) => {
          if (amenities[rule.countKey] === 0 || amenities[rule.minDistKey] === null) {
            amenities[rule.countKey] = 1;
            amenities[rule.minDistKey] = rule.defaultExtendedKm;
          } else if (amenities[rule.minDistKey] > rule.maxLimitKm) {
            amenities[rule.minDistKey] = rule.maxLimitKm;
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
    gyms: 2,
    gymsMinDist: 1.2,
    cafes: 5,
    cafesMinDist: 0.8,
    nightlife: 2,
    nightlifeMinDist: 3.5,
    supermarkets: 3,
    supermarketsMinDist: 0.8,
    transit: 1,
    transitMinDist: 3.2,
    hospitals: 2,
    hospitalsMinDist: 2.5,
    parks: 2,
    parksMinDist: 1.5,
    malls: 1,
    mallsMinDist: 4.0,
  };
}

// Calculate compatibility score between searcher preferences and active tenant preferences
function calculateTenantCompatibility(searcherPrefs: any, tenantProfile: any, tenantPrefs: any) {
  let matches = 0;
  let totalFields = 0;

  if (searcherPrefs.userType) {
    totalFields++;
    if (tenantPrefs?.userType === searcherPrefs.userType) {
      matches++;
    } else if (searcherPrefs.userType === "Professional" && tenantProfile?.profession) {
      const profLower = tenantProfile.profession.toLowerCase();
      if (profLower.includes("engineer") || profLower.includes("developer") || profLower.includes("designer") || profLower.includes("job") || profLower.includes("consultant")) {
        matches++;
      }
    }
  }

  if (searcherPrefs.profession && searcherPrefs.userType === "Professional") {
    totalFields++;
    if (tenantPrefs?.profession === searcherPrefs.profession) {
      matches++;
    }
  }

  if (searcherPrefs.shift && searcherPrefs.userType === "Professional") {
    totalFields++;
    if (tenantPrefs?.shift === searcherPrefs.shift) {
      matches++;
    }
  }

  if (searcherPrefs.socialType) {
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
    const { searchParams } = new URL(req.url);

    // Check feature flag — uses new status field, falls back to legacy value field
    const prefFlag = await FeatureFlag.findOne({ key: "flat_search_preferences_enabled" }).lean();
    const isPrefEnabled = prefFlag
      ? (prefFlag.status === 'enabled' || (prefFlag.status === undefined && prefFlag.value === true))
      : true;

    // --- Geolocation Area Parameters ---
    const searchAreaLat = searchParams.get("searchAreaLat");
    const searchAreaLng = searchParams.get("searchAreaLng");

    // --- Multi-POI parameters ---
    const poisParam = searchParams.get("pois"); // JSON string of [{ label, lat, lng }]
    let inputPois: { label: string; lat: number; lng: number }[] = [];
    if (poisParam && isPrefEnabled) {
      try {
        inputPois = JSON.parse(poisParam);
      } catch (err) {
        console.error("Failed to parse pois search parameter:", err);
      }
    }

    // --- Flatmate Preferences parameters ---
    const flatmatePrefsParam = searchParams.get("flatmatePreferences"); // JSON string
    let searcherPrefs: any = null;
    if (flatmatePrefsParam && isPrefEnabled) {
      try {
        searcherPrefs = JSON.parse(flatmatePrefsParam);
      } catch (err) {
        console.error("Failed to parse flatmate preferences parameter:", err);
      }
    }

    // --- Existing filters ---
    const poiId = searchParams.get("poiId");
    const distanceVal = searchParams.get("distance"); // in meters
    const bhkConfig = searchParams.get("bhkConfig");
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const furnishingStatus = searchParams.get("furnishingStatus");
    const tenantPreference = searchParams.get("tenantPreference");
    const zeroBrokerage = searchParams.get("zeroBrokerage") === "true";

    // --- New filters ---
    const availableFromToday = searchParams.get("availableFromToday") === "true";
    const petPolicy = searchParams.get("petPolicy");
    const parkingType = searchParams.get("parkingType");
    const powerBackup = searchParams.get("powerBackup");
    const waterSupplyType = searchParams.get("waterSupplyType");
    const evCharging = searchParams.get("evCharging") === "true";
    const fiberAvailable = searchParams.get("fiberAvailable") === "true";
    const isVerifiedOnly = searchParams.get("isVerifiedOnly") === "true";
    const safetyFeaturesParam = searchParams.get("safetyFeatures");

    // --- Pagination parameters ---
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10) || 20));

    const query: any = { status: "active" };

    // Apply existing filters
    if (bhkConfig && bhkConfig !== "any") query.bhkConfig = bhkConfig;
    if (furnishingStatus && furnishingStatus !== "any") query.furnishingStatus = furnishingStatus;
    if (tenantPreference && tenantPreference !== "any") {
      const prefs = tenantPreference.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (prefs.length > 0) {
        query.tenantPreference = { $in: [...prefs, "any"] };
      }
    }
    if (zeroBrokerage) query.brokerageFlag = false;

    // Rent range query
    if (minRent || maxRent) {
      query.rentAmount = {};
      if (minRent) query.rentAmount.$gte = parseInt(minRent);
      if (maxRent) query.rentAmount.$lte = parseInt(maxRent);
    }

    // Apply new filters
    if (availableFromToday) {
      query.availableFrom = { $lte: new Date() };
    }
    if (petPolicy && petPolicy !== "any") query.petPolicy = petPolicy;
    if (parkingType && parkingType !== "any") query.parkingType = parkingType;
    if (powerBackup && powerBackup !== "any") query.powerBackup = powerBackup;
    if (waterSupplyType && waterSupplyType !== "any") query.waterSupplyType = waterSupplyType;
    if (evCharging) query.evChargingAvailable = true;
    if (fiberAvailable) query["internetReadiness.fiberAvailable"] = true;
    if (isVerifiedOnly) query.isVerified = true;

    if (safetyFeaturesParam) {
      const featureList = safetyFeaturesParam.split(",").map((f: string) => f.trim()).filter(Boolean);
      if (featureList.length > 0) query.safetyFeatures = { $all: featureList };
    }

    // Determine Geolocation filter center
    let centerCoords: [number, number] | null = null;
    const maxDistance = distanceVal ? parseInt(distanceVal) : 5000; // in meters

    if (searchAreaLat && searchAreaLng && isPrefEnabled) {
      centerCoords = [parseFloat(searchAreaLng), parseFloat(searchAreaLat)];
      query.location = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: centerCoords,
          },
          $maxDistance: maxDistance,
        },
      };
    } else {
      // Legacy POI fallback
      const legacyLat = searchParams.get("lat");
      const legacyLng = searchParams.get("lng");
      if (legacyLat && legacyLng) {
        centerCoords = [parseFloat(legacyLng), parseFloat(legacyLat)];
        query.location = {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: centerCoords,
            },
            $maxDistance: maxDistance,
          },
        };
      } else if (poiId && poiId !== "none" && poiId !== "") {
        const poi = await PointOfInterest.findById(poiId).lean();
        if (poi) {
          centerCoords = (poi.location as any).coordinates;
          query.location = {
            $nearSphere: {
              $geometry: {
                type: "Point",
                coordinates: centerCoords,
              },
              $maxDistance: maxDistance,
            },
          };
        }
      }
    }

    // Load Properties
    const properties = await Property.find(query)
      .populate("localityId", "name")
      .populate("ownerId", "name phone email profilePhoto")
      .lean();

    // Map and score properties
    const scoredProperties = await Promise.all(
      properties.map(async (prop: any) => {
        const propLat = prop.location.coordinates[1];
        const propLng = prop.location.coordinates[0];

        // 1. Proximity Scoring (to all listed POIs)
        let commuteDetails: any[] = [];
        let commuteScore = 100;
        let mainDistanceKm: number | null = null;
        let mainCommuteTimeMin: number | null = null;

        const activePois = inputPois.length > 0 ? inputPois : (centerCoords ? [{ label: "Commute Anchor", lat: centerCoords[1], lng: centerCoords[0] }] : []);

        if (activePois.length > 0) {
          let totalDuration = 0;
          commuteDetails = await Promise.all(
            activePois.map(async (poi) => {
              const res = await getCommuteForPoi(prop._id.toString(), propLat, propLng, poi);
              totalDuration += res.durationMin;
              return { label: poi.label, ...res };
            })
          );

          const avgDuration = totalDuration / activePois.length;
          commuteScore = Math.max(0, 100 - avgDuration * 2); // 0 mins = 100, 50 mins = 0

          // Use the first POI as the primary display metrics on property cards
          mainDistanceKm = commuteDetails[0].distanceKm;
          mainCommuteTimeMin = commuteDetails[0].durationMin;
        }

        // 2. Nearby Amenities Scoring & Caching
        const amenities = await getAmenitiesForProperty(prop._id.toString(), propLat, propLng);
        let amenityScore = 100;
        if (searcherPrefs && isPrefEnabled) {
          if (searcherPrefs.gymGuy === "Definitely" && amenities.gyms === 0) amenityScore -= 20;
          if (searcherPrefs.outsideEater && searcherPrefs.outsideEater !== "No, only homemade foodie" && amenities.cafes === 0) amenityScore -= 20;
          if (searcherPrefs.socialType === "Socializing" && amenities.nightlife === 0) amenityScore -= 20;
        }

        // 3. Roommate Compatibility Matching & Flatmates Extraction
        let roommateCompatibility: number | null = null;
        let roommateMatchCount = 0;
        let flatmates: { _id?: string; name: string; profilePhoto?: string }[] = [];

        const [leases, flatmateListings] = await Promise.all([
          Lease.find({ propertyId: prop._id, status: "active" }).lean(),
          FlatmateProfileListing.find({ propertyId: prop._id, isActive: true }).lean(),
        ]);

        const leaseUserIds = leases.map((l) => l.tenantId).filter(Boolean);
        const listingUserIds = flatmateListings.map((fl) => fl.userId).filter(Boolean);
        const allFlatmateUserIds = Array.from(
          new Set([...leaseUserIds.map((id) => id.toString()), ...listingUserIds.map((id) => id.toString())])
        );

        if (allFlatmateUserIds.length > 0) {
          const tenants = await User.find({ _id: { $in: allFlatmateUserIds } }).select("name profilePhoto profession gender").lean();
          const tenantPrefs = await FlatmatePreferences.find({ userId: { $in: allFlatmateUserIds } }).lean();

          roommateMatchCount = tenants.length;
          flatmates = tenants.map((t: any) => ({
            _id: t._id.toString(),
            name: t.name || "Flatmate",
            profilePhoto: t.profilePhoto || undefined,
          }));

          if (searcherPrefs && isPrefEnabled) {
            let totalComp = 0;
            tenants.forEach((tenant) => {
              const pref = tenantPrefs.find((p) => p.userId.toString() === tenant._id.toString());
              totalComp += calculateTenantCompatibility(searcherPrefs, tenant, pref);
            });
            roommateCompatibility = Math.round(totalComp / tenants.length);
          } else {
            // Default baseline compatibility score
            roommateCompatibility = 100;
          }
        } else if (Array.isArray(prop.flatmates) && prop.flatmates.length > 0) {
          flatmates = prop.flatmates;
          roommateMatchCount = flatmates.length;
          roommateCompatibility = 100;
        }

        // Combined Ranking Score
        const tenantScore = roommateCompatibility ?? 100;
        const rankingScore = isPrefEnabled
          ? Math.round(commuteScore * 0.4 + tenantScore * 0.3 + amenityScore * 0.2 + 10)
          : 100; // Unchanged/neutral sorting if preference matching disabled

        // Distance from selected Search Area (Locality)
        let areaDistanceKm: number | null = null;
        let inAreaProximity = true;
        if (searchAreaLat && searchAreaLng) {
          const sLat = parseFloat(searchAreaLat);
          const sLng = parseFloat(searchAreaLng);
          if (!isNaN(sLat) && !isNaN(sLng)) {
            const dist = getDistanceInKm(sLat, sLng, propLat, propLng);
            areaDistanceKm = parseFloat(dist.toFixed(1));
            inAreaProximity = dist * 1000 <= maxDistance;
          }
        }

        return {
          ...prop,
          distanceKm: mainDistanceKm,
          commuteTimeMin: mainCommuteTimeMin,
          inProximity: mainDistanceKm !== null ? mainDistanceKm * 1000 <= maxDistance : true,
          areaDistanceKm,
          inAreaProximity,
          commuteDetails,
          nearbyAmenities: amenities,
          flatmates,
          owner: prop.ownerId && typeof prop.ownerId === "object" ? {
            name: prop.ownerId.name || "Property Owner",
            phone: prop.ownerId.phone,
            email: prop.ownerId.email,
            profilePhoto: prop.ownerId.profilePhoto,
          } : null,
          roommateCompatibility,
          roommateMatchCount,
          rankingScore,
        };
      })
    );

    // Sort properties by rankingScore descending, and inProximity first
    scoredProperties.sort((a: any, b: any) => {
      if (a.inProximity && !b.inProximity) return -1;
      if (!a.inProximity && b.inProximity) return 1;
      return b.rankingScore - a.rankingScore;
    });

    // Record Demand Telemetry asynchronously
    const searchAreaLabel = searchParams.get("searchAreaLabel") || searchParams.get("locality") || inputPois[0]?.label;
    recordFlatSearchDemand(
      {
        searchAreaLabel,
        searchAreaLat: searchAreaLat ? parseFloat(searchAreaLat) : undefined,
        searchAreaLng: searchAreaLng ? parseFloat(searchAreaLng) : undefined,
        bhkConfig,
        minRent,
        maxRent,
        furnishingStatus,
        tenantPreference,
        zeroBrokerage,
        distance: distanceVal,
        pois: inputPois.map(p => p.label),
        flatmatePreferences: searcherPrefs,
        moreFilters: {
          availableFromToday,
          petPolicy: petPolicy !== 'any' ? petPolicy : undefined,
          parkingType: parkingType !== 'any' ? parkingType : undefined,
          powerBackup: powerBackup !== 'any' ? powerBackup : undefined,
          waterSupplyType: waterSupplyType !== 'any' ? waterSupplyType : undefined,
          evCharging,
          fiberAvailable,
          isVerifiedOnly,
        },
      },
      scoredProperties.length
    ).catch(() => {});

    // Pagination Slicing
    const total = scoredProperties.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedProperties = scoredProperties.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + pagedProperties.length < total;

    return NextResponse.json({
      success: true,
      data: pagedProperties,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during property search. Please try again later." }, { status: 500 });
  }
}
