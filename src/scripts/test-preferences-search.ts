import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Property from '../models/Property';
import PointOfInterest from '../models/PointOfInterest';
import FlatmatePreferences from '../models/FlatmatePreferences';
import CommuteCache from '../models/CommuteCache';
import AmenityCache from '../models/AmenityCache';
import Lease from '../models/Lease';
import User from '../models/User';
import Locality from '../models/Locality';
import City from '../models/City';

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

  if (searcherPrefs.userType) {
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

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    // Prevent Next.js tree-shaking / compilation error by explicitly assigning models
    const _City = City;
    const _Locality = Locality;

    // Mock search parameters
    const mockPois = [
      { label: "Rajiv Gandhi Infotech Park (Hinjewadi)", lat: 18.5793, lng: 73.7381 },
      { label: "Symbiosis Viman Nagar", lat: 18.5636, lng: 73.9127 }
    ];

    const mockSearcherPrefs = {
      userType: 'Professional',
      profession: 'Corporate Job',
      shift: 'Day Shift',
      socialType: 'Socializing',
      gymGuy: 'Definitely',
      outsideEater: 'Only evening small snacks'
    };

    console.log('\n--- Mock Search Parameter Input ---');
    console.log('POIs:', JSON.stringify(mockPois, null, 2));
    console.log('Preferences:', JSON.stringify(mockSearcherPrefs, null, 2));

    const properties = await Property.find({ status: 'active' }).populate('localityId', 'name').lean();
    console.log(`\nFound ${properties.length} active properties. Starting scoring calculations...\n`);

    for (const prop of properties) {
      console.log(`\n==================================================`);
      console.log(`Property: ${prop.title}`);
      console.log(`BHK: ${prop.bhkConfig} | Furnishing: ${prop.furnishingStatus}`);
      console.log(`Locality: ${(prop.localityId as any)?.name || 'N/A'}`);

      const propLat = prop.location.coordinates[1];
      const propLng = prop.location.coordinates[0];

      // 1. Commute proximity and caches
      console.log('\n--- 1. Commute Proximity to POIs ---');
      let totalDuration = 0;
      for (const poi of mockPois) {
        const dist = getDistanceInKm(propLat, propLng, poi.lat, poi.lng);
        const distanceKm = parseFloat(dist.toFixed(2));
        const durationMin = Math.round(dist * 3.5 + 2);
        totalDuration += durationMin;

        // Verify we can save/retrieve to/from CommuteCache
        let cacheEntry = await CommuteCache.findOne({
          propertyId: prop._id,
          destLat: poi.lat,
          destLng: poi.lng
        });

        if (!cacheEntry) {
          cacheEntry = await CommuteCache.create({
            propertyId: prop._id,
            destLat: poi.lat,
            destLng: poi.lng,
            distanceKm,
            durationMin
          });
          console.log(`[Cache Miss] Created CommuteCache for POI "${poi.label}": ${distanceKm} km, ${durationMin} mins`);
        } else {
          console.log(`[Cache Hit] Read CommuteCache for POI "${poi.label}": ${cacheEntry.distanceKm} km, ${cacheEntry.durationMin} mins`);
        }
      }
      const avgDuration = totalDuration / mockPois.length;
      const commuteScore = Math.max(0, 100 - avgDuration * 2);
      console.log(`Commute score: ${commuteScore.toFixed(1)} / 100`);

      // 2. Nearby Amenities and caches
      console.log('\n--- 2. Nearby Amenities Mappings ---');
      let amenityDoc = await AmenityCache.findOne({ propertyId: prop._id });
      if (!amenityDoc) {
        // Create mock entries for testing
        amenityDoc = await AmenityCache.create({
          propertyId: prop._id,
          amenities: {
            gyms: prop.title.includes('Hinjewadi') ? 3 : 1,
            gymsMinDist: prop.title.includes('Hinjewadi') ? 0.4 : 0.8,
            cafes: prop.title.includes('Viman') ? 5 : 2,
            cafesMinDist: prop.title.includes('Viman') ? 0.2 : 0.3,
            nightlife: prop.title.includes('Viman') ? 4 : 0,
            nightlifeMinDist: prop.title.includes('Viman') ? 0.6 : null,
            supermarkets: 2,
            supermarketsMinDist: prop.title.includes('Viman') ? 0.3 : 0.5,
            transit: 1,
            transitMinDist: prop.title.includes('Viman') ? 0.5 : 0.9,
            hospitals: 1,
            hospitalsMinDist: prop.title.includes('Viman') ? 1.1 : 1.2,
            parks: 2,
            parksMinDist: prop.title.includes('Viman') ? 0.4 : 0.7
          }
        });
        console.log(`[Cache Miss] Created AmenityCache mapping.`);
      } else {
        console.log(`[Cache Hit] Read AmenityCache mapping.`);
      }
      console.log('Amenities counts:', JSON.stringify(amenityDoc.amenities, null, 2));

      // Calculate score
      let amenityScore = 100;
      const a = amenityDoc.amenities;
      if (mockSearcherPrefs.gymGuy === "Definitely" && a.gyms === 0) amenityScore -= 20;
      if (mockSearcherPrefs.outsideEater !== "No, only homemade foodie" && a.cafes === 0) amenityScore -= 20;
      if (mockSearcherPrefs.socialType === "Socializing" && a.nightlife === 0) amenityScore -= 20;
      console.log(`Amenity score: ${amenityScore} / 100`);

      // 3. Roommate compatibility
      console.log('\n--- 3. Roommate Profile Matching ---');
      const leases = await Lease.find({ propertyId: prop._id, status: 'active' }).lean();
      const tenantIds = leases.map(l => l.tenantId).filter(Boolean);

      if (tenantIds.length > 0) {
        const tenants = await User.find({ _id: { $in: tenantIds } }).lean();
        const tenantPrefs = await FlatmatePreferences.find({ userId: { $in: tenantIds } }).lean();

        let totalComp = 0;
        tenants.forEach(tenant => {
          const pref = tenantPrefs.find(p => p.userId.toString() === tenant._id.toString());
          const comp = calculateTenantCompatibility(mockSearcherPrefs, tenant, pref);
          console.log(`- Tenant: ${tenant.name} | Compatibility: ${comp}%`);
          totalComp += comp;
        });
        const finalCompatibility = Math.round(totalComp / tenants.length);
        console.log(`Overall roommate compatibility score: ${finalCompatibility}%`);
      } else {
        console.log('No active roommates found in leases for this property.');
      }
    }

    console.log('\n==================================================');
    console.log('Verification checks completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test run failed:', error);
    process.exit(1);
  }
}

runTest();
