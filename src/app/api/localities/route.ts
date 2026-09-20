export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Locality from '@/models/Locality';
import City from '@/models/City';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get('city') || 'Pune';

    let filter: any = { isActive: true };

    if (cityName) {
      const city = await City.findOne({ name: new RegExp(`^${cityName}$`, 'i'), isActive: true }).lean();
      if (city) {
        filter.cityId = city._id;
      }
    }

    const localities = await Locality.find(filter)
      .select('_id name location isActive')
      .sort({ name: 1 })
      .lean();

    const formatted = localities.map((loc: any) => ({
      _id: loc._id.toString(),
      name: loc.name,
      lat: loc.location?.coordinates ? loc.location.coordinates[1] : undefined,
      lng: loc.location?.coordinates ? loc.location.coordinates[0] : undefined,
    }));

    return NextResponse.json({
      success: true,
      localities: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching registered localities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registered localities' },
      { status: 500 }
    );
  }
}
