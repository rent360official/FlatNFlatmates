"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, Users, Sparkles, Phone, ShieldCheck, MapPin,
  ArrowRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HowItWorks from "@/components/HowItWorks";
import HeroMapSection from "@/components/HeroMapSection/HeroMapSection";

export default function Home() {
  const [hasVibeUpgrade, setHasVibeUpgrade] = useState(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  // Fetch feature flags to check if Vibe Upgrade is visible/enabled
  useEffect(() => {
    fetch('/api/features/visible')
      .then((r) => r.json())
      .then((data) => {
        const visible = data.visibleFeatures || [];
        setHasVibeUpgrade(visible.includes('vibe_upgrade_catalog'));
        setFeaturesLoaded(true);
      })
      .catch(() => {
        setFeaturesLoaded(true);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div>
        <HeroMapSection />
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Trust and Safety Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 ${featuresLoaded && hasVibeUpgrade ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-12 items-center`}>
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-brand-primary/10 text-brand-primaryHover px-3 py-1 rounded-full text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Tenants & Properties</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Trust Built into Every Click</h2>
              <p className="text-gray-600">
                Finding a flat in a new city can be intimidating. FlatNFlatmates implements platform features to prevent broker spam and protect tenants:
              </p>

              <ul className="space-y-3.5">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-brand-primary mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700"><strong>Google Places POI Mapping:</strong> No free-text landmark entries. Pinpoints real commute times.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-brand-primary mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700"><strong>Call Proxying & Recording:</strong> Securely talk to owners without giving away your personal number.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-brand-primary mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700"><strong>Automatic Availability Flags:</strong> Soft status indicator is verified via post-call signals.</span>
                </li>
              </ul>
            </div>

            {featuresLoaded && hasVibeUpgrade && (
              <div className="bg-brand-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 opacity-10">
                  <ShieldCheck className="h-72 w-72" />
                </div>
                <span className="text-xs font-bold text-brand-primary/30 uppercase tracking-widest block mb-1">Premium Tenant Service</span>
                <h3 className="text-2xl font-bold mb-4">FlatNFlatmates Vibe Upgrade</h3>
                <p className="text-sm text-brand-primary/15 leading-relaxed mb-6">
                  Move into an unfurnished or basic flat and let us handle the styling. Select a redecoration pack, request upgrade via OTP verification, and pay a monthly subscription. We package, install, and style your room.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <span className="block text-xs text-brand-primary/20">Starting at</span>
                    <span className="text-xl font-bold">₹1,500/mo</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <span className="block text-xs text-brand-primary/20">Installation</span>
                    <span className="text-xl font-bold">Within 48 Hours</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/10">
                  <span className="text-xs text-brand-primary/20">Available across Pune localities</span>
                  <Link href="/services/vibe-upgrade">
                    <Button className="bg-white text-brand-primary hover:bg-brand-primary/10">View Vibe Catalog</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pune Localities Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-3 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Popular Localities in Pune</h2>
            <p className="text-gray-600">Quickly find flats and roommates in the major student and IT clusters.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {['Hinjewadi', 'Viman Nagar', 'Baner', 'Koregaon Park', 'Kharadi', 'Aundh', 'Kothrud', 'Kalyani Nagar'].map((loc) => (
              <Link key={loc} href={`/search/flats?locality=${loc}`} className="group bg-white border hover:border-brand-primary rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-700 group-hover:text-brand-primary font-medium">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    <span>{loc}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Onboard Section */}
      <section className="bg-white py-16 lg:py-20 border-t">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Are You a Property Owner in Pune?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            List your rooms or complete apartments for free. Reach thousands of verified students and IT professionals looking for accommodation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/list-property">
              <Button size="lg" className="bg-brand-primary text-white hover:bg-brand-primaryHover w-full sm:w-auto">
                List Your Property
              </Button>
            </Link>
            <Link href="/search/flatmates">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Flatmate Seekers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
