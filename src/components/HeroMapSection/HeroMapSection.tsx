import React, { useEffect, useState, useRef } from 'react';
import { HERO_CARDS } from './hero-cards.data';
import MapBackground from './MapBackground';
import FloatingPropertyCard from './FloatingPropertyCard';
import CursorLinkLines from './CursorLinkLines';
import HeroCopyBlock from './HeroCopyBlock';
import CTAButtons from './CTAButtons';

export default function HeroMapSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const clusterRef = useRef<HTMLDivElement | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12">
      {/* Hide ugly scrollbars on mobileFeatured row */}
      <span dangerouslySetInnerHTML={{
        __html: `
        <style>
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        </style>
      `}} />

      {/* Main hero wrapper */}
      <div className="relative overflow-hidden bg-customBg-base border border-gray-200/80 rounded-2xl lg:rounded-3xl shadow-sm flex flex-col lg:grid lg:grid-cols-12 items-stretch min-h-[520px] lg:min-h-[620px]">

        {/* Stylized background map */}
        <MapBackground />

        {/* Left Column: Heading, primary CTAs & mobile card list */}
        <div className="relative z-10 flex flex-col justify-top p-6 sm:p-10 lg:p-14 xl:p-10 lg:col-span-5 bg-white/90 lg:bg-white/45 backdrop-blur-md lg:border-r border-gray-200/50 gap-4 lg:gap-6">
          <HeroCopyBlock />

          {/* Desktop-only CTA Buttons */}
          <div className="hidden lg:block mt-2">
            <CTAButtons />
          </div>

          {/* Option A: Avatar cluster trust element */}
          {/* <div className="hidden lg:flex items-center space-x-3 mt-4">
            <div className="flex -space-x-2.5 overflow-hidden">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80"
              ].map((url, idx) => (
                <img
                  key={idx}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src={url}
                  alt={`Pune renter ${idx + 1}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-text-secondary">
              Joined by <strong className="text-brand-primary font-semibold">1,200+ renters</strong> across Pune
            </span>
          </div> */}

          {/* Mobile compact mini-map container */}
          <div className="lg:hidden relative overflow-hidden bg-customBg-base border border-gray-200/80 rounded-2xl h-[220px] w-full mt-6 shadow-sm select-none">
            {/* Map view image background inside mini-map */}
            <MapBackground />

            {/* 3 Scattered Mobile Cards */}
            {HERO_CARDS.slice(0, 3).map((card) => (
              <FloatingPropertyCard
                key={card.id}
                card={card}
                isMobileMap={true}
              />
            ))}
          </div>

          {/* Mobile-only CTA Buttons (placed below mini-map) */}
          <div className="lg:hidden w-full mt-2">
            <CTAButtons />
          </div>
        </div>

        {/* Right Column: Scattered interactive card map cluster area (Desktop Only) */}
        <div
          ref={clusterRef}
          className="lg:col-span-7 relative overflow-hidden hidden lg:block select-none pointer-events-auto"
        >
          {/* Scattered Property Cards */}
          {HERO_CARDS.map((card) => (
            <FloatingPropertyCard
              key={card.id}
              card={card}
            />
          ))}

          {/* Performant mouse-move SVG dotted connecting lines */}
          <CursorLinkLines
            cards={HERO_CARDS}
            containerRef={clusterRef}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>

      </div>
    </div>
  );
}
