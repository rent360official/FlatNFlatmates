import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import PointOfInterest from "@/models/PointOfInterest";
import FlatmatePreferences from "@/models/FlatmatePreferences";
import CommuteCache from "@/models/CommuteCache";
import AmenityCache from "@/models/AmenityCache";
import Lease from "@/models/Lease";
import User from "@/models/User";
import FeatureFlag from "@/models/FeatureFlag";
import "@/models/Locality"; // ensure Locality schema is registered for .populate()
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

    const query: any = { status: "active" };

    // Apply existing filters
    if (bhkConfig && bhkConfig !== "any") query.bhkConfig = bhkConfig;
    if (furnishingStatus && furnishingStatus !== "any") query.furnishingStatus = furnishingStatus;
    if (tenantPreference && tenantPreference !== "any") query.tenantPreference = tenantPreference;
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

        // 3. Roommate Compatibility Matching
        let roommateCompatibility: number | null = null;
        let roommateMatchCount = 0;

        const leases = await Lease.find({ propertyId: prop._id, status: "active" }).lean();
        const tenantIds = leases.map((l) => l.tenantId).filter(Boolean);

        if (tenantIds.length > 0) {
          const tenants = await User.find({ _id: { $in: tenantIds } }).lean();
          const tenantPrefs = await FlatmatePreferences.find({ userId: { $in: tenantIds } }).lean();

          roommateMatchCount = tenants.length;

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
        }

        // Combined Ranking Score
        const tenantScore = roommateCompatibility ?? 100;
        const rankingScore = isPrefEnabled
          ? Math.round(commuteScore * 0.4 + tenantScore * 0.3 + amenityScore * 0.2 + 10)
          : 100; // Unchanged/neutral sorting if preference matching disabled

        return {
          ...prop,
          distanceKm: mainDistanceKm,
          commuteTimeMin: mainCommuteTimeMin,
          inProximity: mainDistanceKm !== null ? mainDistanceKm * 1000 <= maxDistance : true,
          commuteDetails,
          nearbyAmenities: amenities,
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

    return NextResponse.json({ success: true, data: scoredProperties });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
