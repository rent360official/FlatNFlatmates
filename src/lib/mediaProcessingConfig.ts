import { getS3Config } from "@/lib/s3";

export const MEDIA_LIMITS = {
  MAX_IMAGE_SIZE_BYTES: 15 * 1024 * 1024, // 15MB
  MAX_VIDEO_SIZE_BYTES: 300 * 1024 * 1024, // 300MB
  MAX_VIDEO_DURATION_SECONDS: 300, // 5 minutes
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
  ALLOWED_VIDEO_EXTENSIONS: [".mp4", ".mov"],
};

export const INTERNAL_MEDIA_SECRET_HEADER = "x-internal-media-secret";

export function getInternalMediaSecret(): string {
  return (
    process.env.INTERNAL_MEDIA_SECRET ||
    "flatnflatmates_internal_media_secret_prod_key_2026"
  );
}

export function buildS3Url(key: string): string {
  const config = getS3Config();
  if (!config.bucketName) return "";
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

export function generateMediaPaths(propertyId: string, fileName: string, mediaType: "image" | "video") {
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  if (mediaType === "image") {
    const rawKey = `raw/images/${propertyId}/${uuid}_${cleanName}`;
    const baseProcessedKey = `processed/images/${propertyId}/${uuid}`;
    const processedKeys = {
      thumb: `${baseProcessedKey}-thumb.webp`,
      medium: `${baseProcessedKey}-medium.webp`,
      full: `${baseProcessedKey}-full.webp`,
    };
    const processedUrls = {
      thumb: buildS3Url(processedKeys.thumb),
      medium: buildS3Url(processedKeys.medium),
      full: buildS3Url(processedKeys.full),
    };
    return {
      uuid,
      rawKey,
      processedKeys,
      processedUrls,
    };
  } else {
    const rawKey = `raw/videos/${propertyId}/${uuid}_${cleanName}`;
    const baseProcessedKey = `processed/videos/${propertyId}/${uuid}`;
    const processedKey = `${baseProcessedKey}-720p.mp4`;
    const thumbnailKey = `${baseProcessedKey}-thumb.jpg`;
    return {
      uuid,
      rawKey,
      processedKey,
      processedUrl: buildS3Url(processedKey),
      thumbnailKey,
      thumbnailUrl: buildS3Url(thumbnailKey),
    };
  }
}
