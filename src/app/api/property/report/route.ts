import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import Property from "@/models/Property";
import { getConfiguredContactEmail, sendInquiryEmailNotification } from "@/lib/inquiryEmail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Please log in to report a listing." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { propertyId, reason, description } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid property ID provided." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select a reason for reporting." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a brief description (min 5 characters)." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch property title
    const property = await Property.findById(propertyId).select("title bhkConfig").lean();
    const propertyTitle = property
      ? `${property.bhkConfig ? property.bhkConfig + " in " : ""}${property.title}`
      : "Property Listing #" + propertyId;

    const user = session.user as any;
    const userId = user.id;
    const contactInfo = user.phone || user.email || user.name || "Authenticated User";
    const name = user.name || undefined;

    // 1. Get destination email configured in admin portal
    const targetEmail = await getConfiguredContactEmail();

    // 2. Extract Client IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 3. Save Report to Database under Inquiry collection with type: 'report'
    const reportDoc = await Inquiry.create({
      type: "report",
      propertyId,
      propertyTitle,
      reporterUserId: userId || undefined,
      contactInfo,
      name,
      reason: reason.trim(),
      description: description.trim(),
      status: "pending",
      userIp: clientIp,
      targetEmail,
    });

    // 4. Trigger Email Notification to target email
    await sendInquiryEmailNotification({
      type: "report",
      targetEmail,
      contactInfo,
      name,
      reason: reason.trim(),
      description: description.trim(),
      inquiryId: reportDoc._id.toString(),
      propertyId,
      propertyTitle,
    });

    return NextResponse.json({
      success: true,
      reportId: reportDoc._id.toString(),
      message: "Report submitted successfully. Our moderation team will investigate this listing.",
    });
  } catch (error: any) {
    console.error("Error submitting property report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit report. Please try again." },
      { status: 500 }
    );
  }
}
