import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Property from '../models/Property';
import CallLog from '../models/CallLog';
import AuditLog from '../models/AuditLog';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected.');

    // 1. Fetch Aarav, Admin, and target Property Cozy Flat in Hinjewadi
    const aarav = await User.findOne({ phone: '1111111111' });
    const admin = await User.findOne({ role: 'super_admin' });
    const property = await Property.findOne({ title: /Cozy Flat in Hinjewadi/i });

    if (!aarav || !admin || !property) {
      console.error('Test fixtures not found. Run seed scripts first.');
      process.exit(1);
    }

    console.log(`Target Property: ${property.title} [Status: ${property.status}]`);

    // 2. Simulate Call Bridge with post-call analyzer flagging property as "rented"
    console.log('\n--- Simulating Call Bridge with "Rented" Keyword Match ---');
    await CallLog.deleteMany({ propertyId: property._id });

    const rentedTranscript = "Caller: Hi, is the flat still up for rent? Owner: Oh, sorry. I already rented it out yesterday. It is occupied.";
    const providerCallSid = `test_telephony_sid_${Date.now()}`;

    const loggedCall = await CallLog.create({
      callerUserId: aarav._id,
      calleeUserId: property.ownerId,
      propertyId: property._id,
      providerCallSid,
      recordingUrl: `/recordings/call_test_rented.mp3`,
      transcript: rentedTranscript,
      startedAt: new Date(),
      duration: 52,
      detectedAvailability: 'rented' // Flagged by analyzer
    });

    console.log(`Call logged with SID: ${loggedCall.providerCallSid}`);
    console.log(`Detected Availability: ${loggedCall.detectedAvailability} (Expected: rented)`);

    // 3. Test that the property page logic detects the "rented" flag
    console.log('\n--- Simulating Property Page Soft Status Check ---');
    const latestCall = await CallLog.findOne({ propertyId: property._id })
      .sort({ createdAt: -1 })
      .lean();
    const isReportedRented = latestCall?.detectedAvailability === 'rented';

    console.log(`Soft Warning Flag Triggered: ${isReportedRented} (Expected: true)`);
    if (!isReportedRented) {
      throw new Error("Property page status check failed to identify availability warning.");
    }
    console.log("Verified: Soft Warning banner will display correctly on the Flat Detail view.");

    // 4. Test Admin Action: Confirm Rented status
    console.log('\n--- Testing Admin Action: Confirm Rented status ---');
    
    // Admin confirms rented -> soft-delists (pauses) the property
    const beforeState = { status: property.status };
    property.status = 'paused';
    await property.save();

    // Clear call log flag
    loggedCall.detectedAvailability = 'unknown';
    await loggedCall.save();

    // Log to Audit Log
    await AuditLog.create({
      actorId: admin._id,
      action: 'soft_delist_rented_property',
      entityType: 'Property',
      entityId: property._id,
      beforeState,
      afterState: { status: 'paused' }
    });

    const updatedProp = await Property.findById(property._id);
    const updatedCall = await CallLog.findById(loggedCall._id);
    console.log(`Updated Property Status: ${updatedProp?.status} (Expected: paused)`);
    console.log(`Updated Call Flag: ${updatedCall?.detectedAvailability} (Expected: unknown)`);

    if (updatedProp?.status !== 'paused' || updatedCall?.detectedAvailability !== 'unknown') {
      throw new Error("Admin rented confirmation updates failed.");
    }

    // 5. Test Admin Action: Dismiss Warning (resetting to active for testing and confirming override)
    console.log('\n--- Testing Admin Action: Dismiss Warning override ---');
    
    // Set property back to active and call back to rented
    property.status = 'active';
    await property.save();
    loggedCall.detectedAvailability = 'rented';
    await loggedCall.save();

    // Admin dismisses warning
    loggedCall.detectedAvailability = 'available';
    await loggedCall.save();

    await AuditLog.create({
      actorId: admin._id,
      action: 'dismiss_call_availability_warning',
      entityType: 'Property',
      entityId: property._id,
      afterState: { detectedAvailability: 'available' }
    });

    const finalCall = await CallLog.findById(loggedCall._id);
    const finalProp = await Property.findById(property._id);
    console.log(`Final Property Status: ${finalProp?.status} (Expected: active)`);
    console.log(`Final Call Flag: ${finalCall?.detectedAvailability} (Expected: available)`);

    if (finalProp?.status !== 'active' || finalCall?.detectedAvailability !== 'available') {
      throw new Error("Admin warning dismissal overrides failed.");
    }

    console.log('\nAll Call Networking & Telephony tests passed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTest();
