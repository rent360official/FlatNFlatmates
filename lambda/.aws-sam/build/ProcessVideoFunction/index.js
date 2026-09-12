const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const execPromise = promisify(exec);
const s3Client = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });

async function downloadS3ToFile(bucket, key, destPath) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(destPath);
    response.Body.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

async function uploadFileToS3(bucket, key, filePath, contentType) {
  const fileStream = fs.createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

// Find ffmpeg binary path (from npm static package, Lambda layer /opt/bin/, or system PATH)
function getBinaryPath(binaryName) {
  try {
    if (binaryName === "ffmpeg") {
      const ffmpegStatic = require("ffmpeg-static");
      if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
    }
  } catch (e) {}

  const layerPath = `/opt/bin/${binaryName}`;
  const localLayerPath = `/opt/${binaryName}`;
  if (fs.existsSync(layerPath)) return layerPath;
  if (fs.existsSync(localLayerPath)) return localLayerPath;
  return binaryName;
}

// Extract video duration in seconds using ffmpeg metadata banner
async function getVideoDuration(ffmpegPath, inputPath) {
  try {
    await execPromise(`"${ffmpegPath}" -i "${inputPath}"`);
    return 0;
  } catch (err) {
    const output = (err.stderr || "") + " " + (err.stdout || "");
    const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
    if (match) {
      const hours = parseInt(match[1], 10) || 0;
      const minutes = parseInt(match[2], 10) || 0;
      const seconds = parseFloat(match[3]) || 0;
      return Math.round(hours * 3600 + minutes * 60 + seconds);
    }
    return 0;
  }
}

exports.handler = async (event) => {
  console.log("processVideoLambda triggered:", JSON.stringify(event));

  const ffmpegPath = getBinaryPath("ffmpeg");

  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log(`Processing video: s3://${bucket}/${rawKey}`);

    const parts = rawKey.split("/");
    // parts: ['raw', 'videos', propertyId, '{uuid}_{fileName}']
    const propertyId = parts[2] || "unknown";
    const filePart = parts[3] || "";
    const uuid = filePart.split("_")[0] || filePart;

    const baseProcessedKey = `processed/videos/${propertyId}/${uuid}`;
    const processedKey = `${baseProcessedKey}-720p.mp4`;
    const thumbnailKey = `${baseProcessedKey}-thumb.jpg`;

    const region = process.env.AWS_REGION || "ap-south-1";
    const processedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${processedKey}`;
    const thumbnailUrl = `https://${bucket}.s3.${region}.amazonaws.com/${thumbnailKey}`;

    const appUrl = (process.env.APP_URL || "https://flatnflatmates.in").replace(/\/$/, "");
    const secret = process.env.INTERNAL_MEDIA_SECRET || "flatnflatmates_internal_media_secret_prod_key_2026";

    const tmpInput = `/tmp/input_${uuid}.mp4`;
    const tmpOutput = `/tmp/output_${uuid}_720p.mp4`;
    const tmpThumb = `/tmp/thumb_${uuid}.jpg`;

    try {
      // 1. Download raw video to Lambda /tmp
      console.log(`Downloading s3://${bucket}/${rawKey} to ${tmpInput}`);
      await downloadS3ToFile(bucket, rawKey, tmpInput);

      // 2. Check video duration <= 300s (5 minutes)
      const durationSeconds = await getVideoDuration(ffmpegPath, tmpInput);
      console.log(`Video duration: ${durationSeconds} seconds`);

      if (durationSeconds > 300) {
        throw new Error(`Video exceeds maximum 5 minute limit (${durationSeconds} seconds).`);
      }

      // 3. Transcode to 720p MP4 (H.264, AAC, 2500k maxrate, faststart for instant web streaming)
      const transcodeCmd = `"${ffmpegPath}" -y -i "${tmpInput}" -vf "scale=-2:720" -c:v libx264 -preset medium -crf 23 -maxrate 2500k -bufsize 5000k -c:a aac -b:a 128k -movflags +faststart "${tmpOutput}"`;
      console.log(`Running transcode: ${transcodeCmd}`);
      await execPromise(transcodeCmd);

      // 4. Extract 2-second poster frame
      const thumbCmd = `"${ffmpegPath}" -y -i "${tmpInput}" -ss 00:00:02 -vframes 1 "${tmpThumb}"`;
      console.log(`Extracting thumbnail: ${thumbCmd}`);
      await execPromise(thumbCmd);

      // 5. Upload 720p MP4 and thumbnail to S3 under processed/
      console.log(`Uploading processed video -> ${processedKey}`);
      await uploadFileToS3(bucket, processedKey, tmpOutput, "video/mp4");

      console.log(`Uploading video thumbnail -> ${thumbnailKey}`);
      await uploadFileToS3(bucket, thumbnailKey, tmpThumb, "image/jpeg");

      // 6. Call complete callback endpoint
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
          mediaType: "video",
          status: "ready",
          processedKey,
          processedUrl,
          thumbnailKey,
          thumbnailUrl,
          durationSeconds,
          deleteRaw: true,
        }),
      });

      console.log(`Callback status: ${res.status}`);
    } catch (err) {
      console.error(`Error processing video ${rawKey}:`, err);

      try {
        await fetch(`${appUrl}/api/internal/media/${uuid}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-media-secret": secret,
          },
          body: JSON.stringify({
            propertyId,
            mediaType: "video",
            status: "failed",
            error: err.message || "FFmpeg video transcode failed.",
          }),
        });
      } catch (webhookErr) {
        console.error("Failed to notify app of video failure:", webhookErr);
      }
    } finally {
      // 7. Cleanup temp files in /tmp
      [tmpInput, tmpOutput, tmpThumb].forEach((file) => {
        if (fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (e) {}
        }
      });
    }
  }

  return { statusCode: 200, body: "Videos processed." };
};
