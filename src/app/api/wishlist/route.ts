import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import "@/models/Locality";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Filter valid MongoDB ObjectIDs
    const validIds = ids.filter((id) => typeof id === "string" && id.length === 24);

    const properties = await Property.find({
      _id: { $in: validIds },
      status: "active",
    })
      .populate("localityId", "name")
      .lean();

    return NextResponse.json({ success: true, data: properties });
  } catch (err: any) {
    console.error("Failed to fetch wishlisted properties:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: true, data: [] });
    }

    const ids = idsParam.split(",").map((s) => s.trim()).filter((id) => id.length === 24);

    const properties = await Property.find({
      _id: { $in: ids },
      status: "active",
    })
      .populate("localityId", "name")
      .lean();

    return NextResponse.json({ success: true, data: properties });
  } catch (err: any) {
    console.error("Failed to fetch wishlisted properties:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
