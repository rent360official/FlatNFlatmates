import { uploadBufferToS3, getObjectBuffer } from "@/lib/s3";
import { getInternalMediaSecret } from "@/lib/mediaProcessingConfig";

/**
 * Local/Fallback processor helper to trigger completion webhook or process directly.
 */
export async function notifyMediaCompletion(params: {
  mediaId: string;
  propertyId?: string;
  mediaType: "image" | "video";
  status: "ready" | "failed";
  error?: string;
  processedKeys?: { thumb: string; medium: string; full: string };
  processedUrls?: { thumb: string; medium: string; full: string };
  width?: number;
  height?: number;
  processedKey?: string;
  processedUrl?: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  deleteRaw?: boolean;
}) {
  const secret = getInternalMediaSecret();
  const appUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  
  try {
    const res = await fetch(`${appUrl}/api/internal/media/${params.mediaId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-media-secret": secret,
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to call internal completion webhook:", err);
    throw err;
  }
}
