import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getS3Config } from "@/lib/s3";
import { MEDIA_LIMITS, generateMediaPaths } from "@/lib/mediaProcessingConfig";
import { getMediaUploadConfig } from "@/lib/mediaConfig";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to upload files" },
        { status: 401 }
      );
    }

    const { fileName, fileType, mediaType, fileSize, propertyId } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName and fileType" },
        { status: 400 }
      );
    }

    const type: "image" | "video" = mediaType === "video" ? "video" : "image";

    // Validate file extensions
    const ext = "." + fileName.split(".").pop()?.toLowerCase();
    if (type === "image") {
      if (!MEDIA_LIMITS.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          {
            error: `Invalid image format. Allowed formats: ${MEDIA_LIMITS.ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
          },
          { status: 400 }
        );
      }
    } else {
      if (!MEDIA_LIMITS.ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          {
            error: `Invalid video format. Allowed formats: ${MEDIA_LIMITS.ALLOWED_VIDEO_EXTENSIONS.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate size against admin configured limits and system ceiling
    const limits = await getMediaUploadConfig();
    if (fileSize && typeof fileSize === "number") {
      if (type === "video") {
        const maxBytes = Math.min(
          limits.maxVideoSizeMb * 1024 * 1024,
          MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES
        );
        if (fileSize > maxBytes) {
          return NextResponse.json(
            { error: `Video size exceeds the maximum allowed limit of ${Math.round(maxBytes / (1024 * 1024))} MB.` },
            { status: 400 }
          );
        }
      } else {
        const maxBytes = Math.min(
          limits.maxImageSizeMb * 1024 * 1024,
          MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES
        );
        if (fileSize > maxBytes) {
          return NextResponse.json(
            { error: `Image size exceeds the maximum allowed limit of ${Math.round(maxBytes / (1024 * 1024))} MB.` },
            { status: 400 }
          );
        }
      }
    }

    const s3Client = getS3Client();
    const config = getS3Config();

    if (!config.bucketName) {
      return NextResponse.json(
        { error: "AWS_S3_BUCKET_NAME is not configured in the system" },
        { status: 500 }
      );
    }

    const targetPropertyId = propertyId || (session.user as any).id || "temp";
    const mediaPaths = generateMediaPaths(targetPropertyId, fileName, type);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: mediaPaths.rawKey,
      ContentType: fileType,
    });

    // Generate presigned PUT URL valid for 1 hour (supports up to 5GB video uploads)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${mediaPaths.rawKey}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      rawKey: mediaPaths.rawKey,
      mediaId: mediaPaths.uuid,
      type,
      status: "processing",
      processedUrls: (mediaPaths as any).processedUrls,
      processedUrl: (mediaPaths as any).processedUrl,
      thumbnailUrl: (mediaPaths as any).thumbnailUrl,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating upload credentials. Please try again later." },
      { status: 500 }
    );
  }
}
