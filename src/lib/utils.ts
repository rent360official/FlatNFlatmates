import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyErrorMessage(error: any, fallback: string = "An unexpected error occurred. Please try again later.") {
  if (!error) return fallback;
  const msg = typeof error === 'string' ? error : (error.message || "");
  
  const isSafe = msg.startsWith("Unauthorized:") || 
                 msg.startsWith("Forbidden:") || 
                 msg.includes("not found") || 
                 msg.includes("required") || 
                 msg.includes("already completed") || 
                 msg.includes("Invalid verification") ||
                 msg.includes("already released") ||
                 msg.includes("already verified") ||
                 msg.includes("already registered");

  if (isSafe) {
    return msg;
  }
  
  return fallback;
}

export const TENANT_PREFERENCE_OPTIONS = [
  { id: 'family', label: 'Families' },
  { id: 'bachelors', label: 'Bachelors' },
  { id: 'girls', label: 'Girls Only' },
  { id: 'boys', label: 'Boys Only' },
  { id: 'any', label: 'Any / No Preference' },
] as const;

export function formatTenantPreference(pref: string[] | string | undefined | null): string {
  if (!pref) return 'Any';
  const list = Array.isArray(pref) ? pref : [pref];
  if (list.length === 0) return 'Any';
  if (list.includes('any') && list.length === 1) return 'Any';

  const labelMap: Record<string, string> = {
    any: 'Any',
    family: 'Family',
    bachelors: 'Bachelors',
    girls: 'Girls Only',
    boys: 'Boys Only',
  };

  return list
    .map((p) => labelMap[p] || (typeof p === 'string' ? p.charAt(0).toUpperCase() + p.slice(1) : String(p)))
    .join(', ');
}

