import dbConnect from "@/lib/db";
import DemandEvent from "@/models/DemandEvent";
import Locality from "@/models/Locality";
import Property from "@/models/Property";

export interface DemandOverviewData {
  totalSearches: number;
  flatSearches: number;
  flatmateSearches: number;
  propertyViews: number;
  averageBudget: number;
  zeroMatchSearches: number;
  topLocalities: {
    locality: string;
    searchCount: number;
    avgBudget: number;
    zeroMatchCount: number;
  }[];
  bhkDistribution: { bhk: string; count: number; percentage: number }[];
  budgetBuckets: { range: string; count: number; percentage: number }[];
  timeseries: { date: string; flatSearches: number; flatmateSearches: number; propertyViews: number }[];
  lifestyleDemand: {
    userTypes: { label: string; count: number }[];
    shifts: { label: string; count: number }[];
    socialTypes: { label: string; count: number }[];
    cleanliness: { label: string; count: number }[];
    foodPreferences: { label: string; count: number }[];
  };
  filterDemand: {
    zeroBrokerage: number;
    petAllowed: number;
    parking: number;
    powerBackup: number;
    evCharging: number;
    fiberAvailable: number;
    verifiedOnly: number;
  };
  supplyGaps: {
    locality: string;
    searchVolume: number;
    zeroResultsCount: number;
    gapScore: number;
  }[];
  recentLogs: any[];
}

