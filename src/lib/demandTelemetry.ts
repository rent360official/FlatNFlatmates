import dbConnect from "@/lib/db";
import DemandEvent from "@/models/DemandEvent";

/**
 * Extract an intuitive locality name from searchAreaLabel or input
 */
export function extractLocalityName(label?: string | null): string | undefined {
  if (!label) return undefined;
  const parts = label.split(',');
  return parts[0]?.trim();
}

/**
 * Record a flat search demand event (asynchronously, non-blocking)
 */
export async function recordFlatSearchDemand(
  params: {
    searchAreaLabel?: string | null;
    searchAreaLat?: number | null;
    searchAreaLng?: number | null;
    bhkConfig?: string | null;
    minRent?: string | number | null;
    maxRent?: string | number | null;
    furnishingStatus?: string | null;
    tenantPreference?: string | null;
    zeroBrokerage?: boolean | null;
    distance?: string | number | null;
    pois?: string[] | null;
    flatmatePreferences?: any;
    moreFilters?: any;
  },
  resultsCount: number,
  user?: { id?: string; role?: string } | null
) {
  try {
    await dbConnect();
    const localityName = extractLocalityName(params.searchAreaLabel);
    
    await DemandEvent.create({
      type: 'flat_search',
      searchParams: {
        searchType: 'flat',
        localityName,
        searchAreaLabel: params.searchAreaLabel || undefined,
        coordinates: (params.searchAreaLng && params.searchAreaLat) 
          ? [Number(params.searchAreaLng), Number(params.searchAreaLat)] 
          : undefined,
        distance: params.distance ? Number(params.distance) : undefined,
        bhkConfig: params.bhkConfig && params.bhkConfig !== 'any' ? params.bhkConfig : undefined,
        minRent: params.minRent ? Number(params.minRent) : undefined,
        maxRent: params.maxRent ? Number(params.maxRent) : undefined,
        furnishingStatus: params.furnishingStatus && params.furnishingStatus !== 'any' ? params.furnishingStatus : undefined,
        tenantPreference: params.tenantPreference && params.tenantPreference !== 'any' ? params.tenantPreference : undefined,
        zeroBrokerage: params.zeroBrokerage === true,
        pois: params.pois && params.pois.length > 0 ? params.pois : undefined,
        flatmatePreferences: params.flatmatePreferences || undefined,
        moreFilters: params.moreFilters || undefined,
      },
      resultsCount,
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date(),
    });
  } catch (error) {
    // Non-blocking telemetry — silently catch errors
    console.error("Demand telemetry error (flat_search):", error);
  }
}

/**
 * Record a flatmate search demand event (asynchronously, non-blocking)
 */
export async function recordFlatmateSearchDemand(
  params: {
    searchIntent?: string | null;
    searchAreaLabel?: string | null;
    searchAreaLat?: number | null;
    searchAreaLng?: number | null;
    localityName?: string | null;
    gender?: string | null;
    minBudget?: string | number | null;
    maxBudget?: string | number | null;
    cleanliness?: string | null;
    foodPreference?: string | null;
    userType?: string | null;
    profession?: string | null;
    shift?: string | null;
    socialType?: string | null;
    gymGuy?: string | null;
    outsideEater?: string | null;
  },
  resultsCount: number,
  user?: { id?: string; role?: string } | null
) {
  try {
    await dbConnect();
    const localityName = params.localityName || extractLocalityName(params.searchAreaLabel);

    await DemandEvent.create({
      type: 'flatmate_search',
      searchParams: {
        searchType: 'flatmate',
        searchIntent: params.searchIntent || undefined,
        localityName,
        searchAreaLabel: params.searchAreaLabel || undefined,
        coordinates: (params.searchAreaLng && params.searchAreaLat) 
          ? [Number(params.searchAreaLng), Number(params.searchAreaLat)] 
          : undefined,
        minRent: params.minBudget ? Number(params.minBudget) : undefined,
        maxRent: params.maxBudget ? Number(params.maxBudget) : undefined,
        flatmatePreferences: {
          userType: params.userType || undefined,
          profession: params.profession || undefined,
          shift: params.shift || undefined,
          socialType: params.socialType || undefined,
          gymGuy: params.gymGuy || undefined,
          outsideEater: params.outsideEater || undefined,
          gender: params.gender && params.gender !== 'any' ? params.gender : undefined,
          cleanliness: params.cleanliness && params.cleanliness !== 'any' ? params.cleanliness : undefined,
          foodPreference: params.foodPreference && params.foodPreference !== 'any' ? params.foodPreference : undefined,
        },
      },
      resultsCount,
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Demand telemetry error (flatmate_search):", error);
  }
}

/**
 * Record a property detail view event (asynchronously, non-blocking)
 */
export async function recordPropertyViewDemand(
  property: {
    _id: any;
    title?: string;
    localityId?: any;
    localityName?: string;
    bhkConfig?: string;
    rentAmount?: number;
    furnishingStatus?: string;
    tenantType?: string;
  },
  user?: { id?: string; role?: string } | null
) {
  try {
    await dbConnect();
    await DemandEvent.create({
      type: 'property_view',
      viewTarget: {
        propertyId: property._id,
        propertyTitle: property.title,
        localityId: property.localityId,
        localityName: property.localityName,
        bhkConfig: property.bhkConfig,
        rentAmount: property.rentAmount,
        furnishingStatus: property.furnishingStatus,
        tenantType: property.tenantType,
      },
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Demand telemetry error (property_view):", error);
  }
}
