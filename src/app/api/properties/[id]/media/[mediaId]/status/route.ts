import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const { id: propertyId, mediaId } = params;

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // Look for matching image
    const image = (property.images || []).find(
      (img: any) =>
        img._id?.toString() === mediaId ||
        img.rawKey?.includes(mediaId) ||
        img.fileName === mediaId
    );

    if (image) {
      return NextResponse.json({
        mediaId,
        type: "image",
        status: image.status || "ready",
        processedKeys: image.processedKeys,
        processedUrls: image.processedUrls,
        url: image.processedUrls?.medium || image.url,
        error: image.error || null,
        width: image.width,
        height: image.height,
      });
    }

    // Look for matching video
    const video = (property.videos || []).find(
      (vid: any) =>
        vid._id?.toString() === mediaId ||
        vid.rawKey?.includes(mediaId) ||
        vid.fileName === mediaId
    );

    if (video) {
      return NextResponse.json({
        mediaId,
        type: "video",
        status: video.status || "ready",
        processedKey: video.processedKey,
        processedUrl: video.processedUrl || video.url,
        thumbnailKey: video.thumbnailKey,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
        error: video.error || null,
      });
    }

    return NextResponse.json(
      { error: "Media item not found on this property." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error retrieving media status:", error);
    return NextResponse.json(
      { error: "Internal server error fetching media status." },
      { status: 500 }
    );
  }
}
