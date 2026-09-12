import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { deleteS3Objects } from "@/lib/s3";
import mongoose from "mongoose";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const { id: propertyId, mediaId } = params;

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

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

    const s3KeysToDelete: string[] = [];

    // Check images
    const imgIndex = property.images.findIndex(
      (img: any) =>
        img._id?.toString() === mediaId ||
        img.rawKey?.includes(mediaId) ||
        img.fileName === mediaId
    );

    if (imgIndex !== -1) {
      const img = property.images[imgIndex];
      if (img.rawKey) s3KeysToDelete.push(img.rawKey);
      if (img.processedKeys?.thumb) s3KeysToDelete.push(img.processedKeys.thumb);
      if (img.processedKeys?.medium) s3KeysToDelete.push(img.processedKeys.medium);
      if (img.processedKeys?.full) s3KeysToDelete.push(img.processedKeys.full);

      property.images.splice(imgIndex, 1);
      await property.save();

      // Clean S3 objects
      deleteS3Objects(s3KeysToDelete).catch((err) =>
        console.error("Failed cleaning deleted image S3 objects:", err)
      );

      return NextResponse.json({
        success: true,
        message: "Image deleted successfully.",
        mediaId,
      });
    }

    // Check videos
    const vidIndex = (property.videos || []).findIndex(
      (vid: any) =>
        vid._id?.toString() === mediaId ||
        vid.rawKey?.includes(mediaId) ||
        vid.fileName === mediaId
    );

    if (vidIndex !== -1) {
      const vid = property.videos![vidIndex];
      if (vid.rawKey) s3KeysToDelete.push(vid.rawKey);
      if (vid.processedKey) s3KeysToDelete.push(vid.processedKey);
      if (vid.thumbnailKey) s3KeysToDelete.push(vid.thumbnailKey);

      property.videos!.splice(vidIndex, 1);
      await property.save();

      // Clean S3 objects
      deleteS3Objects(s3KeysToDelete).catch((err) =>
        console.error("Failed cleaning deleted video S3 objects:", err)
      );

      return NextResponse.json({
        success: true,
        message: "Video deleted successfully.",
        mediaId,
      });
    }

    return NextResponse.json(
      { error: "Media item not found on property." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error deleting property media:", error);
    return NextResponse.json(
      { error: "Internal server error during media deletion." },
      { status: 500 }
    );
  }
}
