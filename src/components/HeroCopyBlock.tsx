import React from 'react';
import Link from 'next/link';
import { Home, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroCopyBlockProps {
  roomsCount: number;
  seekersCount: number;
  rateCount: number;
}

export default function HeroCopyBlock({ roomsCount, seekersCount, rateCount }: HeroCopyBlockProps) {
  return (
    <div className="flex flex-col space-y-6 text-left max-w-xl">
      {/* Eyebrow badge */}
      <div className="inline-flex items-center space-x-2 bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1 text-xs text-brand-primaryHover font-semibold w-fit">
        <Sparkles className="h-3.5 w-3.5 text-brand-primary animate-pulse" />
        <span>Live in Pune right now</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
        Every card on this map is a <span className="text-brand-primary">real room</span>, waiting.
      </h1>

      {/* Subheadline */}
      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
        Browse verified flats and compatible flatmates in Pune, side by side. Skip broker spam and search safely.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Link href="/search/flats" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-full px-8 py-6 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none">
            <Home className="h-5 w-5" />
            Find a Flat
          </Button>
        </Link>
        <Link href="/search/flatmates" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-brand-secondary hover:bg-brand-secondaryHover text-white font-bold rounded-full px-8 py-6 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none">
            <Users className="h-5 w-5" />
            Find a Flatmate
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="pt-6 border-t border-gray-200/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gray-500 tracking-wide uppercase">
        <div className="flex items-center gap-1">
          <span className="text-brand-primary font-extrabold text-sm sm:text-base">{roomsCount.toLocaleString()}+</span>
          <span>Verified Rooms</span>
        </div>
        <span className="hidden sm:inline text-gray-300">•</span>
        <div className="flex items-center gap-1">
          <span className="text-brand-secondary font-extrabold text-sm sm:text-base">{seekersCount.toLocaleString()}+</span>
          <span>Active Seekers</span>
        </div>
        <span className="hidden sm:inline text-gray-300">•</span>
        <div className="flex items-center gap-1">
          <span className="text-brand-primary font-extrabold text-sm sm:text-base">{rateCount}%</span>
          <span>Connection Rate</span>
        </div>
      </div>
    </div>
  );
}
