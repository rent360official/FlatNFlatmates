import dbConnect from "@/lib/db";
import PointOfInterest from "@/models/PointOfInterest";
import SearchWizard from "./SearchWizard";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function FlatsSearchPage({ searchParams }: { searchParams: { locality?: string } }) {
  await dbConnect();
  
  const pois = await PointOfInterest.find({ isActive: true }).sort({ name: 1 }).lean();

  const serializedPois = pois.map((poi: any) => ({
    _id: poi._id.toString(),
    name: poi.name,
    type: poi.type,
    lat: poi.location.coordinates[1],
    lng: poi.location.coordinates[0],
  }));

  return (
    <div className="w-full flex-grow flex flex-col">
      <SearchWizard pois={serializedPois} initialLocality={searchParams?.locality} />
    </div>
  );
}
