import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Property from '../models/Property';
import City from '../models/City';
import Locality from '../models/Locality';
import Lease from '../models/Lease';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function seedLeases() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected.');

    // 1. Clear existing leases
    console.log('Clearing existing leases...');
    await Lease.deleteMany({});

    // 2. Fetch or create users
    let admin = await User.findOne({ role: 'super_admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        phone: '9999999999',
        email: 'admin@flatmatepune.com',
        role: 'super_admin',
        verificationStatus: 'verified',
      });
    }

    let aarav = await User.findOne({ phone: '1111111111' });
    if (!aarav) {
      aarav = await User.create({
        name: 'Aarav Sharma',
        phone: '1111111111',
        email: 'aarav@test.com',
        role: 'user',
        verificationStatus: 'verified',
      });
    }

    // 3. Find city/locality reference
    const city = await City.findOne({ name: 'Pune' });
    const locality = await Locality.findOne({ name: 'Hinjewadi' });

    if (!city || !locality) {
      console.error('Pune or Hinjewadi locality not found. Please run seed script first.');
      process.exit(1);
    }

    // 4. Find or create a test property
    let property = await Property.findOne({ title: /Cozy Flat in Hinjewadi/i });
    if (!property) {
      property = await Property.create({
        ownerId: admin._id,
        title: 'Cozy Flat in Hinjewadi',
        description: 'Premium 1BHK apartment, close to tech parks.',
        rentAmount: 12000,
        depositAmount: 30000,
        maintenanceAmount: 1500,
        bhkConfig: '1BHK',
        propertyType: 'apartment',
        cityId: city._id,
        localityId: locality._id,
        addressLine: 'Sector 3, Hinjewadi Phase 1, Pune',
        location: {
          type: 'Point',
          coordinates: [73.7381, 18.5793]
        },
        furnishingStatus: 'fully_furnished',
        tenantPreference: 'bachelors',
        brokerageFlag: false,
        amenities: ['wifi', 'parking', 'gym'],
        houseRules: ['no_pets', 'no_smoking'],
        status: 'active'
      });
      console.log('Mock property created:', property.title);
    }

    // 5. Create an active lease for Aarav Sharma
    const lease = await Lease.create({
      tenantId: aarav._id,
      propertyId: property._id,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000), // 300 days in future
      rentAmount: 12000,
      status: 'active',
    });

    console.log(`Active lease successfully created!`);
    console.log(`Tenant: Aarav Sharma (${aarav.phone})`);
    console.log(`Property: ${property.title}`);
    console.log(`Lease ID: ${lease._id}`);

    await mongoose.disconnect();
    console.log('Finished seeding leases.');
    process.exit(0);
  } catch (error) {
    console.error('Lease seed process failed:', error);
    process.exit(1);
  }
}

seedLeases();
