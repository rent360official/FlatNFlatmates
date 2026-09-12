import dbConnect from "@/lib/db";
import PointOfInterest from "@/models/PointOfInterest";
import FlatmateSearchWizard from "./FlatmateSearchWizard";
import { getActiveFacebookGroups } from "@/lib/facebookGroups";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function FlatmatesSearchPage() {
  await dbConnect();
  
  const pois = await PointOfInterest.find({ isActive: true }).sort({ name: 1 }).lean();
  const facebookGroups = await getActiveFacebookGroups();

  const serializedPois = pois.map((poi: any) => ({
    _id: poi._id.toString(),
    name: poi.name,
    type: poi.type,
    lat: poi.location.coordinates[1],
    lng: poi.location.coordinates[0],
  }));

  return (
    <div className="w-full flex-grow flex flex-col">
      <FlatmateSearchWizard
        pois={serializedPois}
        facebookGroups={facebookGroups}
      />
    </div>
  );
}
