'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import City from "@/models/City";
import Locality from "@/models/Locality";
import PointOfInterest from "@/models/PointOfInterest";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

async function getAdminActor() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = ['super_admin', 'ops_admin', 'support_agent', 'moderator'].includes(role);
  if (!session || !isAdmin) {
    throw new Error("Unauthorized: Access restricted to administrators");
  }
  return session.user as any;
}

export async function createCity(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const name = formData.get("name") as string;
    const state = formData.get("state") as string;

    if (!name || !state) throw new Error("City name and state are required");

    await dbConnect();
    const city = await City.create({ name, state, isActive: true });
    
    await logAdminAction({
      actorId: actor.id,
      action: "create_city",
      entityType: "City",
      entityId: city._id,
      afterState: city.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create city" };
  }
}

export async function deleteCity(cityId: string) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    // Check if localities exist under this city
    const localityCount = await Locality.countDocuments({ cityId });
    if (localityCount > 0) {
      throw new Error("Cannot delete city. Move or delete its localities first.");
    }

    const city = await City.findByIdAndDelete(cityId);
    if (!city) throw new Error("City not found");

    await logAdminAction({
      actorId: actor.id,
      action: "delete_city",
      entityType: "City",
      entityId: city._id,
      beforeState: city.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete city" };
  }
}

export async function createLocality(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const cityId = formData.get("cityId") as string;
    const name = formData.get("name") as string;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);

    if (!cityId || !name || isNaN(lat) || isNaN(lng)) {
      throw new Error("City, locality name, and coordinates (lat/lng) are required");
    }

    await dbConnect();
    const locality = await Locality.create({
      cityId,
      name,
      location: {
        type: "Point",
        coordinates: [lng, lat], // [longitude, latitude]
      },
      isActive: true,
    });

    await logAdminAction({
      actorId: actor.id,
      action: "create_locality",
      entityType: "Locality",
      entityId: locality._id,
      afterState: locality.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create locality" };
  }
}

export async function deleteLocality(localityId: string) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    // Check if POIs or properties exist under this locality
    const poiCount = await PointOfInterest.countDocuments({ localityId });
    if (poiCount > 0) {
      throw new Error("Cannot delete locality. Delete its attached Points of Interest first.");
    }

    const locality = await Locality.findByIdAndDelete(localityId);
    if (!locality) throw new Error("Locality not found");

    await logAdminAction({
      actorId: actor.id,
      action: "delete_locality",
      entityType: "Locality",
      entityId: locality._id,
      beforeState: locality.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete locality" };
  }
}

export async function createPOI(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const cityId = formData.get("cityId") as string;
    const localityId = formData.get("localityId") as string || undefined;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);

    if (!cityId || !name || !type || isNaN(lat) || isNaN(lng)) {
      throw new Error("City, name, category, and coordinates (lat/lng) are required");
    }

    await dbConnect();
    const poi = await PointOfInterest.create({
      cityId,
      localityId,
      name,
      type: type as any,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      isActive: true,
    });

    await logAdminAction({
      actorId: actor.id,
      action: "create_poi",
      entityType: "PointOfInterest",
      entityId: poi._id,
      afterState: poi.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create Point of Interest" };
  }
}

export async function deletePOI(poiId: string) {
  try {
    const actor = await getAdminActor();
    await dbConnect();

    const poi = await PointOfInterest.findByIdAndDelete(poiId);
    if (!poi) throw new Error("Point of Interest not found");

    await logAdminAction({
      actorId: actor.id,
      action: "delete_poi",
      entityType: "PointOfInterest",
      entityId: poi._id,
      beforeState: poi.toObject(),
    });

    revalidatePath("/admin/cities");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete Point of Interest" };
  }
}
