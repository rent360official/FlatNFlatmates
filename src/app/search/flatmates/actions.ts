'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";

export interface UserListedPropertySummary {
  _id: string;
  title: string;
  localityName?: string;
  address?: string;
  bhkConfig?: string;
  rentAmount?: number;
  lat?: number;
  lng?: number;
}

export async function getMyListedProperties(): Promise<{
  success: boolean;
  properties: UserListedPropertySummary[];
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, properties: [] };
    }

    const sessionUser = session.user as any;
    if (!sessionUser.id) {
      return { success: false, properties: [] };
    }

    await dbConnect();

    const properties = await Property.find({
      ownerId: sessionUser.id,
      status: { $in: ['active', 'paused', 'pending_owner_approval', 'draft'] },
    })
      .select('_id title localityName location bhkConfig rentAmount address')
      .lean();

    const serialized: UserListedPropertySummary[] = properties.map((p: any) => ({
      _id: p._id.toString(),
      title: p.title || `${p.bhkConfig || 'Flat'} in ${p.localityName || 'Pune'}`,
      localityName: p.localityName || '',
      address: p.address || '',
      bhkConfig: p.bhkConfig || '',
      rentAmount: p.rentAmount || 0,
      lat: p.location?.coordinates ? p.location.coordinates[1] : undefined,
      lng: p.location?.coordinates ? p.location.coordinates[0] : undefined,
    }));

    return { success: true, properties: serialized };
  } catch (error) {
    console.error("Error fetching user listed properties:", error);
    return { success: false, properties: [] };
  }
}
