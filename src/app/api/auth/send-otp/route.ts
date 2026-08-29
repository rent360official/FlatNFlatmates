import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendVerificationToken } from "@/lib/telephony";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }

    await dbConnect();

    const session = await getServerSession(authOptions);
    let user;
    let exists = false;

    if (session?.user) {
      // Check if target phone is already registered/verified by another user
      const existingUser = await User.findOne({ phone: cleanPhone, _id: { $ne: (session.user as any).id } });
      if (existingUser && (existingUser.verificationStatus === "verified" || existingUser.name)) {
        return NextResponse.json({ error: "This phone number is already registered to another account." }, { status: 400 });
      }

      user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: "Logged-in user record not found in database" }, { status: 404 });
      }
      exists = !!user.name;
    } else {
      // Find or create pending user
      user = await User.findOne({ phone: cleanPhone });
      exists = !!(user && user.name);

      if (!user) {
        user = new User({
          phone: cleanPhone,
          role: "user",
          verificationStatus: "pending",
        });
      }
    }

    const provider = process.env.TELEPHONY_PROVIDER || "mock";

    if (provider === "mock") {
      // Generate local code and expiry for mock testing
      const code = "123456";
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      user.otp = { code, expiresAt };
      await user.save();

      console.log(`\n======================================================`);
      console.log(`[MOCK OTP SERVICE] Phone: ${cleanPhone} | OTP Code: ${code}`);
      console.log(`======================================================\n`);
      return NextResponse.json({ success: true, exists, message: "Mock OTP generated successfully" });
    } else {
      // Call Twilio Verify API
      const { success, error } = await sendVerificationToken(cleanPhone);
      if (!success) {
        return NextResponse.json({ error: error || "Failed to trigger Twilio Verification" }, { status: 502 });
      }

      await user.save();
      return NextResponse.json({ success: true, exists, message: "Verification code sent via Twilio Verify" });
    }
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "An unexpected error occurred while sending OTP. Please try again later." }, { status: 500 });
  }
}
