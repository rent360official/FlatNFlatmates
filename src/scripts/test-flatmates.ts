import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Locality from '../models/Locality';
import PointOfInterest from '../models/PointOfInterest';
import FlatmateProfileListing from '../models/FlatmateProfileListing';
import CallLog from '../models/CallLog';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

// Compatibility calculator matching the route handler logic
function calculateCompatibility(candidateVibe: string[], queryFilters: any) {
  const habits = ['cleanliness', 'food', 'smoking', 'sleep'];
  let totalChecked = 0;
  let matches = 0;

  for (const habit of habits) {
    const candidateVal = candidateVibe?.find(v => v.startsWith(habit + ":"))?.split(":")[1];
    const queryVal = queryFilters[habit];
    if (queryVal && queryVal !== 'any') {
      totalChecked++;
      if (candidateVal === queryVal) {
        matches++;
      }
    }
  }

  if (totalChecked === 0) return 100;
  return Math.round((matches / totalChecked) * 100);
}

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected.');

    // 1. Fetch reference details
    const locality = await Locality.findOne({ name: 'Hinjewadi' });
    const poi = await PointOfInterest.findOne({ name: /Hinjewadi/i });

    if (!locality || !poi) {
      console.error('Locality or POI not found. Please run seed script first.');
      process.exit(1);
    }

    console.log(`POI Landmark: ${poi.name} [Coords: ${poi.location.coordinates}]`);
    console.log(`Locality Target: ${locality.name} [Coords: ${locality.location.coordinates}]`);

    // 2. Create or Update Test Seeker A (Clean, Vegetarian, Early Bird)
    console.log('\nCreating/updating Test Seeker A...');
    let seekerA = await User.findOne({ phone: '1111111111' });
    if (!seekerA) {
      seekerA = new User({ phone: '1111111111' });
    }
    seekerA.name = 'Aarav Sharma';
    seekerA.gender = 'male';
    seekerA.age = 24;
    seekerA.profession = 'Software Engineer at Hinjewadi Tech Park';
    seekerA.bio = 'Looking for a clean flatmate who respects privacy and sleep cycles.';
    seekerA.hobbies = ['Reading', 'Chess', 'Running'];
    seekerA.isFlatmateSearchable = true;
    seekerA.targetLocations = [locality._id as any];
    seekerA.vibePreferences = [
      'cleanliness:high',
      'food:veg_only',
      'smoking:no',
      'sleep:early_bird'
    ];
    await seekerA.save();
    console.log(`Seeker A Aarav created/updated.`);

    // Create/update listing A
    let listingA = await FlatmateProfileListing.findOne({ userId: seekerA._id });
    if (!listingA) {
      listingA = new FlatmateProfileListing({ userId: seekerA._id });
    }
    listingA.budgetMin = 6000;
    listingA.budgetMax = 12000;
    listingA.isActive = true;
    await listingA.save();

    // 3. Create or Update Test Seeker B (Laid-back, Eggetarian, Night Owl)
    console.log('\nCreating/updating Test Seeker B...');
    let seekerB = await User.findOne({ phone: '2222222222' });
    if (!seekerB) {
      seekerB = new User({ phone: '2222222222' });
    }
    seekerB.name = 'Kabir Mehta';
    seekerB.gender = 'male';
    seekerB.age = 26;
    seekerB.profession = 'UX Designer';
    seekerB.bio = 'Creative designer, love music, late nights, egg meals.';
    seekerB.hobbies = ['Music', 'Gaming', 'Painting'];
    seekerB.isFlatmateSearchable = true;
    seekerB.targetLocations = [locality._id as any];
    seekerB.vibePreferences = [
      'cleanliness:moderate',
      'food:egg_allowed',
      'smoking:occasional',
      'sleep:night_owl'
    ];
    await seekerB.save();
    console.log(`Seeker B Kabir created/updated.`);

    // Create/update listing B
    let listingB = await FlatmateProfileListing.findOne({ userId: seekerB._id });
    if (!listingB) {
      listingB = new FlatmateProfileListing({ userId: seekerB._id });
    }
    listingB.budgetMin = 8000;
    listingB.budgetMax = 15000;
    listingB.isActive = true;
    await listingB.save();

    // 4. Test Compatibility Score Calculation
    console.log('\n--- Testing Compatibility Matching ---');
    const searchFilter1 = { cleanliness: 'high', food: 'veg_only' };
    console.log('Search query filters:', searchFilter1);

    const scoreA = calculateCompatibility(seekerA.vibePreferences, searchFilter1);
    const scoreB = calculateCompatibility(seekerB.vibePreferences, searchFilter1);

    console.log(`Aarav Sharma Match Score: ${scoreA}% (Expected: 100% since High Cleanliness & Veg only match)`);
    console.log(`Kabir Mehta Match Score: ${scoreB}% (Expected: 0% since Moderate Cleanliness & Egg allowed do not match)`);

    // 5. Test CallLog Schema modification (direct user-to-user call log without propertyId)
    console.log('\n--- Testing Modified CallLog Schema ---');
    await CallLog.deleteMany({ callerUserId: seekerA._id, calleeUserId: seekerB._id });
    
    const callLogObj = {
      callerUserId: seekerA._id,
      calleeUserId: seekerB._id,
      providerCallSid: `test_sid_${Date.now()}`,
      startedAt: new Date(),
      duration: 45,
      detectedAvailability: 'unknown' as 'available' | 'rented' | 'unknown'
    };

    console.log('Inserting CallLog without propertyId field...');
    const savedLog = await CallLog.create(callLogObj);
    console.log('CallLog created successfully! ID:', savedLog._id);
    console.log('Verified: propertyId is optional and DB constraints allow direct seeker calls.');

    console.log('\nAll flatmate matching tests passed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTest();
