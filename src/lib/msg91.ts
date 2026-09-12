/**
 * MSG91 Telephony & Messaging Service Integration
 * Handles:
 * 1. OTP Generation and Verification for Authentication
 * 2. Platform SMS Notifications (e.g. Property Inquiry / Interested Alerts)
 */

import { formatMsg91Phone, formatE164Phone } from "./phoneUtils";
export { formatMsg91Phone, formatE164Phone };

async function safeParseResponse(res: Response): Promise<{ data: any; rawText: string }> {
  const rawText = await res.text();
  try {
    const data = rawText ? JSON.parse(rawText) : {};
    return { data, rawText };
  } catch {
    return { data: { message: rawText }, rawText };
  }
}

/**
 * 1. Send OTP via MSG91 OTP Service
 */
export async function sendMsg91Otp(phone: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  if (provider === "mock") {
    return { success: true, message: "Mock OTP generated" };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID || process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;

  if (!authKey || !templateId) {
    return { success: false, error: "MSG91_AUTH_KEY or Widget configuration is missing in environment variables." };
  }

  const formattedMobile = formatMsg91Phone(phone);
  const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(formattedMobile)}&authkey=${encodeURIComponent(authKey)}&otp_expiry=10`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
    });

    const { data, rawText } = await safeParseResponse(res);
    console.log("MSG91 sendOtp response:", data);

    if (res.ok && (data.type === "success" || data.status === "success" || data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("sent"))) {
      return { success: true, message: data.message || "OTP sent successfully via MSG91" };
    }

    console.error("MSG91 Send OTP error response:", data || rawText);
    return { success: false, error: data.message || rawText || "Failed to dispatch OTP via MSG91." };
  } catch (err: any) {
    console.error("MSG91 Send OTP network error:", err);
    return { success: false, error: err.message || "Network error while connecting to MSG91." };
  }
}

/**
 * 2a. Verify MSG91 Widget Access Token (Client-Side SDK Verification)
 * Endpoint: POST https://control.msg91.com/api/v5/widget/verifyAccessToken
 */
export async function verifyMsg91AccessToken(accessToken: string): Promise<{ approved: boolean; phone?: string; error?: string; rawResponse?: any }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  if (provider === "mock") {
    return { approved: true, phone: "919999999999" };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { approved: false, error: "MSG91_AUTH_KEY is not configured in environment variables." };
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        authkey: authKey,
        "access-token": accessToken,
      }),
    });

    const { data, rawText } = await safeParseResponse(res);
    console.log("MSG91 verifyAccessToken response:", data);

    if (res.ok && (data.type === "success" || data.status === "success" || data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("verified"))) {
      const verifiedPhone = data.data?.mobile || data.data?.phone || data.mobile;
      return { approved: true, phone: verifiedPhone, rawResponse: data };
    }

    console.error("MSG91 verifyAccessToken error response:", data || rawText);
    return { approved: false, error: data.message || rawText || "Failed to verify MSG91 access token.", rawResponse: data };
  } catch (err: any) {
    console.error("MSG91 verifyAccessToken network error:", err);
    return { approved: false, error: err.message || "Network error while validating access token." };
  }
}

/**
 * 2b. Verify OTP (Handles both numeric OTPs and Widget Access Tokens)
 */
export async function verifyMsg91Otp(phone: string, tokenOrOtp: string): Promise<{ approved: boolean; error?: string }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  // Allow 123456 in mock mode or local development
  if (tokenOrOtp === "123456" && (provider === "mock" || process.env.NODE_ENV !== "production")) {
    return { approved: true };
  }

  if (provider === "mock") {
    if (tokenOrOtp.startsWith("mock_token")) return { approved: true };
    return { approved: false, error: "Invalid mock OTP" };
  }

  // If tokenOrOtp is a JWT / Widget Access Token from Client SDK
  if (tokenOrOtp.length > 15 || tokenOrOtp.includes(".")) {
    const result = await verifyMsg91AccessToken(tokenOrOtp);
    return { approved: result.approved, error: result.error };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { approved: false, error: "MSG91_AUTH_KEY is not configured in environment variables." };
  }

  const formattedMobile = formatMsg91Phone(phone);
  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(tokenOrOtp)}&mobile=${encodeURIComponent(formattedMobile)}&authkey=${encodeURIComponent(authKey)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
    });

    const { data, rawText } = await safeParseResponse(res);
    console.log("MSG91 verifyOtp response:", data);

    if (res.ok && (data.type === "success" || data.status === "success" || data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("verified"))) {
      return { approved: true };
    }

    console.error("MSG91 Verify OTP error response:", data || rawText);
    return { approved: false, error: data.message || rawText || "Invalid or expired OTP." };
  } catch (err: any) {
    console.error("MSG91 Verify OTP network error:", err);
    return { approved: false, error: err.message || "Network error while validating OTP." };
  }
}

/**
 * 3. Send Property Interest SMS to Owner via MSG91 Flow / SMS API
 */
export async function sendPropertyInterestSms(params: {
  ownerPhone: string;
  userName: string;
  userPhone: string;
  propertyTitle: string;
  propertyUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string; rawResponse?: any }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  if (provider === "mock") {
    console.log(`\n======================================================`);
    console.log(`[MOCK MSG91 SMS] To Owner: ${params.ownerPhone}`);
    console.log(`Message: "Hii, ${formatE164Phone(params.userPhone)} (${params.userName}) has shown interest in renting ${params.propertyTitle}. - FlatNFlatmates.in"`);
    console.log(`======================================================\n`);
    return { success: true, messageId: `mock_sms_${Date.now()}` };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_SMS_TEMPLATE_ID || process.env.MSG91_INTEREST_FLOW_ID;
  const senderId = process.env.MSG91_SENDER_ID || "FLTNFL";

  if (!authKey || !templateId) {
    console.warn("MSG91_AUTH_KEY or MSG91_SMS_TEMPLATE_ID is missing. Simulated dispatch executed.");
    return { success: true, messageId: `simulated_sms_${Date.now()}` };
  }

  const formattedOwnerMobile = formatMsg91Phone(params.ownerPhone);
  const formattedUserPhone = formatE164Phone(params.userPhone);

  const payload = {
    template_id: templateId,
    sender: senderId,
    short_url: "0",
    mobiles: formattedOwnerMobile,
    recipients: [
      {
        mobiles: formattedOwnerMobile,
        user_name: params.userName,
        user_phone: formattedUserPhone,
        property_title: params.propertyTitle,
        property_url: params.propertyUrl || "https://flatandflatmates.in",
        VAR1: params.userName,
        VAR2: formattedUserPhone,
        VAR3: params.propertyTitle,
      }
    ],
    VAR1: params.userName,
    VAR2: formattedUserPhone,
    VAR3: params.propertyTitle,
  };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && (data.type === "success" || data.status === "success" || data.type !== "error")) {
      return { success: true, messageId: data.message || data.request_id, rawResponse: data };
    }

    console.error("MSG91 Flow SMS error response:", data);
    return { success: false, error: data.message || "Failed to dispatch SMS via MSG91 Flow", rawResponse: data };
  } catch (err: any) {
    console.error("MSG91 Flow SMS network error:", err);
    return { success: false, error: err.message || "Network error while sending SMS", rawResponse: err };
  }
}
