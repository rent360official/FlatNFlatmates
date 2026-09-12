import { sendMsg91Otp, verifyMsg91Otp, verifyMsg91AccessToken, formatMsg91Phone, formatE164Phone } from "./msg91";

export function formatPhoneNumber(phone: string): string {
  return formatE164Phone(phone);
}

export async function sendVerificationToken(phone: string): Promise<{ success: boolean; error?: string }> {
  const res = await sendMsg91Otp(phone);
  return { success: res.success, error: res.error };
}

export async function checkVerificationToken(phone: string, code: string): Promise<{ approved: boolean; error?: string }> {
  const res = await verifyMsg91Otp(phone, code);
  return { approved: res.approved, error: res.error };
}

export { verifyMsg91AccessToken, verifyMsg91Otp, sendMsg91Otp, formatMsg91Phone, formatE164Phone };