function getTimeRangeDate(days: number): Date {
  if (days <= 0) return new Date(0); // All time
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDemandAnalytics(
  timeRangeDays: number = 30,
  selectedLocality: string = 'all'
): Promise<DemandOverviewData> {
  await dbConnect();
  
  const fromDate = getTimeRangeDate(timeRangeDays);
  
  const baseMatch: any = {
    timestamp: { $gte: fromDate },
  };

  if (selectedLocality && selectedLocality !== 'all') {
    const locRegex = new RegExp(selectedLocality, 'i');
    baseMatch.$or = [
      { 'searchParams.localityName': locRegex },
      { 'searchParams.searchAreaLabel': locRegex },
      { 'viewTarget.localityName': locRegex },
    ];
  }

  // 1. Overall counts by type
  const typeCounts = await DemandEvent.aggregate([
    { $match: baseMatch },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  let flatSearches = 0;
  let flatmateSearches = 0;
  let propertyViews = 0;

  typeCounts.forEach((tc) => {
    if (tc._id === 'flat_search') flatSearches = tc.count;
    if (tc._id === 'flatmate_search') flatmateSearches = tc.count;
    if (tc._id === 'property_view') propertyViews = tc.count;
  });

  const totalSearches = flatSearches + flatmateSearches;

  // 2. Average Budget
  const budgetAgg = await DemandEvent.aggregate([
    {
      $match: {
        ...baseMatch,
        $or: [
          { 'searchParams.maxRent': { $gt: 0 } },
          { 'searchParams.minRent': { $gt: 0 } },
        ],
      },
    },
    {
      $project: {
        budget: {
          $ifNull: [
            "$searchParams.maxRent",
            "$searchParams.minRent",
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgBudget: { $avg: "$budget" },
      },
    },
  ]);

  const averageBudget = Math.round(budgetAgg[0]?.avgBudget || 0);

  // 3. Zero Match Searches (Unmet demand)
  const zeroMatchSearches = await DemandEvent.countDocuments({
    ...baseMatch,
    type: { $in: ['flat_search', 'flatmate_search'] },
    resultsCount: 0,
  });

  // 4. Top Localities Demand Ranking
  const localityAgg = await DemandEvent.aggregate([
    {
      $match: {
        ...baseMatch,
        type: { $in: ['flat_search', 'flatmate_search'] },
        'searchParams.localityName': { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: "$searchParams.localityName",
        searchCount: { $sum: 1 },
        avgBudget: {
          $avg: {
            $ifNull: ["$searchParams.maxRent", "$searchParams.minRent"],
          },
        },
        zeroMatchCount: {
          $sum: { $cond: [{ $eq: ["$resultsCount", 0] }, 1, 0] },
        },
      },
    },
    { $sort: { searchCount: -1 } },
    { $limit: 10 },
  ]);

  const topLocalities = localityAgg.map((l) => ({
    locality: l._id || 'Unknown',
    searchCount: l.searchCount,
    avgBudget: Math.round(l.avgBudget || 0),
    zeroMatchCount: l.zeroMatchCount,
  }));

  // 5. BHK Demand Breakdown
  const bhkAgg = await DemandEvent.aggregate([
    {
      $match: {
        ...baseMatch,
        type: 'flat_search',
        'searchParams.bhkConfig': { $exists: true, $nin: ['', null, 'any'] },
      },
    },
    {
      $group: {
        _id: "$searchParams.bhkConfig",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const totalBhkQueries = bhkAgg.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const bhkDistribution = bhkAgg.map((b) => ({
    bhk: b._id.toUpperCase(),
    count: b.count,
    percentage: Math.round((b.count / totalBhkQueries) * 100),
  }));

  // 6. Budget Buckets Histogram
  const budgetBucketsAgg = await DemandEvent.aggregate([
    {
      $match: {
        ...baseMatch,
        $or: [
          { 'searchParams.maxRent': { $gt: 0 } },
          { 'searchParams.minRent': { $gt: 0 } },
        ],
      },
    },
    {
      $project: {
        rent: { $ifNull: ["$searchParams.maxRent", "$searchParams.minRent"] },
      },
    },
    {
      $project: {
        bucket: {
          $switch: {
            branches: [
              { case: { $lt: ["$rent", 15000] }, then: "< ₹15K" },
              { case: { $lt: ["$rent", 25000] }, then: "₹15K - ₹25K" },
              { case: { $lt: ["$rent", 40000] }, then: "₹25K - ₹40K" },
              { case: { $lt: ["$rent", 60000] }, then: "₹40K - ₹60K" },
            ],
            default: "₹60K+",
          },
        },
      },
    },
    {
      $group: {
        _id: "$bucket",
        count: { $sum: 1 },
      },
    },
  ]);

  const ORDERED_BUCKETS = ['< ₹15K', '₹15K - ₹25K', '₹25K - ₹40K', '₹40K - ₹60K', '₹60K+'];
  const totalBudgeted = budgetBucketsAgg.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const budgetBuckets = ORDERED_BUCKETS.map((bLabel) => {
    const found = budgetBucketsAgg.find((b) => b._id === bLabel);
    const count = found ? found.count : 0;
    return {
      range: bLabel,
      count,
      percentage: Math.round((count / totalBudgeted) * 100),
    };
  });

  // 7. Timeseries Trends (Daily aggregation)
  const timeseriesAgg = await DemandEvent.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
        },
        flatSearches: {
          $sum: { $cond: [{ $eq: ["$type", "flat_search"] }, 1, 0] },
        },
        flatmateSearches: {
          $sum: { $cond: [{ $eq: ["$type", "flatmate_search"] }, 1, 0] },
        },
        propertyViews: {
          $sum: { $cond: [{ $eq: ["$type", "property_view"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  const timeseries = timeseriesAgg.map((t) => ({
    date: t._id,
    flatSearches: t.flatSearches,
    flatmateSearches: t.flatmateSearches,
    propertyViews: t.propertyViews,
  }));

  // 8. Flatmate Lifestyle Preferences Demand
  const userTypeAgg = await DemandEvent.aggregate([
    { $match: { ...baseMatch, 'searchParams.flatmatePreferences.userType': { $exists: true, $ne: null } } },
    { $group: { _id: '$searchParams.flatmatePreferences.userType', count: { $sum: 1 } } },
  ]);
  const shiftAgg = await DemandEvent.aggregate([
    { $match: { ...baseMatch, 'searchParams.flatmatePreferences.shift': { $exists: true, $ne: null } } },
    { $group: { _id: '$searchParams.flatmatePreferences.shift', count: { $sum: 1 } } },
  ]);
  const socialAgg = await DemandEvent.aggregate([
    { $match: { ...baseMatch, 'searchParams.flatmatePreferences.socialType': { $exists: true, $ne: null } } },
    { $group: { _id: '$searchParams.flatmatePreferences.socialType', count: { $sum: 1 } } },
  ]);
  const cleanlinessAgg = await DemandEvent.aggregate([
    { $match: { ...baseMatch, 'searchParams.flatmatePreferences.cleanliness': { $exists: true, $ne: null } } },
    { $group: { _id: '$searchParams.flatmatePreferences.cleanliness', count: { $sum: 1 } } },
  ]);
  const foodAgg = await DemandEvent.aggregate([
    { $match: { ...baseMatch, 'searchParams.flatmatePreferences.foodPreference': { $exists: true, $ne: null } } },
    { $group: { _id: '$searchParams.flatmatePreferences.foodPreference', count: { $sum: 1 } } },
  ]);

  const lifestyleDemand = {
    userTypes: userTypeAgg.map(u => ({ label: u._id || 'Unspecified', count: u.count })),
    shifts: shiftAgg.map(s => ({ label: s._id || 'Standard', count: s.count })),
    socialTypes: socialAgg.map(s => ({ label: s._id || 'Ambivert', count: s.count })),
    cleanliness: cleanlinessAgg.map(c => ({ label: c._id || 'Moderate', count: c.count })),
    foodPreferences: foodAgg.map(f => ({ label: f._id || 'Any', count: f.count })),
  };

  // 9. Feature Filters Demand
  const totalFlatFilters = flatSearches || 1;
  const zeroBrokerageCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.zeroBrokerage': true,
  });
  const petAllowedCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.petPolicy': 'allowed',
  });
  const parkingCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.parkingType': { $in: ['two_wheeler', 'four_wheeler', 'both'] },
  });
  const powerBackupCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.powerBackup': { $in: ['partial', 'full'] },
  });
  const evChargingCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.evCharging': true,
  });
  const fiberCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.fiberAvailable': true,
  });
  const verifiedOnlyCount = await DemandEvent.countDocuments({
    ...baseMatch,
    type: 'flat_search',
    'searchParams.moreFilters.isVerifiedOnly': true,
  });

  const filterDemand = {
    zeroBrokerage: Math.round((zeroBrokerageCount / totalFlatFilters) * 100),
    petAllowed: Math.round((petAllowedCount / totalFlatFilters) * 100),
    parking: Math.round((parkingCount / totalFlatFilters) * 100),
    powerBackup: Math.round((powerBackupCount / totalFlatFilters) * 100),
    evCharging: Math.round((evChargingCount / totalFlatFilters) * 100),
    fiberAvailable: Math.round((fiberCount / totalFlatFilters) * 100),
    verifiedOnly: Math.round((verifiedOnlyCount / totalFlatFilters) * 100),
  };

  // 10. Supply vs Demand Gaps (Areas with high search ratio vs zero results)
  const gapAgg = await DemandEvent.aggregate([
    {
      $match: {
        ...baseMatch,
        type: 'flat_search',
        'searchParams.localityName': { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: "$searchParams.localityName",
        searchVolume: { $sum: 1 },
        zeroResultsCount: {
          $sum: { $cond: [{ $eq: ["$resultsCount", 0] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        locality: "$_id",
        searchVolume: 1,
        zeroResultsCount: 1,
        gapScore: {
          $round: [
            {
              $multiply: [
                { $divide: ["$zeroResultsCount", { $max: ["$searchVolume", 1] }] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { zeroResultsCount: -1, searchVolume: -1 } },
    { $limit: 6 },
  ]);

  const supplyGaps = gapAgg.map(g => ({
    locality: g.locality || 'Unknown Area',
    searchVolume: g.searchVolume,
    zeroResultsCount: g.zeroResultsCount,
    gapScore: g.gapScore,
  }));

  // 11. Recent Search Logs
  const recentLogs = await DemandEvent.find(baseMatch)
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  const serializedRecentLogs = recentLogs.map((l: any) => ({
    _id: l._id.toString(),
    type: l.type,
    localityName: l.searchParams?.localityName || l.viewTarget?.localityName || l.searchParams?.searchAreaLabel || 'City-Wide',
    searchAreaLabel: l.searchParams?.searchAreaLabel,
    bhkConfig: l.searchParams?.bhkConfig || l.viewTarget?.bhkConfig,
    rentAmount: l.searchParams?.maxRent || l.viewTarget?.rentAmount,
    resultsCount: l.resultsCount ?? 0,
    timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
    searchParams: l.searchParams,
    viewTarget: l.viewTarget,
  }));

  return JSON.parse(JSON.stringify({
    totalSearches,
    flatSearches,
    flatmateSearches,
    propertyViews,
    averageBudget,
    zeroMatchSearches,
    topLocalities,
    bhkDistribution,
    budgetBuckets,
    timeseries,
    lifestyleDemand,
    filterDemand,
    supplyGaps,
    recentLogs: serializedRecentLogs,
  }));
}
