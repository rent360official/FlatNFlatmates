import mongoose from 'mongoose';
import City from '../models/City';
import Locality from '../models/Locality';
import PointOfInterest from '../models/PointOfInterest';
import VibeUpgradePackage from '../models/VibeUpgradePackage';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Starting seed operation...');

    // 1. Clear existing collections
    console.log('Clearing existing reference collections...');
    await City.deleteMany({});
    await Locality.deleteMany({});
    await PointOfInterest.deleteMany({});
    await VibeUpgradePackage.deleteMany({});

    // Keep users but make sure we have at least one super admin for testing
    console.log('Checking for Super Admin user...');
    let superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin',
        phone: '9999999999',
        email: 'admin@flatmatepune.com',
        role: 'super_admin',
        verificationStatus: 'verified',
      });
      console.log('Super Admin user created: phone=9999999999, otp=123456');
    }

    // 2. Seed City (Pune)
    console.log('Seeding City (Pune)...');
    const puneCity = await City.create({
      name: 'Pune',
      state: 'Maharashtra',
      isActive: true,
    });
    console.log(`City created: ${puneCity.name}`);

    // 3. Seed Localities
    console.log('Seeding Localities for Pune...');
    const localities = [
      { name: 'Baner', coordinates: [73.7922, 18.5597] },
      { name: 'Koregaon Park', coordinates: [73.8907, 18.5362] },
      { name: 'Viman Nagar', coordinates: [73.9143, 18.5679] },
      { name: 'Hinjewadi', coordinates: [73.7124, 18.5913] },
      { name: 'Kalyani Nagar', coordinates: [73.9042, 18.5463] },
      { name: 'Kothrud', coordinates: [73.8143, 18.5074] },
      { name: 'Aundh', coordinates: [73.8055, 18.5602] },
      { name: 'Hadapsar', coordinates: [73.9268, 18.5089] },
      { name: 'Kharadi', coordinates: [73.9388, 18.5529] },
    ];

    const localityDocs = [];
    for (const loc of localities) {
      const doc = await Locality.create({
        cityId: puneCity._id,
        name: loc.name,
        location: {
          type: 'Point',
          coordinates: loc.coordinates, // [lng, lat]
        },
        isActive: true,
      });
      localityDocs.push(doc);
    }
    console.log(`Seeded ${localityDocs.length} localities.`);

    // 4. Seed Points of Interest (POIs)
    console.log('Seeding Points of Interest...');
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
        name: 'College of Engineering Pune (COEP - Shivajinagar)',
        type: 'college',
        coordinates: [73.8565, 18.5312],
      },
      {
        name: 'Savitribai Phule Pune University (SPPU)',
        type: 'college',
        coordinates: [73.8224, 18.5516],
      },
      {
        name: 'Phoenix Marketcity Mall (Viman Nagar)',
        type: 'landmark',
        coordinates: [73.9168, 18.5622],
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
    console.log(`Seeded ${pois.length} points of interest.`);

    // 5. Seed Vibe Upgrade Packages
    console.log('Seeding Vibe Upgrade Packages...');
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
        images: ['/images/vibe/minimalist-zen-1.jpg'],
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
        images: ['/images/vibe/boho-chic-1.jpg'],
        isActive: true,
        cityIds: [puneCity._id],
      },
      {
        name: 'Sporty Arena',
        description: 'Designed for the active and high-energy individual. Neon vibes, desk organization, and built-in activity elements.',
        accessoryList: [
          'LED custom neon basketball wall hoop',
          'Premium ergonomic high-back desk chair',
          'Heavy-duty matte black dumbbell rack',
          'Customizable pegboard wall utility organizer',
          'Branded dry-erase training planner board',
        ],
        monthlyAddonAmount: 2000,
        refundableDepositAmount: 7000,
        images: ['/images/vibe/sporty-arena-1.jpg'],
        isActive: true,
        cityIds: [puneCity._id],
      },
      {
        name: 'Calm & Class',
        description: 'Sophisticated aesthetics featuring premium dark mahogany accents, rich brass details, and leather accents.',
        accessoryList: [
          'Durable faux-leather tufted throw pillows',
          'Solid brass heavy-base adjustable desk lamp',
          'Multi-tier dark mahogany hardwood book tower',
          'Set of 3 framed high-contrast vintage maps',
          'Chunky knit pure wool utility blanket',
        ],
        monthlyAddonAmount: 2200,
        refundableDepositAmount: 8000,
        images: ['/images/vibe/calm-class-1.jpg'],
        isActive: true,
        cityIds: [puneCity._id],
      },
    ];

    for (const pkg of vibePackages) {
      await VibeUpgradePackage.create(pkg);
    }
    console.log(`Seeded ${vibePackages.length} vibe upgrade packages.`);

    console.log('Seed execution completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed process failed:', error);
    process.exit(1);
  }
};

seedData();
