import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { uploadProfilePhotoToS3, deleteProfilePhotoFromS3 } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let buffer: Buffer;
    let contentType = "image/webp";
    let extension = "webp";

    const contentTypeHeader = req.headers.get("content-type") || "";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = file.type || "image/webp";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        extension = "jpg";
      } else if (contentType.includes("png")) {
        extension = "png";
      }
    } else {
      const body = await req.json();
      const { imageBase64 } = body;
      if (!imageBase64) {
        return NextResponse.json({ error: "No image data provided." }, { status: 400 });
      }

      // Extract base64 payload
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
        if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          extension = "jpg";
        } else if (contentType.includes("png")) {
          extension = "png";
        }
      } else {
        buffer = Buffer.from(imageBase64, "base64");
      }
    }

    if (buffer.length > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size exceeds 25MB limit." }, { status: 400 });
    }

    const key = `profiles/${userId}-${Date.now()}.${extension}`;
    const s3Url = await uploadProfilePhotoToS3(key, buffer, contentType);

    // If user previously had an S3 profile photo, delete old object in background
    if (user.profilePhoto && user.profilePhoto.includes("amazonaws.com/profiles/")) {
      const oldKey = user.profilePhoto.split(".amazonaws.com/")[1];
      if (oldKey) {
        deleteProfilePhotoFromS3(oldKey).catch((e) =>
          console.error("Failed to delete old profile photo from S3:", e)
        );
      }
    }

    user.profilePhoto = s3Url;
    await user.save();

    return NextResponse.json({
      success: true,
      profilePhoto: s3Url,
      message: "Profile photo updated successfully!",
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload profile photo." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.profilePhoto && user.profilePhoto.includes("amazonaws.com/profiles/")) {
      const oldKey = user.profilePhoto.split(".amazonaws.com/")[1];
      if (oldKey) {
        deleteProfilePhotoFromS3(oldKey).catch((e) =>
          console.error("Failed to delete old profile photo from S3:", e)
        );
      }
    }

    user.profilePhoto = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile photo removed successfully!",
    });
  } catch (error: any) {
    console.error("Error deleting profile photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove profile photo." },
      { status: 500 }
    );
  }
}
