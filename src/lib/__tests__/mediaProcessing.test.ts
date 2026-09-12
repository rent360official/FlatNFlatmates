import assert from "node:assert";
import { generateMediaPaths, MEDIA_LIMITS, getInternalMediaSecret } from "@/lib/mediaProcessingConfig";

export function runMediaProcessingTests() {
  // Test Image Paths
  const imgPaths = generateMediaPaths("prop_123", "living-room.jpg", "image");
  assert.match(imgPaths.rawKey, /^raw\/images\/prop_123\/.*_living-room\.jpg$/);
  assert.ok((imgPaths as any).processedKeys?.thumb);
  assert.ok((imgPaths as any).processedKeys?.medium);
  assert.ok((imgPaths as any).processedKeys?.full);

  // Test Video Paths
  const vidPaths = generateMediaPaths("prop_456", "tour.mp4", "video");
  assert.match(vidPaths.rawKey, /^raw\/videos\/prop_456\/.*_tour\.mp4$/);
  assert.ok((vidPaths as any).processedKey);
  assert.ok((vidPaths as any).thumbnailKey);

  // Test Limits
  assert.strictEqual(MEDIA_LIMITS.MAX_VIDEO_DURATION_SECONDS, 300);
  assert.strictEqual(MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES, 15 * 1024 * 1024);
  assert.strictEqual(MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES, 300 * 1024 * 1024);
  assert.deepStrictEqual(MEDIA_LIMITS.ALLOWED_IMAGE_EXTENSIONS, [".jpg", ".jpeg", ".png", ".webp"]);
  assert.deepStrictEqual(MEDIA_LIMITS.ALLOWED_VIDEO_EXTENSIONS, [".mp4", ".mov"]);

  // Test Secret
  const secret = getInternalMediaSecret();
  assert.strictEqual(typeof secret, "string");
  assert.ok(secret.length > 10);
}
