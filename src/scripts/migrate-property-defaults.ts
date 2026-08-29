/**
 * Non-destructive backfill migration for new Property fields.
 * Uses MongoDB aggregation pipeline $ifNull guards so existing values
 * are NEVER overwritten. Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-property-defaults.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in .env.local');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);

  const col = mongoose.connection.db!.collection('properties');
  const now = new Date();

  // Aggregation-pipeline update: $ifNull only sets the field if it is missing
  const result = await col.updateMany(
    {},
    [
      {
        $set: {
          // Lease Flexibility
          availableFrom:       { $ifNull: ['$availableFrom', now] },
          minLeaseMonths:      { $ifNull: ['$minLeaseMonths', 11] },
          lockInMonths:        { $ifNull: ['$lockInMonths', 0] },
          // Tenant Fit
          petPolicy:           { $ifNull: ['$petPolicy', 'case_by_case'] },
          maxOccupants:        { $ifNull: ['$maxOccupants', 2] },
          // Parking & EV
          parkingType:         { $ifNull: ['$parkingType', 'none'] },
          evChargingAvailable: { $ifNull: ['$evChargingAvailable', false] },
          // Infrastructure Reliability
          powerBackup:         { $ifNull: ['$powerBackup', 'none'] },
          waterSupplyType:     { $ifNull: ['$waterSupplyType', 'municipal'] },
          // WFH / Internet Readiness
          internetReadiness:   { $ifNull: ['$internetReadiness', { fiberAvailable: false }] },
          // Trust & Verification
          isVerified:          { $ifNull: ['$isVerified', false] },
          // Safety Features
          safetyFeatures:      { $ifNull: ['$safetyFeatures', []] },
        },
      },
    ]
  );

  console.log(`Migration complete.`);
  console.log(`  Matched:  ${result.matchedCount} documents`);
  console.log(`  Modified: ${result.modifiedCount} documents`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

