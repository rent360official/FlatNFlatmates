'use client';

import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin, Plus, X, Search, Car, Clock } from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles } from "@/lib/mapStyles";
import { createPoiMapMarkerIcon, detectPoiCategory, getPoiVisualConfig } from "@/lib/poiIcons";
import { formatIntMetric } from "@/app/search/flats/SearchWizard";

export interface TravelSpot {
  id: string;
  label: string;
  lat: number;
  lng: number;
  types?: string[];
  type?: string;
  distanceKm: number;
  commuteTimeMin: number;
}

interface PropertyCommuteSectionProps {
  propertyLocation: { lat: number; lng: number };
  propertyTitle: string;
  propertyAddress?: string;
  defaultNearbyPois?: {
    _id?: string;
    name: string;
    type?: string;
    distanceKm: number;
    commuteTimeMin: number;
    lat: number;
    lng: number;
  }[];
}

// Haversine distance calculator in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function calculateCommuteMinutes(distKm: number): number {
  return Math.max(5, Math.round(distKm * 3.5 + 2));
}

const POPULAR_QUICK_SPOTS = [
  { label: "Hinjewadi Phase 1, Pune", lat: 18.5913, lng: 73.7124, type: "work" },
  { label: "EON Free Zone, Kharadi, Pune", lat: 18.5529, lng: 73.9388, type: "work" },
  { label: "Magarpatta Cybercity, Pune", lat: 18.5147, lng: 73.9298, type: "work" },
  { label: "Symbiosis International, Viman Nagar", lat: 18.5679, lng: 73.9143, type: "education" },
  { label: "Pune Railway Station", lat: 18.5289, lng: 73.8744, type: "transit" },
  { label: "Balewadi High Street, Baner", lat: 18.5726, lng: 73.7749, type: "food" },
];

