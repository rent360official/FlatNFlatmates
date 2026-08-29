import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import Property from "@/models/Property";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, calleeUserId } = await req.json();
    if (!propertyId && !calleeUserId) {
      return NextResponse.json({ error: "Property ID or Callee User ID required" }, { status: 400 });
    }

    await dbConnect();
    let finalCalleeUserId = calleeUserId;
    const finalPropertyId = propertyId;

    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      finalCalleeUserId = property.ownerId;
    } else {
      const callee = await User.findById(calleeUserId);
      if (!callee) {
        return NextResponse.json({ error: "Callee user not found" }, { status: 404 });
      }
    }

    // Simulated Post-Call Transcript and Recording Analysis
    const conversations: { transcript: string; detectedAvailability: 'available' | 'rented' | 'unknown' }[] = [
      {
        transcript: "Caller: Hello, is the flat still available? Owner: Yes, it is vacant. You can come for a visit tomorrow at 5 PM.",
        detectedAvailability: "available"
      },
      {
        transcript: "Caller: Hi, I'm calling about the flat. Is it still up for rent? Owner: Oh, sorry. I already rented it out yesterday. It is occupied.",
        detectedAvailability: "rented"
      },
      {
        transcript: "Caller: Hello, is this property still available? Owner: Let me check with my coordinator and get back to you.",
        detectedAvailability: "unknown"
      }
    ];

    const choice = conversations[Math.floor(Math.random() * conversations.length)];

    // Log call masked bridge action
    await CallLog.create({
      callerUserId: (session.user as any).id,
      calleeUserId: finalCalleeUserId,
      propertyId: finalPropertyId || undefined,
      providerCallSid: `mock_sid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      recordingUrl: `/recordings/call_${Date.now()}.mp3`,
      transcript: choice.transcript,
      startedAt: new Date(),
      duration: Math.floor(Math.random() * 180) + 15,
      detectedAvailability: choice.detectedAvailability,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log proxy bridge" }, { status: 500 });
  }
}
