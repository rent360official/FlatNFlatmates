import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import City from '../models/City';
import Locality from '../models/Locality';
import PointOfInterest from '../models/PointOfInterest';
import Property from '../models/Property';
import User from '../models/User';
import Lease from '../models/Lease';
import FlatmateProfileListing from '../models/FlatmateProfileListing';
import FlatmatePreferences from '../models/FlatmatePreferences';
import CommuteCache from '../models/CommuteCache';
import AmenityCache from '../models/AmenityCache';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    // Pre-register models
    const _City = City;
    const _Locality = Locality;
    const _Property = Property;

    // Search query parameters mockup
    const mockPois = [
      { label: "Rajiv Gandhi Infotech Park (Hinjewadi)", lat: 18.5793, lng: 73.7381 }
    ];
    const mockSearcherPrefs = {
      userType: "Professional",
      profession: "Corporate Job",
      shift: "Day Shift",
      socialType: "Socializing",
      gymGuy: "Definitely",
      outsideEater: "Only evening small snacks"
    };

    console.log('\n==================================================');
    console.log('TEST CASE 1: Flatmates WITH a flat (with_flat)');
    console.log('==================================================');

    const listingsWithFlat = await FlatmateProfileListing.find({
      isActive: true,
      propertyId: { $ne: null }
    })
    .populate({
      path: "propertyId",
      populate: { path: "localityId", select: "name" }
    })
    .lean();

    console.log(`Found ${listingsWithFlat.length} active listings with an attached flat.`);

    for (const listing of listingsWithFlat) {
      const user = await User.findById(listing.userId).lean();
      if (!user) continue;

      const userPrefs = await FlatmatePreferences.findOne({ userId: user._id }).lean();
      const comp = calculateTenantCompatibility(mockSearcherPrefs, user, userPrefs);

      const prop: any = listing.propertyId;
      const propLat = prop.location.coordinates[1];
      const propLng = prop.location.coordinates[0];

      // Calculate commute to first POI
      const dist = getDistanceInKm(mockPois[0].lat, mockPois[0].lng, propLat, propLng);
      const distKm = parseFloat(dist.toFixed(2));
      const durationMin = Math.round(dist * 3.5 + 2);

      console.log(`\n- Seeker Seeker: ${user.name}`);
      console.log(`  Age / Gender: ${user.age} / ${user.gender}`);
      console.log(`  Flat Title: ${prop.title} in ${prop.localityId?.name}`);
      console.log(`  Rent: ₹${prop.rentAmount}/mo`);
      console.log(`  POI Distance: ${distKm} km (~${durationMin} mins driving)`);
      console.log(`  Roommate Compatibility Score: ${comp}%`);
    }

    console.log('\n==================================================');
    console.log('TEST CASE 2: Flatmates SEARCHING for a flat (without_flat)');
    console.log('==================================================');

    const listingsWithoutFlat = await FlatmateProfileListing.find({
      isActive: true,
      propertyId: null
    }).lean();

    console.log(`Found ${listingsWithoutFlat.length} active listings without a flat (seeking roommates to search together).`);

    for (const listing of listingsWithoutFlat) {
      const user = await User.populate(await User.findById(listing.userId).lean(), {
        path: "targetLocations",
        select: "name location"
      }) as any;
      if (!user) continue;

      const userPrefs = await FlatmatePreferences.findOne({ userId: user._id }).lean();
      const comp = calculateTenantCompatibility(mockSearcherPrefs, user, userPrefs);

      console.log(`\n- Seeker Seeker: ${user.name}`);
      console.log(`  Age / Gender: ${user.age} / ${user.gender}`);
      console.log(`  Shared Budget range: ₹${listing.budgetMin} - ₹${listing.budgetMax}/mo`);
      console.log(`  Looking in localities:`, user.targetLocations.map((l: any) => l.name).join(', ') || 'Any');
      console.log(`  Roommate Compatibility Score: ${comp}%`);
    }

    console.log('\n==================================================');
    console.log('All offline test cases executed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test run failed:', error);
    process.exit(1);
  }
}

runTest();
