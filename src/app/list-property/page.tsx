import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Locality from "@/models/Locality";
import ListingWizard from "./ListingWizard";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function ListPropertyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/list-property");
  }

  await dbConnect();
  const localities = await Locality.find({ isActive: true }).sort({ name: 1 }).lean();

  // Serialize localities for client component props
  const serializedLocalities = localities.map((loc: any) => ({
    _id: loc._id.toString(),
    name: loc.name,
    lat: loc.location?.coordinates[1] || 18.5597,
    lng: loc.location?.coordinates[0] || 73.7922,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full flex flex-col justify-center">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          List Your Property in Pune
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          Complete our multi-step wizard to list your flat or room share and find verified tenants or compatible flatmates.
        </p>
      </div>

      <ListingWizard localities={serializedLocalities} />
    </div>
  );
}
