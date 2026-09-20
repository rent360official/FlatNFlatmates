import React from "react";
import Link from "next/link";
import { ShieldCheck, HeartHandshake, Compass, Users, Sparkles, Building2, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import dbConnect from "@/lib/db";
import Locality from "@/models/Locality";
import City from "@/models/City";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | FlatNFlatmates.in Pune",
  description: "Learn about FlatNFlatmates.in - Pune's premier flat and flatmate search platform with lifestyle compatibility matching.",
};

export default async function AboutPage() {
  await dbConnect();

  let registeredLocalities: string[] = [];
  try {
    const puneCity = await City.findOne({ name: new RegExp("^pune$", "i"), isActive: true }).lean();
    const filter: any = { isActive: true };
    if (puneCity) {
      filter.cityId = puneCity._id;
    }
    const docs = await Locality.find(filter).select("name").sort({ name: 1 }).lean();
    registeredLocalities = docs.map((d: any) => d.name);
  } catch (err) {
    console.error("Failed to load registered localities on about page:", err);
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Pune's Flat & Flatmate Discovery Platform
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Renting in Pune, Reimagined for Students & Professionals.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            FlatNFlatmates is built with one mission: to connect like-minded individuals with verified flats and compatible flatmates across Pune's top hubs.
          </p>
        </div>
      </section>

      {/* Core Mission & Pillars */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-[#0F7A5C]/10 text-[#0F7A5C] flex items-center justify-center font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Direct & Verified Discovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Connect directly with verified property owners, flatmates, and authorized listers with complete transparency and verified local details.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Lifestyle Compatibility</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A flat is only as good as the people you live with. Our algorithmic tenant fit evaluates habits, work shifts, food preferences, and cleanliness to match compatible roommates.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Commute Proximity</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Search by travel time to your exact workplace or college—whether Hinjewadi IT Park, EON Kharadi, Magarpatta, Symbiosis, or COEP—with live commute distance and time mapping.
            </p>
          </div>
        </div>

        {/* Detailed Story Section */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Why We Started FlatNFlatmates.in
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            <p>
              Pune welcomes over 200,000 students and IT professionals every year. Yet, the traditional rental experience has remained frustrating: outdated listings, complicated processes, and zero visibility into who you will share a home with.
            </p>
            <p>
              We envisioned a tech-first marketplace that brings transparency, privacy, and community to Pune renting. Whether you are an owner listing a vacant apartment, a tenant looking for someone to fill an extra bedroom, or a newcomer seeking a flatmate with similar habits, FlatNFlatmates makes the process safe and effortless.
            </p>
          </div>
        </div>

        {/* Localities Covered (Registered in Admin Portal Only) */}
        {registeredLocalities.length > 0 && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">Covering Major Pune Hubs</h3>
              <p className="text-xs sm:text-sm text-slate-500">Explore verified flats and flatmates across active localities</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
              {registeredLocalities.map((loc) => (
                <Link
                  key={loc}
                  href={`/search/flats?locality=${encodeURIComponent(loc)}`}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs px-3.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                  {loc}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center bg-slate-50 border rounded-2xl p-8 sm:p-10 space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Ready to Find Your Ideal Flat or Roommate?</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Browse hundreds of verified flats or discover compatible flatmates across Pune right now.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link href="/search/flats">
              <Button className="bg-brand-primary hover:bg-brand-primaryHover text-white px-6 py-2.5 text-xs font-semibold w-full sm:w-auto">
                Explore Flats in Pune
              </Button>
            </Link>
            <Link href="/search/flatmates">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 px-6 py-2.5 text-xs font-semibold w-full sm:w-auto">
                Find Flatmates
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
