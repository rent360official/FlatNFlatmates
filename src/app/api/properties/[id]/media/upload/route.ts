import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { uploadBufferToS3 } from "@/lib/s3";
import { MEDIA_LIMITS, generateMediaPaths, buildS3Url } from "@/lib/mediaProcessingConfig";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to upload media." },
        { status: 401 }
      );
    }

    const propertyId = params.id;
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property ID provided." },
        { status: 400 }
      );
    }

    await dbConnect();
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    // Verify ownership or admin role
    const sessionUserId = (session.user as any).id;
    const sessionUserRole = (session.user as any).role;
    if (
      property.ownerId.toString() !== sessionUserId &&
      sessionUserRole !== "admin" &&
      sessionUserRole !== "superadmin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this listing." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mediaType = (formData.get("mediaType") as string) || "image";
    const isCover = formData.get("isCover") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "Missing file payload in request." },
        { status: 400 }
      );
    }

    const type = mediaType === "video" ? "video" : "image";
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    // Validation
    if (type === "image") {
      if (!MEDIA_LIMITS.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid image format (${ext}). Allowed: ${MEDIA_LIMITS.ALLOWED_IMAGE_EXTENSIONS.join(", ")}` },
          { status: 400 }
        );
      }
      if (file.size > MEDIA_LIMITS.MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Image exceeds maximum allowed size of 15 MB.` },
          { status: 400 }
        );
      }
    } else {
      if (!MEDIA_LIMITS.ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid video format (${ext}). Allowed: ${MEDIA_LIMITS.ALLOWED_VIDEO_EXTENSIONS.join(", ")}` },
          { status: 400 }
        );
      }
      if (file.size > MEDIA_LIMITS.MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Video exceeds maximum allowed size of 300 MB.` },
          { status: 400 }
        );
      }
    }

    // Generate S3 paths
    const paths = generateMediaPaths(propertyId, file.name, type);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload raw file to S3 under raw/ prefix
    const rawUrl = await uploadBufferToS3(paths.rawKey, buffer, file.type || "application/octet-stream");

    // Add subdocument to Property in MongoDB with status: "processing"
    const mediaId = new mongoose.Types.ObjectId();

    if (type === "image") {
      const newImage = {
        _id: mediaId,
        url: rawUrl,
        isCover,
        fileName: file.name,
        type: "image",
        status: "processing",
        rawKey: paths.rawKey,
        processedKeys: (paths as any).processedKeys,
        processedUrls: (paths as any).processedUrls,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      property.images.push(newImage as any);
    } else {
      const newVideo = {
        _id: mediaId,
        url: rawUrl,
        fileName: file.name,
        sizeBytes: file.size,
        type: "video",
        status: "processing",
        rawKey: paths.rawKey,
        processedKey: (paths as any).processedKey,
        processedUrl: (paths as any).processedUrl,
        thumbnailKey: (paths as any).thumbnailKey,
        thumbnailUrl: (paths as any).thumbnailUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!property.videos) property.videos = [];
      property.videos.push(newVideo as any);
    }

    await property.save();

    return NextResponse.json({
      mediaId: mediaId.toString(),
      status: "processing",
      rawKey: paths.rawKey,
      url: rawUrl,
      type,
    });
  } catch (error: any) {
    console.error("Direct media upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process media upload." },
      { status: 500 }
    );
  }
}
