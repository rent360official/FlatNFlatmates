import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { checkVerificationToken } from "@/lib/telephony";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in with Google first" }, { status: 401 });
    }

    const googleUserId = (session.user as any).id;
    const googleUserPhone = (session.user as any).phone;

    if (!googleUserPhone || !googleUserPhone.startsWith("GOOGLE_")) {
      return NextResponse.json({ error: "Your phone number is already verified" }, { status: 400 });
    }

    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }

    await dbConnect();

    // Find the user document that matches the target phone number
    let phoneUser = await User.findOne({ phone: cleanPhone });
    if (!phoneUser) {
      phoneUser = new User({
        phone: cleanPhone,
        role: "user",
        verificationStatus: "pending",
      });
    }

    const provider = process.env.TELEPHONY_PROVIDER || "mock";
    let isVerified = false;

    if (provider === "mock") {
      if (otp === "123456") {
        isVerified = true;
        phoneUser.otp = undefined; // Clear OTP
      } else if (phoneUser.otp && phoneUser.otp.code === otp && phoneUser.otp.expiresAt > new Date()) {
        isVerified = true;
        phoneUser.otp = undefined; // Clear OTP
      }
    } else {
      const { approved, error } = await checkVerificationToken(cleanPhone, otp);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      isVerified = approved;
    }

    if (!isVerified) {
      return NextResponse.json({ error: "Invalid OTP code or OTP expired. Please request a new SMS." }, { status: 400 });
    }

    // Find the current Google user document to extract details
    const googleUser = await User.findById(googleUserId);
    if (!googleUser) {
      return NextResponse.json({ error: "Google account session not found in database" }, { status: 404 });
    }

    // Determine if the target phone number is already verified/active on another account
    const isPreExistingUser = phoneUser && (phoneUser.verificationStatus === "verified" || phoneUser.email || phoneUser.name);

    if (isPreExistingUser) {
      // Pre-existing user: Merge Google details into it and delete the temporary Google user.
      if (googleUser.email && !phoneUser.email) {
        phoneUser.email = googleUser.email;
      }
      if (googleUser.name && !phoneUser.name) {
        phoneUser.name = googleUser.name;
      }
      if (googleUser.profilePhoto && !phoneUser.profilePhoto) {
        phoneUser.profilePhoto = googleUser.profilePhoto;
      }

      phoneUser.verificationStatus = "verified";

      // Secure server-side super admin promotion for target number
      if (cleanPhone === "8933066862") {
        phoneUser.role = "super_admin";
      }

      // Delete the temporary Google user first to avoid email unique key constraint violation
      await User.deleteOne({ _id: googleUser._id });
      await phoneUser.save();
    } else {
      // New phone number: Simply update the Google user directly.
      googleUser.phone = cleanPhone;
      googleUser.verificationStatus = "verified";

      // Secure server-side super admin promotion for target number
      if (cleanPhone === "8933066862") {
        googleUser.role = "super_admin";
      }

      await googleUser.save();

      // Clean up the placeholder user created during the send-otp step
      if (phoneUser && !phoneUser.isNew) {
        await User.deleteOne({ _id: phoneUser._id });
      }
    }

    return NextResponse.json({ success: true, message: "Phone number verified and account created successfully" });
  } catch (error: any) {
    console.error("Google phone verification error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during phone verification. Please try again later." }, { status: 500 });
  }
}
