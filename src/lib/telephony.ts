function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91${clean}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+${clean}`;
}

export async function sendVerificationToken(phone: string): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  if (provider === "mock") {
    return { success: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return { success: false, error: "Twilio Verify config is missing in environment variables" };
  }

  const targetPhone = formatPhoneNumber(phone);
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: targetPhone,
        Channel: 'sms',
      }).toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Twilio Verify Send failed:", errText);
      return { success: false, error: "Failed to send verification SMS. Verify the number is registered/whitelisted on Twilio." };
    }

    const data = await res.json();
    return { success: data.status === "pending" };
  } catch (err: any) {
    console.error("Twilio Verify Send network error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkVerificationToken(phone: string, code: string): Promise<{ approved: boolean; error?: string }> {
  const provider = process.env.TELEPHONY_PROVIDER || "mock";
  if (provider === "mock") {
    return { approved: false, error: "Cannot check mock token via Twilio API" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return { approved: false, error: "Twilio Verify config is missing in environment variables" };
  }

  const targetPhone = formatPhoneNumber(phone);
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: targetPhone,
        Code: code,
      }).toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Twilio Verify Check failed:", errText);
      return { approved: false, error: "Verification check failed. Please check the code." };
    }

    const data = await res.json();
    return { approved: data.status === "approved" };
  } catch (err: any) {
    console.error("Twilio Verify Check network error:", err);
    return { approved: false, error: err.message };
  }
}
