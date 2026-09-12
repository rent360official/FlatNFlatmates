import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { BlacklistedPhone } from "@/models/BlacklistedPhone";
import OtpRateLimit from "@/models/OtpRateLimit";
import { sendVerificationToken } from "@/lib/telephony";
import { isValidIndianMobile, getClean10DigitMobile } from "@/lib/phoneUtils";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const { phone, turnstileToken } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // 1. Strict Indian Mobile Format Validation (Regex Scrubbing)
    if (!isValidIndianMobile(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." },
        { status: 400 }
      );
    }

    const cleanPhone = getClean10DigitMobile(phone);

    // 2. Extract Client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // 3. Invisible Bot Protection (Cloudflare Turnstile)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileResult.success) {
      return NextResponse.json({ error: turnstileResult.error }, { status: 403 });
    }

    await dbConnect();

    // 4. Rate Limiting & Abuse Prevention (Enabled in Production, Disabled in Development)
    const isDevelopment =
      process.env.NODE_ENV !== "production" ||
      process.env.ENVIRONMENT === "development" ||
      process.env.APP_ENV === "development";

    if (!isDevelopment) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      let rateLimit = await OtpRateLimit.findOne({ phone: cleanPhone });

      if (rateLimit) {
        // Rule A: 60-second cooldown between requests
        const msSinceLast = now.getTime() - new Date(rateLimit.lastRequestedAt).getTime();
        if (msSinceLast < 60 * 1000) {
          const remainingSeconds = Math.ceil((60 * 1000 - msSinceLast) / 1000);
          return NextResponse.json(
            { error: `Please wait ${remainingSeconds} seconds before requesting another OTP.` },
            { status: 429 }
          );
        }

        // Rule B: Hourly Cap (Max 3 OTPs per hour)
        if (rateLimit.hourlyWindowStart < oneHourAgo) {
          rateLimit.hourlyCount = 1;
          rateLimit.hourlyWindowStart = now;
        } else {
          if (rateLimit.hourlyCount >= 3) {
            return NextResponse.json(
              { error: "Hourly limit exceeded. You can request at most 3 OTPs per hour for this number. Please try again later." },
              { status: 429 }
            );
          }
          rateLimit.hourlyCount += 1;
        }

        // Rule C: Daily Cap (Max 5 OTPs per 24 hours)
        if (rateLimit.dailyWindowStart < oneDayAgo) {
          rateLimit.dailyCount = 1;
          rateLimit.dailyWindowStart = now;
        } else {
          if (rateLimit.dailyCount >= 5) {
            return NextResponse.json(
              { error: "Daily limit reached for this phone number. Please try again tomorrow." },
              { status: 429 }
            );
          }
          rateLimit.dailyCount += 1;
        }

        rateLimit.lastRequestedAt = now;
        rateLimit.ip = clientIp;
        await rateLimit.save();
      } else {
        // First OTP request for this phone
        rateLimit = new OtpRateLimit({
          phone: cleanPhone,
          ip: clientIp,
          lastRequestedAt: now,
          hourlyCount: 1,
          hourlyWindowStart: now,
          dailyCount: 1,
          dailyWindowStart: now,
        });
        await rateLimit.save();
      }
    }

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
        const blacklisted = await BlacklistedPhone.findOne({ phone: cleanPhone });
        user = new User({
          phone: cleanPhone,
          role: "user",
          verificationStatus: blacklisted ? "rejected" : "pending",
          rejectionReason: blacklisted ? blacklisted.rejectionReason : undefined,
          rejectedAt: blacklisted ? (blacklisted.blacklistedAt || new Date()) : undefined,
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
      // If MSG91_OTP_TEMPLATE_ID is present, invoke backend API; otherwise client Web SDK handles delivery
      if (process.env.MSG91_OTP_TEMPLATE_ID) {
        const { success, error } = await sendVerificationToken(cleanPhone);
        if (!success) {
          return NextResponse.json({ error: error || "Failed to trigger OTP verification" }, { status: 502 });
        }
      }

      await user.save();
      return NextResponse.json({ success: true, exists, useClientSdk: true, message: "Verification authorized. Proceed to OTP verification." });
    }
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "An unexpected error occurred while sending OTP. Please try again later." }, { status: 500 });
  }
}

