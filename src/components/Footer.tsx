'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [hasVibeUpgrade, setHasVibeUpgrade] = useState(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

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
    <footer className="border-t border-border/10 bg-black text-text-onDark/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-text-onDark font-bold tracking-tight">FlatNFlatmates.in</span>
            <span className="text-xs">Pune Flat & Flatmate Search Platform</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/search/flats" className="hover:text-text-onDark transition-colors">Search Flats</Link>
            <Link href="/search/flatmates" className="hover:text-text-onDark transition-colors">Find Flatmates</Link>
            {featuresLoaded && hasVibeUpgrade && (
              <Link href="/services/vibe-upgrade" className="hover:text-text-onDark transition-colors">Vibe Upgrade</Link>
            )}
            <span className="text-text-onDark/30">|</span>
            <span className="text-xs text-text-onDark/40">© {new Date().getFullYear()} FlatNFlatmates.in. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
