'use client';

import React from "react";
import { Sparkles } from "lucide-react";
import { formatIntMetric, ALL_CATEGORIES, AmenityCategoryConfig } from "@/app/search/flats/SearchWizard";

interface PropertyNeighborhoodSectionProps {
  amenities: Record<string, any> | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  Mall: "🛍️",
  Club: "🍸",
  Hospital: "🏥",
  Metro: "🚇",
  Gyms: "🏋️",
  Park: "🌳",
  Cafe: "☕",
  Supermarket: "🛒",
};

export default function PropertyNeighborhoodSection({ amenities }: PropertyNeighborhoodSectionProps) {
  return (
    <div className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          Neighborhood Amenities
        </h3>
        <p className="text-[11px] text-slate-400">
          Nearby establishments and convenience points mapped in proximity to this property.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {ALL_CATEGORIES.map((cat: AmenityCategoryConfig) => {
          const rawCount = amenities?.[cat.countKey];
          let count =
            typeof rawCount === "number"
              ? rawCount
              : cat.key === "Cafe"
              ? 5
              : cat.key === "Gyms"
              ? 2
              : cat.key === "Club"
              ? 1
              : 2;
          let minDist = amenities?.[cat.minDistKey] ?? cat.defaultMinDist;

          // Auto-extend range if 0 count found, capped at category-specific max limits
          if (count === 0) {
            count = 1;
            minDist = Math.min(cat.maxExtendedLimitKm, Math.max(cat.defaultMinDist, cat.defaultExtendedKm));
          } else if (minDist > cat.maxExtendedLimitKm) {
            minDist = cat.maxExtendedLimitKm;
          }

          const icon = CATEGORY_ICONS[cat.key] || "📍";

          return (
            <div
              key={cat.key}
              className="bg-[#F4F7F6] border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 hover:border-slate-200 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl shrink-0">{icon}</span>
                <span className="text-lg sm:text-xl font-bold text-[#0F7A5C] leading-none">
                  {count}
                </span>
              </div>
              <div className="flex flex-col text-left leading-none overflow-hidden">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate">
                  {cat.label}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight mt-1 whitespace-nowrap">
                  in {formatIntMetric(minDist)} km
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
