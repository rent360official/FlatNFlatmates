import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import City from '../models/City';
import Locality from '../models/Locality';
import PointOfInterest from '../models/PointOfInterest';
import VibeUpgradePackage from '../models/VibeUpgradePackage';
import User from '../models/User';
import Property from '../models/Property';
import Lease from '../models/Lease';
import FlatmateProfileListing from '../models/FlatmateProfileListing';
import VibeUpgradeRequest from '../models/VibeUpgradeRequest';
import CallLog from '../models/CallLog';
import AuditLog from '../models/AuditLog';
import FlatmatePreferences from '../models/FlatmatePreferences';
import CommuteCache from '../models/CommuteCache';
import AmenityCache from '../models/AmenityCache';
import FeatureFlag from '../models/FeatureFlag';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const seedPuneDemo = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Starting master Pune seed operation...');

    // 1. Clear ALL collections
    console.log('Clearing all collections...');
    await City.deleteMany({});
    await Locality.deleteMany({});
    await PointOfInterest.deleteMany({});
    await VibeUpgradePackage.deleteMany({});
    await User.deleteMany({});
    await Property.deleteMany({});
    await Lease.deleteMany({});
    await FlatmateProfileListing.deleteMany({});
    await VibeUpgradeRequest.deleteMany({});
    await CallLog.deleteMany({});
    await AuditLog.deleteMany({});
    await FlatmatePreferences.deleteMany({});
    await CommuteCache.deleteMany({});
    await AmenityCache.deleteMany({});
    await FeatureFlag.deleteMany({});
    console.log('Collections cleared.');

    // 1b. Seed Feature Flags
    console.log('Seeding feature flags...');
    await FeatureFlag.insertMany([
      // User-facing features
      {
        key: 'vibe_upgrade_catalog',
        label: 'Vibe Upgrade Catalog',
        status: 'enabled',
        category: 'feature',
        description: 'Allow users to browse and request vibe upgrade packages for their flat.',
      },
      {
        key: 'living_services',
        label: 'Living Services',
        status: 'disabled',
        category: 'feature',
        description: 'On-demand housekeeping, laundry, and home maintenance services.',
      },
      {
        key: 'legal_services',
        label: 'Legal Services',
        status: 'disabled',
        category: 'feature',
        description: 'Rental agreement drafting and legal dispute assistance.',
      },
      // Backend system configs
      {
        key: 'flat_search_preferences_enabled',
        label: 'Flat Search Preference Matching',
        status: 'enabled',
        value: true,
        category: 'system_config',
        description: 'Enable flatmate lifestyle preference matching in flat search results.',
        isActive: true,
      },
    ]);
    console.log('Feature flags seeded.');

    // 2. Seed City (Pune)
    console.log('Seeding City (Pune)...');
    const puneCity = await City.create({
      name: 'Pune',
      state: 'Maharashtra',
      isActive: true,
    });

    // 3. Seed Localities
    console.log('Seeding Pune Localities...');
    const localities = [
      { name: 'Baner', coordinates: [73.7922, 18.5597] },
      { name: 'Koregaon Park', coordinates: [73.8907, 18.5362] },
      { name: 'Viman Nagar', coordinates: [73.9143, 18.5679] },
      { name: 'Hinjewadi', coordinates: [73.7124, 18.5913] },
      { name: 'Kharadi', coordinates: [73.9388, 18.5529] },
      { name: 'Aundh', coordinates: [73.8055, 18.5602] },
    ];

    const localityDocs: any[] = [];
    for (const loc of localities) {
      const doc = await Locality.create({
        cityId: puneCity._id,
        name: loc.name,
        location: {
          type: 'Point',
          coordinates: loc.coordinates,
        },
        isActive: true,
      });
      localityDocs.push(doc);
    }

    // 4. Seed Points of Interest (POIs)
    console.log('Seeding Pune POI commute anchors...');
    const hinjewadiLoc = localityDocs.find((l) => l.name === 'Hinjewadi');
    const kharadiLoc = localityDocs.find((l) => l.name === 'Kharadi');
    const vimanLoc = localityDocs.find((l) => l.name === 'Viman Nagar');

    const pois = [
      {
        name: 'Rajiv Gandhi Infotech Park (Hinjewadi)',
        type: 'office',
        coordinates: [73.7381, 18.5793],
        localityId: hinjewadiLoc?._id,
      },
      {
        name: 'EON Free Zone (Kharadi)',
        type: 'office',
        coordinates: [73.9515, 18.5507],
        localityId: kharadiLoc?._id,
      },
      {
        name: 'Symbiosis International University (Viman Nagar)',
        type: 'college',
        coordinates: [73.9127, 18.5636],
        localityId: vimanLoc?._id,
      },
      {
        name: 'Pune Railway Station',
        type: 'transit',
        coordinates: [73.8739, 18.5289],
      },
    ];

    for (const poi of pois) {
      await PointOfInterest.create({
        cityId: puneCity._id,
        localityId: poi.localityId,
        name: poi.name,
        type: poi.type as any,
        location: {
          type: 'Point',
          coordinates: poi.coordinates,
        },
        isActive: true,
      });
    }

    // 5. Seed Vibe Upgrade Packages
    console.log('Seeding Vibe Upgrade Catalog packages...');
    const vibePackages = [
      {
        name: 'Minimalist Zen',
        description: 'Embrace peace and order with soft textures, natural woods, and low-profile furnishing that maximize breathing room.',
        accessoryList: [
          'Solid-wood low platform bed frame',
          'Soft warm rice-paper floor lamp',
          'Potted Monstera Deliciosa plant',
          'Organic natural linen curtains',
          'Minimalist white floating bedside shelf',
        ],
        monthlyAddonAmount: 1500,
        refundableDepositAmount: 5000,
        images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'],
        isActive: true,
        cityIds: [puneCity._id],
      },
      {
        name: 'Boho Chic',
        description: 'Vibrant, warm, and highly expressive. Combine rattan accents, rich textures, and hanging greens to create a creative sanctuary.',
        accessoryList: [
          'Hand-woven rattan accent lounge chair',
          'Intricate cotton macrame wall hanging',
          'Warm globe string lights with dimmers',
          'Textured geometric pattern area rug',
          'Woven seagrass laundry basket',
        ],
        monthlyAddonAmount: 1800,
        refundableDepositAmount: 6000,
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
        isActive: true,
        cityIds: [puneCity._id],
      },
    ];

    const vibeDocs: any[] = [];
    for (const pkg of vibePackages) {
      const doc = await VibeUpgradePackage.create(pkg);
      vibeDocs.push(doc);
    }

    // 6. Seed Users
    console.log('Seeding Pune Seekers & Admin user accounts...');

    // Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      phone: '9999999999',
      email: 'admin@FlatNFlatmates.in',
      role: 'super_admin',
      verificationStatus: 'verified',
    });

    // Landlord
    const rohan = await User.create({
      name: 'Rohan Joshi',
      phone: '4444444444',
      email: 'rohan@landlord.com',
      role: 'owner',
      verificationStatus: 'verified',
    });

    // Seeker A (Clean, Vegetarian, Early Bird)
    const aarav = await User.create({
      name: 'Aarav Sharma',
      phone: '1111111111',
      email: 'aarav@FlatNFlatmates.in',
      gender: 'male',
      age: 24,
      profession: 'Software Engineer at Hinjewadi Tech Park',
      bio: 'Clean, professional, vegetarian. Sleep early and rise early. Looking for a peaceful flatmate.',
      hobbies: ['Running', 'Chess', 'Reading'],
      flatPreferences: ['Gym', 'Parking', 'Power backup'],
      vibePreferences: [
        'cleanliness:high',
        'food:veg_only',
        'smoking:no',
        'sleep:early_bird'
      ],
      isFlatmateSearchable: true,
      targetLocations: [hinjewadiLoc?._id],
      role: 'user',
      verificationStatus: 'verified',
    });

    // Seeker B (Laid-back, Eggetarian, Night Owl)
    const kabir = await User.create({
      name: 'Kabir Mehta',
      phone: '2222222222',
      email: 'kabir@FlatNFlatmates.in',
      gender: 'male',
      age: 26,
      profession: 'UX Designer',
      bio: 'Creative soul, late-night owl, WFH designer. Easy-going, egg-meals allowed. Looking to share space near Hinjewadi.',
      hobbies: ['Gaming', 'Music', 'Sketching'],
      flatPreferences: ['Balcony', 'High-floor', 'Parking'],
      vibePreferences: [
        'cleanliness:moderate',
        'food:egg_allowed',
        'smoking:occasional',
        'sleep:night_owl'
      ],
      isFlatmateSearchable: true,
      targetLocations: [hinjewadiLoc?._id],
      role: 'user',
      verificationStatus: 'verified',
    });

    // Seeker C (Symbiosis Student, Flexible sleep, Non-smoker)
    const meera = await User.create({
      name: 'Meera Nair',
      phone: '3333333333',
      email: 'meera@FlatNFlatmates.in',
      gender: 'female',
      age: 21,
      profession: 'Symbiosis Student',
      bio: 'MBA Student at Symbiosis. Easy-going, love to explore Pune cafés. Non-smoker, clean habits. Open to non-veg.',
      hobbies: ['Baking', 'Travel', 'Dancing'],
      flatPreferences: ['Wifi', 'Security', 'Lift'],
      vibePreferences: [
        'cleanliness:high',
        'food:any',
        'smoking:no',
        'sleep:flexible'
      ],
      isFlatmateSearchable: true,
      targetLocations: [vimanLoc?._id],
      role: 'user',
      verificationStatus: 'verified',
    });

    console.log('Seeding Flatmate Preferences for seekers...');
    await FlatmatePreferences.create({
      userId: aarav._id,
      userType: 'Professional',
      profession: 'Corporate Job',
      shift: 'Day Shift',
      socialType: 'Reserved',
      gymGuy: 'Maybe',
      outsideEater: 'No, only homemade foodie',
    });

    await FlatmatePreferences.create({
      userId: kabir._id,
      userType: 'Professional',
      profession: 'Self Employed',
      shift: 'Night Shift',
      socialType: 'Socializing',
      gymGuy: 'Not at all',
      outsideEater: 'Too much',
    });

    await FlatmatePreferences.create({
      userId: meera._id,
      userType: 'Student',
      socialType: 'Socializing',
      gymGuy: 'Maybe',
      outsideEater: 'Only evening small snacks',
    });

    // 7. Seed Properties owned by Rohan
    console.log('Seeding Properties...');
    const cozyFlat = await Property.create({
      ownerId: rohan._id,
      title: 'Cozy 1BHK in Hinjewadi Phase 1',
      description: 'Fully furnished cozy 1BHK, excellent coordinates, walk to Rajiv Gandhi Tech Park. Perfect for single professionals. Fiber internet, EV charging, zero brokerage!',
      rentAmount: 12000,
      depositAmount: 30050,
      maintenanceAmount: 1200,
      bhkConfig: '1BHK',
      propertyType: 'apartment',
      cityId: puneCity._id,
      localityId: hinjewadiLoc?._id,
      addressLine: 'Block C, Megapolis, Hinjewadi Phase 3, Pune',
      location: {
        type: 'Point',
        coordinates: [73.7124, 18.5913]
      },
      furnishingStatus: 'fully_furnished',
      tenantPreference: 'bachelors',
      brokerageFlag: false,
      amenities: ['wifi', 'parking', 'gym', 'power_backup'],
      houseRules: ['no_smoking'],
      status: 'active',
      // New fields — Lease Flexibility
      availableFrom: new Date(),                // Move-in ready today
      minLeaseMonths: 6,
      lockInMonths: 0,
      // New fields — Tenant Fit
      petPolicy: 'allowed',
      maxOccupants: 2,
      // New fields — Parking & EV
      parkingType: 'two_wheeler',
      evChargingAvailable: true,
      // New fields — Infrastructure
      powerBackup: 'full',
      waterSupplyType: 'municipal',
      // New fields — WFH / Internet
      internetReadiness: { fiberAvailable: true, avgSpeedMbps: 100 },
      // New fields — Trust
      isVerified: true,
      verifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Verified 7 days ago
      // New fields — Safety
      safetyFeatures: ['CCTV', 'Gated Community', 'Fire Safety'],
    });

    const spaciousFlat = await Property.create({
      ownerId: rohan._id,
      title: 'Spacious 2BHK in Viman Nagar',
      description: 'Semi-furnished beautiful 2BHK near Symbiosis. Security guard, CCTV, 4-wheeler parking. Open balcony with greenery views. Suitable for families or working women.',
      rentAmount: 22000,
      depositAmount: 60000,
      maintenanceAmount: 2000,
      bhkConfig: '2BHK',
      propertyType: 'apartment',
      cityId: puneCity._id,
      localityId: vimanLoc?._id,
      addressLine: 'A5, Clover Park, Viman Nagar, Pune',
      location: {
        type: 'Point',
        coordinates: [73.9143, 18.5679]
      },
      furnishingStatus: 'semi_furnished',
      tenantPreference: 'girls',
      brokerageFlag: false,
      amenities: ['wifi', 'parking', 'lift', 'security'],
      houseRules: ['no_smoking'],
      status: 'active',
      // New fields — Lease Flexibility
      availableFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Available in 15 days
      minLeaseMonths: 11,
      lockInMonths: 3,
      // New fields — Tenant Fit
      petPolicy: 'not_allowed',
      maxOccupants: 3,
      // New fields — Parking & EV
      parkingType: 'four_wheeler',
      evChargingAvailable: false,
      // New fields — Infrastructure
      powerBackup: 'partial',
      waterSupplyType: 'municipal',
      // New fields — WFH / Internet
      internetReadiness: { fiberAvailable: false },
      // New fields — Trust (not yet verified)
      isVerified: false,
      // New fields — Safety
      safetyFeatures: ['Security Guard', 'CCTV', 'Video Doorbell', 'Intercom'],
    });

    console.log('Seeding Amenity Caches...');
    await AmenityCache.create({
      propertyId: cozyFlat._id,
      amenities: {
        gyms: 3,
        gymsMinDist: 0.4,
        cafes: 2,
        cafesMinDist: 0.3,
        nightlife: 0,
        nightlifeMinDist: null,
        supermarkets: 2,
        supermarketsMinDist: 0.5,
        transit: 1,
        transitMinDist: 0.9,
        hospitals: 1,
        hospitalsMinDist: 1.2,
        parks: 2,
        parksMinDist: 0.7
      }
    });

    await AmenityCache.create({
      propertyId: spaciousFlat._id,
      amenities: {
        gyms: 1,
        gymsMinDist: 0.8,
        cafes: 5,
        cafesMinDist: 0.2,
        nightlife: 4,
        nightlifeMinDist: 0.6,
        supermarkets: 2,
        supermarketsMinDist: 0.3,
        transit: 1,
        transitMinDist: 0.5,
        hospitals: 1,
        hospitalsMinDist: 1.1,
        parks: 2,
        parksMinDist: 0.4
      }
    });

    // 8. Seed Flatmate Profile Listings (attaching property to Aarav and Meera)
    console.log('Seeding Seeker Listings...');
    await FlatmateProfileListing.create({
      userId: aarav._id,
      propertyId: cozyFlat._id, // Aarav already has a flat and wants a flatmate to share
      budgetMin: 6000,
      budgetMax: 12000,
      isActive: true,
    });

    await FlatmateProfileListing.create({
      userId: kabir._id,
      budgetMin: 8000,
      budgetMax: 15000,
      isActive: true,
    });

    await FlatmateProfileListing.create({
      userId: meera._id,
      propertyId: spaciousFlat._id, // Meera wants a roommate to share her 2BHK
      budgetMin: 10000,
      budgetMax: 14000,
      isActive: true,
    });

    // 9. Seed active Leases (Aarav and Meera are active tenants)
    console.log('Seeding active Leases...');
    const leaseAarav = await Lease.create({
      tenantId: aarav._id,
      propertyId: cozyFlat._id,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      rentAmount: 12000,
      status: 'active',
    });

    const leaseMeera = await Lease.create({
      tenantId: meera._id,
      propertyId: spaciousFlat._id,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000),
      rentAmount: 22000,
      status: 'active',
    });

    // 10. Seed Vibe Upgrade Requests
    console.log('Seeding Vibe Upgrade Requests...');

    // Aarav requested Zen package, completed by Admin
    await VibeUpgradeRequest.create({
      userId: aarav._id,
      propertyId: cozyFlat._id,
      packageId: vibeDocs[0]._id, // Zen
      otp: '428816',
      status: 'completed',
      depositRefundStatus: 'held',
      completedByAdminId: superAdmin._id,
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // Meera requested Boho Chic, pending setup
    await VibeUpgradeRequest.create({
      userId: meera._id,
      propertyId: spaciousFlat._id,
      packageId: vibeDocs[1]._id, // Boho
      otp: '782915',
      status: 'requested',
      depositRefundStatus: 'held',
    });

    // 11. Seed Call Logs
    console.log('Seeding Call Logs...');

    // Kabir called Rohan Joshi about Hinjewadi property, flagged available
    await CallLog.create({
      callerUserId: kabir._id,
      calleeUserId: rohan._id,
      propertyId: cozyFlat._id,
      providerCallSid: `exotel_sid_42816_${Date.now()}`,
      recordingUrl: `/recordings/call_available_cozy.mp3`,
      transcript: "Caller: Hello, is the mega flat in Hinjewadi still available? Owner: Yes, it is vacant. You can come for a visit tomorrow.",
      detectedAvailability: 'available',
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      duration: 35,
    });

    // Aarav called Rohan (flagged rented - soft warning verification trigger!)
    await CallLog.create({
      callerUserId: aarav._id,
      calleeUserId: rohan._id,
      propertyId: spaciousFlat._id, // let's flag Meera's flat as rented
      providerCallSid: `exotel_sid_92715_${Date.now()}`,
      recordingUrl: `/recordings/call_rented_spacious.mp3`,
      transcript: "Caller: Hello, is the Clover Park Viman Nagar flat still up for rent? Owner: Oh, sorry. I already rented it out yesterday. It is occupied.",
      detectedAvailability: 'rented',
      startedAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      duration: 48,
    });

    console.log('Master Pune Demo Seed completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed process failed:', error);
    process.exit(1);
  }
};

seedPuneDemo();
