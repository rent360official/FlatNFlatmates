import dbConnect from "@/lib/db";
import FeatureFlag from "@/models/FeatureFlag";

export interface MediaUploadConfig {
  maxPropertyVideos: number;
  maxVideoSizeMb: number;
  maxPropertyImages: number;
  maxImageSizeMb: number;
}

export const DEFAULT_MEDIA_CONFIG: MediaUploadConfig = {
  maxPropertyVideos: 5,
  maxVideoSizeMb: 100,
  maxPropertyImages: 10,
  maxImageSizeMb: 10,
};

/**
 * Retrieves media upload limits from database feature flags or defaults.
 */
export async function getMediaUploadConfig(): Promise<MediaUploadConfig> {
  try {
    await dbConnect();

    const flags = await FeatureFlag.find({
      key: {
        $in: [
          "max_property_videos",
          "max_video_size_mb",
          "max_property_images",
          "max_image_size_mb",
        ],
      },
    }).lean();

    const config: MediaUploadConfig = { ...DEFAULT_MEDIA_CONFIG };

    for (const flag of flags) {
      const val = typeof flag.value === "number" ? flag.value : parseInt(flag.value, 10);
      if (!isNaN(val) && val > 0) {
        if (flag.key === "max_property_videos") config.maxPropertyVideos = val;
        if (flag.key === "max_video_size_mb") config.maxVideoSizeMb = val;
        if (flag.key === "max_property_images") config.maxPropertyImages = val;
        if (flag.key === "max_image_size_mb") config.maxImageSizeMb = val;
      }
    }

    return config;
  } catch (err) {
    console.error("Error loading media upload config, using defaults:", err);
    return DEFAULT_MEDIA_CONFIG;
  }
}
