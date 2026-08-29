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
