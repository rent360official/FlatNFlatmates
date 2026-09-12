const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3Client = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

exports.handler = async (event) => {
  console.log("processImageLambda triggered:", JSON.stringify(event));

  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // Expected key format: raw/images/{propertyId}/{uuid}_{fileName}
    console.log(`Processing image: s3://${bucket}/${rawKey}`);

    const parts = rawKey.split("/");
    // parts: ['raw', 'images', propertyId, '{uuid}_{fileName}']
    const propertyId = parts[2] || "unknown";
    const filePart = parts[3] || "";
    const uuid = filePart.split("_")[0] || filePart;

    const baseProcessedKey = `processed/images/${propertyId}/${uuid}`;
    const processedKeys = {
      thumb: `${baseProcessedKey}-thumb.webp`,
      medium: `${baseProcessedKey}-medium.webp`,
      full: `${baseProcessedKey}-full.webp`,
    };

    const region = process.env.AWS_REGION || "ap-south-1";
    const processedUrls = {
      thumb: `https://${bucket}.s3.${region}.amazonaws.com/${processedKeys.thumb}`,
      medium: `https://${bucket}.s3.${region}.amazonaws.com/${processedKeys.medium}`,
      full: `https://${bucket}.s3.${region}.amazonaws.com/${processedKeys.full}`,
    };

    const appUrl = (process.env.APP_URL || "https://flatnflatmates.in").replace(/\/$/, "");
    const secret = process.env.INTERNAL_MEDIA_SECRET || "flatnflatmates_internal_media_secret_prod_key_2026";

    try {
      // 1. Download raw image from S3
      const getObj = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: rawKey })
      );
      const inputBuffer = await streamToBuffer(getObj.Body);

      // 2. Read metadata & dimensions
      const metadata = await sharp(inputBuffer).metadata();
      const origWidth = metadata.width || 1200;
      const origHeight = metadata.height || 800;

      // 3. Process into 3 WebP sizes with EXIF stripped and without enlargement
      const sizes = [
        { name: "thumb", width: 300 },
        { name: "medium", width: 800 },
        { name: "full", width: 1600 },
      ];

      for (const size of sizes) {
        const outBuffer = await sharp(inputBuffer)
          .rotate() // auto-orient based on EXIF, then strip EXIF
          .resize({ width: size.width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: processedKeys[size.name],
            Body: outBuffer,
            ContentType: "image/webp",
          })
        );
        console.log(`Uploaded processed image size: ${size.name} -> ${processedKeys[size.name]}`);
      }

      // 3.5. Delete raw uncompressed S3 image now that 3 WebP sizes are successfully saved
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: rawKey }));
        console.log(`Successfully deleted raw S3 image: ${rawKey}`);
      } catch (delErr) {
        console.warn(`Could not delete raw S3 image ${rawKey}:`, delErr);
      }

      // 4. Send internal complete webhook back to Next.js API
      const webhookUrl = `${appUrl}/api/internal/media/${uuid}/complete`;
      console.log(`Calling complete webhook: ${webhookUrl}`);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-media-secret": secret,
        },
        body: JSON.stringify({
          propertyId,
          mediaType: "image",
          status: "ready",
          processedKeys,
          processedUrls,
          width: origWidth,
          height: origHeight,
          deleteRaw: true,
        }),
      });

      console.log(`Callback status: ${res.status}`);
    } catch (err) {
      console.error(`Error processing image ${rawKey}:`, err);

      // Report failure back to Next.js API
      try {
        await fetch(`${appUrl}/api/internal/media/${uuid}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-media-secret": secret,
          },
          body: JSON.stringify({
            propertyId,
            mediaType: "image",
            status: "failed",
            error: err.message || "Sharp image processing failed.",
          }),
        });
      } catch (webhookErr) {
        console.error("Failed to notify app of image failure:", webhookErr);
      }
    }
  }

  return { statusCode: 200, body: "Images processed." };
};
