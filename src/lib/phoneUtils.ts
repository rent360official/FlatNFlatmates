/**
 * Phone formatting utilities for Indian phone numbers (E.164 and MSG91 format)
 * Safe to use in both Client Components and Server Components.
 */

export function formatMsg91Phone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `91${clean}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean;
  }
  if (clean.startsWith('0') && clean.length === 11) {
    return `91${clean.slice(1)}`;
  }
  return clean;
}

export function formatE164Phone(phone: string): string {
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

/**
 * Strict Indian mobile number validation
 * Validates 10-digit format starting with 6, 7, 8, or 9
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const clean = getClean10DigitMobile(phone);
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Extracts clean 10-digit mobile number by stripping +91, 91, leading 0, and non-digits
 */
export function getClean10DigitMobile(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.slice(1);
  }
  return clean;
}

