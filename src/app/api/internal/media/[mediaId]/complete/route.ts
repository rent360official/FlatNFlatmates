import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import {
  INTERNAL_MEDIA_SECRET_HEADER,
  getInternalMediaSecret,
} from "@/lib/mediaProcessingConfig";
import { deleteS3Object } from "@/lib/s3";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { mediaId: string } }
) {
  try {
    const secretHeader = req.headers.get(INTERNAL_MEDIA_SECRET_HEADER);
    const expectedSecret = getInternalMediaSecret();

    if (!secretHeader || secretHeader !== expectedSecret) {
      return NextResponse.json(
        { error: "Forbidden: Invalid or missing internal media authorization secret." },
        { status: 403 }
      );
    }

    const { mediaId } = params;
    const body = await req.json();

    const {
      propertyId,
      mediaType,
      status,
      error: errorMessage,
      processedKeys,
      processedUrls,
      width,
      height,
      processedKey,
      processedUrl,
      thumbnailKey,
      thumbnailUrl,
      durationSeconds,
      deleteRaw = true,
    } = body;

    if (!status || (status !== "ready" && status !== "failed")) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'ready' or 'failed'." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Query property by propertyId if provided, or search by subdocument ID / rawKey containing mediaId
    let query: any = {};
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      query._id = propertyId;
    } else {
      query = {
        $or: [
          { "images._id": mediaId },
          { "images.rawKey": { $regex: mediaId } },
          { "videos._id": mediaId },
          { "videos.rawKey": { $regex: mediaId } },
        ],
      };
    }

    const property = await Property.findOne(query);
    if (!property) {
      return NextResponse.json(
        { error: "Property document matching media ID not found." },
        { status: 404 }
      );
    }

    let updated = false;
    let rawKeyToDelete: string | undefined = undefined;

    // Try updating image subdocument
    if (mediaType === "image" || (!mediaType && property.images?.length > 0)) {
      const imgIdx = property.images.findIndex(
        (img: any) =>
          img._id?.toString() === mediaId ||
          img.rawKey?.includes(mediaId) ||
          img.fileName === mediaId
      );

      if (imgIdx !== -1) {
        const img = property.images[imgIdx];
        img.status = status;
        img.error = errorMessage || null;
        img.updatedAt = new Date();

        if (status === "ready") {
          if (processedKeys) img.processedKeys = processedKeys;
          if (processedUrls) {
            img.processedUrls = processedUrls;
            img.url = processedUrls.medium || processedUrls.full || img.url;
          }
          if (width) img.width = width;
          if (height) img.height = height;
          rawKeyToDelete = img.rawKey;
        }

        updated = true;
      }
    }

    // Try updating video subdocument
    if (!updated && (mediaType === "video" || (property.videos && property.videos.length > 0))) {
      const vidIdx = (property.videos || []).findIndex(
        (vid: any) =>
          vid._id?.toString() === mediaId ||
          vid.rawKey?.includes(mediaId) ||
          vid.fileName === mediaId
      );

      if (vidIdx !== -1 && property.videos) {
        const vid = property.videos[vidIdx];
        vid.status = status;
        vid.error = errorMessage || null;
        vid.updatedAt = new Date();

        if (status === "ready") {
          if (processedKey) vid.processedKey = processedKey;
          if (processedUrl) {
            vid.processedUrl = processedUrl;
            vid.url = processedUrl;
          }
          if (thumbnailKey) vid.thumbnailKey = thumbnailKey;
          if (thumbnailUrl) vid.thumbnailUrl = thumbnailUrl;
          if (durationSeconds) vid.durationSeconds = durationSeconds;
          rawKeyToDelete = vid.rawKey;
        }

        updated = true;
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Matching media subdocument could not be located on property." },
        { status: 404 }
      );
    }

    await property.save();

    // Optionally cleanup raw upload to optimize S3 storage costs after successful processing
    if (deleteRaw && status === "ready" && rawKeyToDelete) {
      deleteS3Object(rawKeyToDelete).catch((err) =>
        console.error(`Failed cleaning raw S3 key ${rawKeyToDelete}:`, err)
      );
    }

    return NextResponse.json({
      success: true,
      mediaId,
      status,
      propertyId: property._id.toString(),
    });
  } catch (error: any) {
    console.error("Internal media complete callback error:", error);
    return NextResponse.json(
      { error: "Internal server error during media completion callback." },
      { status: 500 }
    );
  }
}
