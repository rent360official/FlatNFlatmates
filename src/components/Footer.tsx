'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, MapPin } from "lucide-react";

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
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 font-sans">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white tracking-tight">
                Flat<span className="text-brand-primary">N</span>Flatmates
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pune's dedicated flat and flatmate discovery platform. Find verified flats, compatible flatmates, and transparent shared living options across Pune.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <a href="mailto:rent360official@gmail.com" className="hover:text-white transition-colors">
                rent360official@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/search/flats" className="hover:text-white transition-colors">Search Flats in Pune</Link>
              </li>
              <li>
                <Link href="/search/flatmates" className="hover:text-white transition-colors">Find Compatible Flatmates</Link>
              </li>
              <li>
                <Link href="/list-property" className="hover:text-white transition-colors">List Your Flat / Room</Link>
              </li>
              {featuresLoaded && hasVibeUpgrade && (
                <li>
                  <Link href="/services/vibe-upgrade" className="hover:text-white transition-colors">Vibe Upgrade Services</Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact & Support</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Legal & Trust</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">Cancellation & Refund Policy</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FlatNFlatmates.in (Pune, India). All rights reserved.</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <Link href="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-slate-200 transition-colors">Refunds</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-200 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
