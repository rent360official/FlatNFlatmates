import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import { getConfiguredContactEmail, sendInquiryEmailNotification } from "@/lib/inquiryEmail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactInfo, name, reason, description } = body;

    if (!contactInfo || typeof contactInfo !== "string" || contactInfo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide your mobile number or email address." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a description for your inquiry." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Get destination email configured in admin portal
    const targetEmail = await getConfiguredContactEmail();

    // 2. Extract Client IP for audit/spam prevention
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 3. Save Inquiry to Database
    const inquiry = await Inquiry.create({
      contactInfo: contactInfo.trim(),
      name: name?.trim() || undefined,
      reason: reason || "general_inquiry",
      description: description.trim(),
      status: "pending",
      userIp: clientIp,
      targetEmail,
    });

    // 4. Trigger Email Notification to target email
    await sendInquiryEmailNotification({
      targetEmail,
      contactInfo: contactInfo.trim(),
      name: name?.trim(),
      reason: reason || "general_inquiry",
      description: description.trim(),
      inquiryId: inquiry._id.toString(),
    });

    return NextResponse.json({
      success: true,
      inquiryId: inquiry._id.toString(),
      message: "Your inquiry has been submitted successfully. Our team will get back to you shortly.",
    });
  } catch (error: any) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