export default function PropertyCommuteSection({
  propertyLocation,
  propertyTitle,
  propertyAddress,
  defaultNearbyPois = [],
}: PropertyCommuteSectionProps) {
  const isMapsLoaded = useGoogleMapsLoaded();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [travelSpots, setTravelSpots] = useState<TravelSpot[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [hasRestoredFromSearch, setHasRestoredFromSearch] = useState(false);

  // 1. Restore Travel Spots from search session (flat search or flatmate search) on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      let savedPois: any[] = [];

      // Check flat search wizard state first
      const flatStateRaw = sessionStorage.getItem("flat_search_wizard_state_v2");
      if (flatStateRaw) {
        const flatState = JSON.parse(flatStateRaw);
        if (Array.isArray(flatState.poisList) && flatState.poisList.length > 0) {
          savedPois = flatState.poisList;
        }
      }

      // Check flatmate search wizard state if not found
      if (savedPois.length === 0) {
        const fmStateRaw = sessionStorage.getItem("flatmate_search_wizard_state_v2");
        if (fmStateRaw) {
          const fmState = JSON.parse(fmStateRaw);
          if (Array.isArray(fmState.poisList) && fmState.poisList.length > 0) {
            savedPois = fmState.poisList;
          }
        }
      }

      if (savedPois.length > 0) {
        const spots: TravelSpot[] = savedPois.map((p, idx) => {
          const dist = calculateDistanceKm(propertyLocation.lat, propertyLocation.lng, p.lat, p.lng);
          return {
            id: `restored-${idx}-${Date.now()}`,
            label: p.label,
            lat: p.lat,
            lng: p.lng,
            types: p.types,
            type: p.type,
            distanceKm: dist,
            commuteTimeMin: calculateCommuteMinutes(dist),
          };
        });
        setTravelSpots(spots);
        setHasRestoredFromSearch(true);
      } else {
        // No user search spots: start with empty travel spots so map shows property only
        setTravelSpots([]);
        setHasRestoredFromSearch(false);
      }
    } catch (e) {
      console.error("Failed to load search travel spots:", e);
    }
  }, [propertyLocation.lat, propertyLocation.lng]);

  // 2. Initialize Google Map
  useEffect(() => {
    if (!isMapsLoaded || !mapRef.current) return;

    if (!mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
        center: propertyLocation,
        zoom: 13,
        styles: mapStyles,
        gestureHandling: "greedy",
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });
    }
  }, [isMapsLoaded, propertyLocation]);

  // 3. Update Markers and Fit Map Bounds whenever travelSpots change
  useEffect(() => {
    if (!isMapsLoaded || !mapInstanceRef.current || !(window as any).google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new (window as any).google.maps.LatLngBounds();

    // A. Property Marker (Distinct Green Circle with Home Icon & Label)
    const propSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="94" height="72" viewBox="0 0 94 72">
        <defs>
          <filter id="propShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
          </filter>
        </defs>
        <!-- Floating Label Pill with generous inner horizontal padding -->
        <g filter="url(#propShadow)">
          <rect x="5" y="44" width="84" height="22" rx="11" fill="#0F7A5C" stroke="#ffffff" stroke-width="1.5"/>
          <text x="47" y="59" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="9.5px" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.2px">
            Flat Location
          </text>
        </g>
        <!-- Top Circular Pin with Home Icon -->
        <g filter="url(#propShadow)">
          <circle cx="47" cy="22" r="18" fill="#0F7A5C" stroke="#ffffff" stroke-width="2.5"/>
          <path d="M39 24l8-7 8 7v8a1 1 0 0 1-1 1h-4v-5h-6v5h-4a1 1 0 0 1-1-1v-8z" fill="#ffffff"/>
        </g>
      </svg>
    `.trim();

    const propertyMarker = new (window as any).google.maps.Marker({
      position: propertyLocation,
      map: mapInstanceRef.current,
      zIndex: 999,
      title: propertyTitle || "Flat Location",
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(propSvg)}`,
        scaledSize: new (window as any).google.maps.Size(94, 72),
        anchor: new (window as any).google.maps.Point(47, 22),
      },
    });
    markersRef.current.push(propertyMarker);
    bounds.extend(propertyLocation);

    // B. Travel Spot Markers
    travelSpots.forEach((spot) => {
      const icon = createPoiMapMarkerIcon(spot);
      const marker = new (window as any).google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lng },
        map: mapInstanceRef.current,
        title: spot.label,
        icon: icon,
        zIndex: 100,
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: spot.lat, lng: spot.lng });
    });

    // C. Adjust Bounds / Center
    if (travelSpots.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else {
      mapInstanceRef.current.setCenter(propertyLocation);
      mapInstanceRef.current.setZoom(14);
    }
  }, [isMapsLoaded, travelSpots, propertyLocation, propertyTitle]);

  // 4. Attach Google Places Autocomplete to Search Input
  useEffect(() => {
    if (!isMapsLoaded || !inputRef.current || !(window as any).google?.maps?.places) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.35, 73.65),
      new (window as any).google.maps.LatLng(18.72, 74.05)
    );

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["place_id", "geometry", "name", "formatted_address", "types"],
      bounds: puneBounds,
      strictBounds: false,
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = place.name || place.formatted_address || "Travel Spot";

      handleAddSpot({
        label,
        lat,
        lng,
        types: place.types,
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSearchInput("");
    });

    return () => {
      if ((window as any).google?.maps?.event) {
        (window as any).google.maps.event.removeListener(listener);
      }
    };
  }, [isMapsLoaded, propertyLocation]);

  // Add Spot handler
  const handleAddSpot = (spotData: { label: string; lat: number; lng: number; types?: string[]; type?: string }) => {
    const dist = calculateDistanceKm(propertyLocation.lat, propertyLocation.lng, spotData.lat, spotData.lng);
    const newSpot: TravelSpot = {
      id: `spot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      label: spotData.label,
      lat: spotData.lat,
      lng: spotData.lng,
      types: spotData.types,
      type: spotData.type,
      distanceKm: dist,
      commuteTimeMin: calculateCommuteMinutes(dist),
    };

    setTravelSpots((prev) => [...prev, newSpot]);
  };

  // Remove Spot handler
  const handleRemoveSpot = (spotId: string) => {
    setTravelSpots((prev) => prev.filter((s) => s.id !== spotId));
  };

  return (
    <div className="space-y-4 border-t pt-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-brand-primary" />
            Commute Landmark Distances
          </h3>
          <p className="text-[11px] text-slate-400">
            {travelSpots.length > 0
              ? `Showing commute mapping to your ${travelSpots.length} selected travel spot${travelSpots.length > 1 ? "s" : ""}.`
              : "Check exact distance & driving time from this property to your daily destinations."}
          </p>
        </div>
      </div>

      {/* Interactive Map View */}
      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border shadow-sm bg-slate-100">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Floating Property Pin Pill */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-[#0F7A5C] ring-4 ring-[#0F7A5C]/20" />
          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[200px]">
            {propertyTitle || "Flat Location"}
          </span>
        </div>
      </div>

      {/* Search & Add Travel Spots Input */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Add a travel spot (e.g. Infosys Hinjewadi, Symbiosis, Pune Station)..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Popular Pune quick suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quick Add:</span>
          {POPULAR_QUICK_SPOTS.map((quickSpot) => {
            const isAlreadyAdded = travelSpots.some((s) => s.label.toLowerCase() === quickSpot.label.toLowerCase());
            return (
              <button
                key={quickSpot.label}
                type="button"
                disabled={isAlreadyAdded}
                onClick={() => handleAddSpot(quickSpot)}
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isAlreadyAdded
                    ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-200 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 shadow-2xs"
                }`}
              >
                <Plus className="h-3 w-3" />
                <span>{quickSpot.label.split(",")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel Spots Cards List */}
      {travelSpots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {travelSpots.map((spot) => {
            const config = getPoiVisualConfig(spot);
            return (
              <div
                key={spot.id}
                className="flex items-start justify-between p-3.5 bg-slate-50 border rounded-xl hover:border-slate-300 transition-colors group shadow-2xs"
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0 pr-2">
                  <div
                    className="p-2 rounded-lg shrink-0 mt-0.5"
                    style={{ backgroundColor: `${config.bgColor}15`, color: config.bgColor }}
                  >
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-850 truncate" title={spot.label}>
                      {spot.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 block capitalize">{config.categoryLabel}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F7A5C] bg-[#0F7A5C]/10 px-2 py-0.5 rounded">
                        <Car className="h-3 w-3" />
                        {spot.distanceKm} km
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        <Clock className="h-3 w-3 text-slate-400" />
                        ~{spot.commuteTimeMin} mins driving
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSpot(spot.id)}
                  title="Remove travel spot"
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-dashed rounded-xl text-center space-y-1">
          <p className="text-xs font-semibold text-slate-600">No custom travel spots added yet</p>
          <p className="text-[11px] text-slate-400">
            Use the search box above or click any quick suggestion to see your daily commute time to this flat.
          </p>
        </div>
      )}
    </div>
  );
}
