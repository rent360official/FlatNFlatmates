import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getS3Config } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to upload files" },
        { status: 401 }
      );
    }

    const { fileName, fileType, mediaType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName and fileType" },
        { status: 400 }
      );
    }

    const s3Client = getS3Client();
    const config = getS3Config();

    if (!config.bucketName) {
      return NextResponse.json(
        { error: "AWS_S3_BUCKET_NAME is not configured in the system" },
        { status: 500 }
      );
    }

    // Sanitize file name and create a unique S3 key path
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    const folder = mediaType === "video" ? "videos" : "images";
    const s3Key = `properties/${(session.user as any).id}/${folder}/${timestamp}-${uniqueId}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: s3Key,
      ContentType: fileType,
    });

    // Generate presigned PUT URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key: s3Key,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
