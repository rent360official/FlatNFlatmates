'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, Search, Navigation,
  ChevronRight, Car, X, Home
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles } from "@/lib/mapStyles";
import { colors } from "@/theme/colors";
import FacebookGroupCTA, { FacebookGroupData } from "@/components/FacebookGroupCTA";

interface POI {
  _id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

export const POPULAR_LOCALITIES_DATA: { [key: string]: { label: string; lat: number; lng: number } } = {
  "Hinjewadi": { label: "Hinjewadi, Pune, Maharashtra, India", lat: 18.5913, lng: 73.7124 },
  "Viman Nagar": { label: "Viman Nagar, Pune, Maharashtra, India", lat: 18.5679, lng: 73.9143 },
  "Baner": { label: "Baner, Pune, Maharashtra, India", lat: 18.5597, lng: 73.7922 },
  "Koregaon Park": { label: "Koregaon Park, Pune, Maharashtra, India", lat: 18.5362, lng: 73.8907 },
  "Kharadi": { label: "Kharadi, Pune, Maharashtra, India", lat: 18.5529, lng: 73.9388 },
  "Aundh": { label: "Aundh, Pune, Maharashtra, India", lat: 18.5602, lng: 73.8055 },
  "Kothrud": { label: "Kothrud, Pune, Maharashtra, India", lat: 18.5074, lng: 73.8143 },
  "Kalyani Nagar": { label: "Kalyani Nagar, Pune, Maharashtra, India", lat: 18.5463, lng: 73.9042 },
};

export default function SearchWizard({
  pois,
  initialLocality,
  facebookGroups = [],
}: {
  pois: POI[];
  initialLocality?: string;
  facebookGroups?: FacebookGroupData[];
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  // Location Search Area & POIs State
  const [searchArea, setSearchArea] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [searchAreaInput, setSearchAreaInput] = useState("");
  const [poisList, setPoisList] = useState<{
    label: string;
    lat: number;
    lng: number;
  }[]>([]);
  const [poiId, setPoiId] = useState(""); // Legacy selected predefined POI id
  const [poiSearchInput, setPoiSearchInput] = useState("");

  // Roommate Preferences State
  const [userType, setUserType] = useState<string>("");
  const [profession, setProfession] = useState<string>("");
  const [shift, setShift] = useState<string>("");
  const [socialType, setSocialType] = useState<string>("");
  const [gymGuy, setGymGuy] = useState<string>("");
  const [outsideEater, setOutsideEater] = useState<string>("");

  // Existing search states
  const [distance, setDistance] = useState("10000"); // in meters (10 km)
  const [bhkConfig, setBhkConfig] = useState("any");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [furnishingStatus, setFurnishingStatus] = useState("any");
  const [tenantPreference, setTenantPreference] = useState("any");
  const [zeroBrokerage, setZeroBrokerage] = useState(false);

  // More Filters state
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [availableFromToday, setAvailableFromToday] = useState(false);
  const [petPolicy, setPetPolicy] = useState("any");
  const [parkingType, setParkingType] = useState("any");
  const [powerBackup, setPowerBackup] = useState("any");
  const [waterSupplyType, setWaterSupplyType] = useState("any");
  const [evCharging, setEvCharging] = useState(false);
  const [fiberAvailable, setFiberAvailable] = useState(false);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);

  const [hoveredPropId, setHoveredPropId] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Google Maps Instance Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const centerMarkerRef = useRef<any>(null);
  const isMapsLoaded = useGoogleMapsLoaded();

  // Backward compatibility: Migrate legacy single POI logic into multi-select poisList
  useEffect(() => {
    if (poisList.length === 0) {
      if (poiId) {
        const found = pois.find(p => p._id === poiId);
        if (found) {
          setPoisList([{ label: found.name, lat: found.lat, lng: found.lng }]);
        }
      }
    }
  }, [poiId, pois]);

  // Initialize search area from URL query parameter if present
  useEffect(() => {
    if (initialLocality && POPULAR_LOCALITIES_DATA[initialLocality]) {
      const locData = POPULAR_LOCALITIES_DATA[initialLocality];
      setSearchArea({
        label: locData.label,
        lat: locData.lat,
        lng: locData.lng,
      });
      setSearchAreaInput(locData.label);
    }
  }, [initialLocality]);

  const getStepsSequence = () => {
    const seq = [1, 2]; // Step 1: Location, Step 2: User Type
    if (userType === 'Professional') {
      seq.push(3, 4); // Step 3: Profession, Step 4: Shift
    }
    seq.push(5, 6, 7, 8, 9); // Social Type, Gym Guy, Outside Eater, Property Info, Results
    return seq;
  };

  const getNextStep = (currentStep: number, overrideVal?: string) => {
    if (currentStep === 1) return 2;
    if (currentStep === 2) {
      const effectiveUserType = overrideVal !== undefined ? overrideVal : userType;
      return effectiveUserType === "Professional" ? 3 : 5;
    }
    if (currentStep === 3) return 4;
    if (currentStep === 4) return 5;
    if (currentStep === 5) return 6;
    if (currentStep === 6) return 7;
    if (currentStep === 7) return 8;
    if (currentStep === 8) return 9;
    return 9;
  };

  const getPrevStep = (currentStep: number) => {
    if (currentStep === 2) return 1;
    if (currentStep === 3) return 2;
    if (currentStep === 4) return 3;
    if (currentStep === 5) {
      return userType === "Professional" ? 4 : 2;
    }
    if (currentStep === 6) return 5;
    if (currentStep === 7) return 6;
    if (currentStep === 8) return 7;
    if (currentStep === 9) return 8;
    return 1;
  };

  const goToStep = (nextStepNum: number, push = true) => {
    if (push && typeof window !== "undefined") {
      window.history.pushState({ ...(window.history.state || {}), wizardStep: nextStepNum }, "", window.location.href);
    }
    setStep(nextStepNum);
  };

  const handleNext = (currentStep: number, overrideVal?: string) => {
    const next = getNextStep(currentStep, overrideVal);
    goToStep(next, true);
  };

  const handleBack = (currentStep: number) => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state.wizardStep === "number" &&
      window.history.state.wizardStep > 1
    ) {
      window.history.back();
    } else {
      const prev = getPrevStep(currentStep);
      goToStep(prev, false);
    }
  };

  // Sync browser back/forward buttons with wizard steps
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentState = window.history.state || {};
    if (typeof currentState.wizardStep !== "number") {
      window.history.replaceState({ ...currentState, wizardStep: 1 }, "", window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.wizardStep === "number") {
        setStep(event.state.wizardStep);
      } else {
        setStep(1);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchArea) {
        params.append("searchAreaLat", searchArea.lat.toString());
        params.append("searchAreaLng", searchArea.lng.toString());
      }
      if (poisList.length > 0) {
        params.append("pois", JSON.stringify(poisList));
      } else if (poiId) {
        params.append("poiId", poiId);
      }

      const flatmatePref = {
        userType: userType || null,
        profession: (userType === 'Professional' && profession) ? profession : null,
        shift: (userType === 'Professional' && shift) ? shift : null,
        socialType: socialType || null,
        gymGuy: gymGuy || null,
        outsideEater: outsideEater || null
      };
      params.append("flatmatePreferences", JSON.stringify(flatmatePref));

      if (distance) params.append("distance", distance);
      if (bhkConfig && bhkConfig !== "any") params.append("bhkConfig", bhkConfig);
      if (minRent) params.append("minRent", minRent);
      if (maxRent) params.append("maxRent", maxRent);
      if (furnishingStatus && furnishingStatus !== "any") params.append("furnishingStatus", furnishingStatus);
      if (tenantPreference && tenantPreference !== "any") params.append("tenantPreference", tenantPreference);
      if (zeroBrokerage) params.append("zeroBrokerage", "true");

      // New filters
      if (availableFromToday) params.append("availableFromToday", "true");
      if (petPolicy && petPolicy !== "any") params.append("petPolicy", petPolicy);
      if (parkingType && parkingType !== "any") params.append("parkingType", parkingType);
      if (powerBackup && powerBackup !== "any") params.append("powerBackup", powerBackup);
      if (waterSupplyType && waterSupplyType !== "any") params.append("waterSupplyType", waterSupplyType);
      if (evCharging) params.append("evCharging", "true");
      if (fiberAvailable) params.append("fiberAvailable", "true");
      if (isVerifiedOnly) params.append("isVerifiedOnly", "true");

      const res = await fetch(`/api/search/flats?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProperties(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load search results", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 9) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, searchArea, poisList, userType, profession, shift, socialType, gymGuy, outsideEater, distance, bhkConfig, minRent, maxRent, furnishingStatus, tenantPreference, zeroBrokerage, availableFromToday, petPolicy, parkingType, powerBackup, waterSupplyType, evCharging, fiberAvailable, isVerifiedOnly]);

  // Effect to initialize the Google Map once in Step 9
  useEffect(() => {
    if (!isMapsLoaded || step !== 9 || !mapRef.current) return;

    const centerLat = searchArea ? searchArea.lat : (poisList.length > 0 ? poisList[0].lat : 18.5597);
    const centerLng = searchArea ? searchArea.lng : (poisList.length > 0 ? poisList[0].lng : 73.7922);

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: mapStyles,
    });
    mapInstanceRef.current = map;

    // Render blue marker for Search Area
    if (searchArea) {
      new (window as any).google.maps.Marker({
        position: { lat: searchArea.lat, lng: searchArea.lng },
        map: map,
        title: `Search Area: ${searchArea.label}`,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    }

    // Render red markers for all commute POIs
    poisList.forEach(poi => {
      new (window as any).google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: map,
        title: `Commute Point: ${poi.label}`,
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });
    });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [isMapsLoaded, step, searchArea, poisList]);

  // Effect to manage property markers reactively
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    properties.forEach((prop: any) => {
      const lat = prop.location.coordinates[1];
      const lng = prop.location.coordinates[0];
      const isSelected = selectedPropId === prop._id.toString();
      const isHovered = hoveredPropId === prop._id.toString();
      const isOutOfProximity = prop.inProximity === false;

      let markerColor = "#ffffff";
      let strokeColor = "#cbd5e1";
      let textColor = "#1e293b";
      let scale = 18;
      let opacity = 1;

      if (isSelected || isHovered) {
        markerColor = colors.brand.primary; // Indigo-600
        strokeColor = colors.brand.primaryHover; // Indigo-700
        textColor = "#ffffff";
        scale = 22;
      } else if (isOutOfProximity) {
        markerColor = "#f8fafc";
        strokeColor = "#e2e8f0";
        textColor = "#94a3b8";
        opacity = 0.6;
      }

      const marker = new (window as any).google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        opacity,
        label: {
          text: `₹${(prop.rentAmount / 1000).toFixed(0)}k`,
          color: textColor,
          fontSize: "9px",
          fontWeight: "bold",
          fontFamily: "Inter, sans-serif",
        },
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: scale,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: strokeColor,
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedPropId(isSelected ? null : prop._id.toString());
      });

      markersRef.current.push(marker);
    });
  }, [properties, selectedPropId, hoveredPropId, isMapsLoaded]);

  // Autocomplete setup for Step 1 location area and custom POIs
  useEffect(() => {
    if (!isMapsLoaded || step !== 1) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.35, 73.65),
      new (window as any).google.maps.LatLng(18.72, 74.05)
    );

    const isWithinPune = (lat: number, lng: number) => {
      return lat >= 18.35 && lat <= 18.75 && lng >= 73.55 && lng <= 74.15;
    };

    // 1. Search Area Autocomplete (Locality / Region level only)
    const areaInput = document.getElementById("search-area-autocomplete") as HTMLInputElement;
    if (areaInput) {
      const areaAutocomplete = new (window as any).google.maps.places.Autocomplete(areaInput, {
        componentRestrictions: { country: "in" },
        bounds: puneBounds,
        strictBounds: true,
        types: ["(regions)"],
        fields: ["geometry", "name", "formatted_address"],
      });

      areaAutocomplete.addListener("place_changed", () => {
        const place = areaAutocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          if (!isWithinPune(lat, lng)) {
            alert("Please search for locations inside Pune only.");
            return;
          }
          const displayLabel = place.formatted_address || place.name || "Custom Locality";
          setSearchArea({
            label: displayLabel,
            lat,
            lng,
          });
          setSearchAreaInput(displayLabel);
        }
      });
    }

    // 2. Custom POI Autocomplete (Commute anchor landmarks)
    const poiInput = document.getElementById("poi-autocomplete") as HTMLInputElement;
    if (poiInput) {
      const poiAutocomplete = new (window as any).google.maps.places.Autocomplete(poiInput, {
        componentRestrictions: { country: "in" },
        bounds: puneBounds,
        strictBounds: true,
        fields: ["geometry", "name", "formatted_address"],
      });

      poiAutocomplete.addListener("place_changed", () => {
        const place = poiAutocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          if (!isWithinPune(lat, lng)) {
            alert("Please select a landmark inside Pune.");
            return;
          }

          const newPoi = {
            label: place.formatted_address || place.name || "Custom POI",
            lat,
            lng,
          };

          setPoisList(prev => {
            if (prev.some(p => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          setPoiSearchInput("");
          poiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, step]);

  // Reusable Question Step Component
  const renderChoiceStep = (
    stepNum: number,
    question: string,
    description: string,
    currentValue: string,
    onChange: (val: string) => void,
    options: { label: string; emoji: string }[],
    onNext: (val?: string) => void,
    onBack: () => void,
    onSkip?: () => void
  ) => {
    const seq = getStepsSequence();
    const currentIdx = seq.indexOf(stepNum) + 1;
    const totalSteps = seq.length;

    const handleSelectOption = (label: string) => {
      onChange(label);
      onNext(label);
    };

    return (
      <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
        <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Step {currentIdx} of {totalSteps}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{question}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2">
            {options.map((opt) => {
              const isSelected = currentValue === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectOption(opt.label)}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 group ${isSelected
                    ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                    }`}
                >
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl mb-3 transition-transform duration-250 group-hover:scale-115 ${isSelected ? "bg-brand-primary/15" : "bg-slate-100"
                      }`}
                  >
                    {opt.emoji}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2.5 border border-dashed rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow w-full flex flex-col min-h-[80vh]">

      {/* STEP 1: SELECT AREA & MULTI-POIS */}
      {step === 1 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Step 1 of 8</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Where in Pune?</h2>
              <p className="text-xs text-slate-500">Pick your target residential area and add daily commute destinations.</p>
            </div>

            <div className="space-y-5">
              {/* Search Area Locality Filter - Elevated Hero Element */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-brand-primary/[0.05] via-brand-primary/[0.02] to-transparent border border-brand-primary/20 space-y-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Navigation className="h-4 w-4" />
                    </span>
                    <div>
                      <label className="text-xs font-bold text-slate-900 block leading-tight">Target Locality / Area</label>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Filter by residential zone or neighborhood in Pune</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs shrink-0">
                    Optional
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="search-area-autocomplete"
                    type="text"
                    placeholder="Search locality or neighborhood in Pune (e.g. Baner, Hinjewadi)..."
                    value={searchAreaInput}
                    onChange={e => setSearchAreaInput(e.target.value)}
                    onBlur={() => {
                      // Only allow confirmed dropdown selection - revert unselected custom text
                      if (!searchArea || searchArea.label !== searchAreaInput) {
                        setSearchAreaInput(searchArea?.label || "");
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    className="w-full text-xs font-medium border border-slate-250 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl pl-3.5 pr-9 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 shadow-xs transition-all"
                  />
                  {searchArea && (
                    <button
                      type="button"
                      onClick={() => { setSearchArea(null); setSearchAreaInput(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Popular Locality Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Popular Localities in Pune:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(POPULAR_LOCALITIES_DATA).map(([name, data]) => {
                      const isSelected = searchArea?.label === data.label || searchAreaInput.startsWith(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSearchArea(null);
                              setSearchAreaInput("");
                            } else {
                              setSearchArea({
                                label: data.label,
                                lat: data.lat,
                                lng: data.lng,
                              });
                              setSearchAreaInput(data.label);
                            }
                          }}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                            isSelected
                              ? "bg-brand-primary text-white border-brand-primary shadow-xs font-semibold"
                              : "bg-white text-slate-650 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/5"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Autocomplete for Custom POIs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-slate-800">Regular travel spots</label>
                    <p className="block text-[10px] text-slate-500">To see exactly how far each place is from your future home.</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    id="poi-autocomplete"
                    type="text"
                    placeholder="Work, college, gym — anywhere you travel to often (e.g. Hinjewadi IT Park)..."
                    value={poiSearchInput}
                    onChange={e => setPoiSearchInput(e.target.value)}
                    onBlur={() => {
                      // Discard unselected custom typed text on blur
                      setPoiSearchInput("");
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    className="w-full text-xs border border-slate-250 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-brand-primary/10 shadow-xs transition-all"
                  />
                </div>
              </div>

              {/* Selected POIs List Chips */}
              {poisList.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Commute List ({poisList.length})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {poisList.map(poi => (
                      <span
                        key={poi.label}
                        className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/15 text-brand-primaryHover text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                      >
                        <span>{poi.label}</span>
                        <button
                          type="button"
                          onClick={() => setPoisList(prev => prev.filter(x => x.label !== poi.label))}
                          className="text-brand-primary/60 hover:text-brand-primaryHover font-extrabold ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Distance radius query */}
              {(searchArea || poisList.length > 0) && (
                <div className="space-y-2 animate-in fade-in duration-200 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Max Commute Proximity Boundary</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="2000"
                      max="40000"
                      step="1000"
                      value={distance}
                      onChange={e => setDistance(e.target.value)}
                      className="w-full h-1.5 bg-brand-primary/15 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {(parseInt(distance) / 1000).toFixed(0)} km
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleNext(1)}
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: USER TYPE */}
      {step === 2 && renderChoiceStep(
        2,
        "What type of flatmate are you?",
        "Help us match you with compatible roommates in shared apartments.",
        userType,
        setUserType,
        [
          { label: "Student", emoji: "🎓" },
          { label: "Professional", emoji: "💼" },
          { label: "Retired", emoji: "👴" }
        ],
        (val) => handleNext(2, val),
        () => handleBack(2),
        () => { setUserType(""); handleNext(2, ""); }
      )}

      {/* STEP 3: PROFESSION (Conditional if User Type = Professional) */}
      {step === 3 && renderChoiceStep(
        3,
        "Select your industry sector",
        "Select the category that best describes your job role.",
        profession,
        setProfession,
        [
          { label: "Corporate Job", emoji: "🏢" },
          { label: "Government Job", emoji: "🏛️" },
          { label: "Self Employed", emoji: "🚀" },
          { label: "Others", emoji: "🛠️" }
        ],
        (val) => handleNext(3, val),
        () => handleBack(3),
        () => { setProfession(""); handleNext(3, ""); }
      )}

      {/* STEP 4: SHIFT (Conditional if User Type = Professional) */}
      {step === 4 && renderChoiceStep(
        4,
        "What are your typical working hours?",
        "Compatible shift hours help avoid scheduling noise disputes.",
        shift,
        setShift,
        [
          { label: "Day Shift", emoji: "☀️" },
          { label: "Night Shift", emoji: "🌙" }
        ],
        (val) => handleNext(4, val),
        () => handleBack(4),
        () => { setShift(""); handleNext(4, ""); }
      )}

      {/* STEP 5: SOCIAL TYPE */}
      {step === 5 && renderChoiceStep(
        5,
        "What are your socializing vibes?",
        "Do you prefer a social hangout vibe or quiet private space?",
        socialType,
        setSocialType,
        [
          { label: "Socializing", emoji: "🥳" },
          { label: "Reserved", emoji: "🤫" }
        ],
        (val) => handleNext(5, val),
        () => handleBack(5),
        () => { setSocialType(""); handleNext(5, ""); }
      )}

      {/* STEP 6: GYM GUY */}
      {step === 6 && renderChoiceStep(
        6,
        "Are you a gym enthusiast?",
        "We'll prioritize highlighting apartments with fitness clubs nearby.",
        gymGuy,
        setGymGuy,
        [
          { label: "Definitely", emoji: "🏋️" },
          { label: "Maybe", emoji: "🏃" },
          { label: "Not at all", emoji: "🛋️" }
        ],
        (val) => handleNext(6, val),
        () => handleBack(6),
        () => { setGymGuy(""); handleNext(6, ""); }
      )}

      {/* STEP 7: OUTSIDE EATER */}
      {step === 7 && renderChoiceStep(
        7,
        "How often do you eat out?",
        "We'll find apartments with quick food access or prioritize home food prep rules.",
        outsideEater,
        setOutsideEater,
        [
          { label: "Too much", emoji: "🍕" },
          { label: "Only evening small snacks", emoji: "🍿" },
          { label: "No, only homemade foodie", emoji: "🍳" }
        ],
        (val) => handleNext(7, val),
        () => handleBack(7),
        () => { setOutsideEater(""); handleNext(7, ""); }
      )}

      {/* STEP 8: BUDGETS & SPECS */}
      {step === 8 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Step 8 of 8</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Define your preferences</h2>
              <p className="text-xs text-slate-500">Configure your budget constraints and furnishing requirements.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">BHK Configuration</label>
                  <select
                    value={bhkConfig}
                    onChange={e => setBhkConfig(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  >
                    <option value="any">Any BHK</option>
                    <option value="1RK">1 RK</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Furnishing Status</label>
                  <select
                    value={furnishingStatus}
                    onChange={e => setFurnishingStatus(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  >
                    <option value="any">Any Furnishing</option>
                    <option value="fully_furnished">Fully Furnished</option>
                    <option value="semi_furnished">Semi Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Rent (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minRent}
                    onChange={e => setMinRent(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Rent (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRent}
                    onChange={e => setMaxRent(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800">Zero Brokerage Only</span>
                  <p className="text-[10px] text-slate-400">Filter out properties listed by agents with commission fees.</p>
                </div>
                <button
                  onClick={() => setZeroBrokerage(!zeroBrokerage)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${zeroBrokerage ? "bg-brand-primary" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${zeroBrokerage ? "translate-x-4" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {/* Collapsible More Filters */}
              <div className="border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center space-x-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-brand-primary" />
                    <span>More Filters</span>
                    {(availableFromToday || petPolicy !== "any" || parkingType !== "any" || powerBackup !== "any" || waterSupplyType !== "any" || evCharging || fiberAvailable || isVerifiedOnly) && (
                      <span className="bg-brand-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Active</span>
                    )}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showMoreFilters ? 'rotate-90' : ''}`} />
                </button>

                {showMoreFilters && (
                  <div className="p-4 space-y-3 border-t bg-white animate-in fade-in duration-150">
                    {/* Move-in Ready */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <span className="text-xs font-bold text-slate-800">Move-in Ready Now</span>
                        <p className="text-[10px] text-slate-400">Only show flats available today or earlier.</p>
                      </div>
                      <button onClick={() => setAvailableFromToday(!availableFromToday)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${availableFromToday ? "bg-brand-primary" : "bg-slate-200"
                          }`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${availableFromToday ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pet Policy</label>
                        <select value={petPolicy} onChange={e => setPetPolicy(e.target.value)} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                          <option value="any">Any Policy</option>
                          <option value="allowed">Pets Allowed</option>
                          <option value="not_allowed">No Pets</option>
                          <option value="case_by_case">Case by Case</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Parking</label>
                        <select value={parkingType} onChange={e => setParkingType(e.target.value)} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                          <option value="any">Any Parking</option>
                          <option value="two_wheeler">Two-Wheeler</option>
                          <option value="four_wheeler">Four-Wheeler</option>
                          <option value="both">Both (2W + 4W)</option>
                          <option value="none">No Parking</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Power Backup</label>
                        <select value={powerBackup} onChange={e => setPowerBackup(e.target.value)} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                          <option value="any">Any</option>
                          <option value="partial">Partial</option>
                          <option value="full">Full Backup</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Water Supply</label>
                        <select value={waterSupplyType} onChange={e => setWaterSupplyType(e.target.value)} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                          <option value="any">Any</option>
                          <option value="municipal">Municipal</option>
                          <option value="borewell">Borewell</option>
                          <option value="tanker">Tanker</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {[
                        { label: "EV Charging Available", desc: "Building has EV charging point", value: evCharging, set: setEvCharging },
                        { label: "Fiber Internet", desc: "Fiber broadband ready building", value: fiberAvailable, set: setFiberAvailable },
                        { label: "Verified Listings Only", desc: "Only show FlatNFlatmate-verified properties", value: isVerifiedOnly, set: setIsVerifiedOnly },
                      ].map(({ label, desc, value, set }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <span className="text-xs font-bold text-slate-800">{label}</span>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                          <button onClick={() => set(!value)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? "bg-brand-primary" : "bg-slate-200"
                              }`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => handleBack(8)}
                  className="px-4 py-2.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext(8)}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  <span>Search Flats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 9: SPLIT MAP + LIST RESULTS */}
      {step === 9 && (
        <div className="flex-grow w-full flex flex-col lg:flex-row relative">
          {/* Real Google Map Column (Left 40% on LG, fixed height on mobile) */}
          <div
            className="w-full lg:w-[40%] h-[300px] lg:h-[calc(100vh-100px)] relative sticky top-[80px] z-10 flex-shrink-0 p-4"
          >
            {/* Inner rounded map panel wrapper */}
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative">
              {/* Google Map Div */}
              <div ref={mapRef} className="w-full h-full">
                {!isMapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400">
                    Loading Google Map...
                  </div>
                )}
              </div>

              {/* Quick Action Map Bar */}
              <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white p-2.5 border rounded-xl shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold max-w-[70%]">
                  <Navigation className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                  <span className="truncate">
                    {searchArea ? `Commuting to ${searchArea.label}` : (poisList.length > 0 ? `Commuting to ${poisList[0].label}` : "Pune Map Center")}
                  </span>
                </div>
                <button
                  onClick={() => setShowFiltersPanel(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2.5 py-1 text-[10px] font-bold flex items-center space-x-1 border transition-colors"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Floating selected property card preview inside map */}
              {selectedPropId && (() => {
                const prop = properties.find(p => p._id.toString() === selectedPropId);
                if (!prop) return null;
                return (
                  <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-xl border shadow-lg z-20 flex items-center space-x-3 animate-in slide-in-from-bottom duration-200">
                    <img
                      src={prop.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                      className="h-14 w-18 object-cover rounded-lg border flex-shrink-0"
                      alt=""
                    />
                    <div className="flex-grow space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-800 truncate">{prop.title}</span>
                        <button onClick={() => setSelectedPropId(null)} className="p-0.5 text-slate-400 hover:text-slate-655">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="block text-[9px] text-slate-400">{prop.bhkConfig} | {prop.furnishingStatus.replace('_', ' ')}</span>
                      <span className="block text-xs font-bold text-brand-primary">₹{prop.rentAmount.toLocaleString()}/mo</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Listings Column (Right 60% on LG) */}
          <div className="w-full lg:w-[60%] p-4 lg:p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-100px)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Flats in Pune ({properties.length})</h2>
                <p className="text-xs text-slate-500">Sorted by proximity to commutes and roommate preferences compatibility.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBack(9)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 border px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Edit Filters</span>
                </button>
                <button
                  onClick={() => goToStep(1)}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center"
                >
                  Change Locality / Commute Node
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                <div className="h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Searching flats...</span>
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((prop: any, index: number) => {
                  const isHovered = hoveredPropId === prop._id.toString();
                  return (
                    <React.Fragment key={prop._id.toString()}>
                      <div
                        onMouseEnter={() => setHoveredPropId(prop._id.toString())}
                      onMouseLeave={() => setHoveredPropId(null)}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-150 ${isHovered ? "border-brand-primary/60 ring-2 ring-brand-primary/10" : "hover:border-slate-350"
                        }`}
                    >
                      {/* Cover Photo */}
                      <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                        <img
                          src={prop.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"}
                          className="h-full w-full object-cover transition-transform duration-350 hover:scale-105"
                          alt=""
                        />
                        {/* Top-left badges row */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {!prop.brokerageFlag ? (
                            <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-sm border border-emerald-500 uppercase tracking-wide">
                              Zero Brokerage
                            </span>
                          ) : (
                            <span className="bg-slate-900/80 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm border border-white/10 uppercase tracking-wide">
                              Agent
                            </span>
                          )}
                          {prop.isVerified && (
                            <span className="bg-brand-primary text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-sm border border-green-500 uppercase tracking-wide flex items-center gap-0.5">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        {/* Top-right feature badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          {prop.petPolicy === 'allowed' && (
                            <span className="bg-amber-50 text-amber-700 font-bold text-[9px] px-2 py-0.5 rounded shadow-sm border border-amber-200 uppercase tracking-wide">
                              🐾 Pet Friendly
                            </span>
                          )}
                          {prop.evChargingAvailable && (
                            <span className="bg-brand-primary text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-sm border border-brand-primary uppercase tracking-wide">
                              ⚡ EV Charging
                            </span>
                          )}
                        </div>
                        {/* Commute distance badge */}
                        {prop.distanceKm !== null && (
                          prop.inProximity !== false ? (
                            <span className="absolute bottom-3 right-3 bg-brand-primary/90 text-white font-semibold text-[10px] px-2 py-1 rounded-lg shadow-sm border border-brand-secondary flex items-center space-x-1 animate-in zoom-in-95">
                              <Car className="h-3 w-3 text-brand-primary" />
                              <span>{prop.distanceKm} km ({prop.commuteTimeMin}m)</span>
                            </span>
                          ) : (
                            <span className="absolute bottom-3 right-3 bg-amber-600/95 text-white font-semibold text-[10px] px-2 py-1 rounded-lg shadow-sm border border-amber-500 flex items-center space-x-1 animate-in zoom-in-95" title="Outside selected commute distance boundary">
                              <Car className="h-3 w-3 text-amber-200 animate-pulse" />
                              <span>{prop.distanceKm} km ({prop.commuteTimeMin}m) • Outside</span>
                            </span>
                          )
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {prop.bhkConfig} Flat • {prop.furnishingStatus.replace('_', ' ')}
                          </span>
                          <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">{prop.title}</h3>
                          <span className="text-[10px] text-slate-500 block">Locality: {prop.localityId?.name}</span>

                          {/* Nearby Amenity & POI Commute Badges Row */}
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {/* POI Commutes */}
                            {prop.commuteDetails?.slice(1, 3).map((det: any) => (
                              <span key={det.label} className="bg-brand-primary/10 text-brand-primary text-[9px] font-semibold px-2 py-0.5 rounded border border-brand-primary/15">
                                🚗 {det.durationMin}m ({det.distanceKm} km) to {det.label}
                              </span>
                            ))}

                            {/* Stated Preference Badges */}
                            {gymGuy === "Definitely" && prop.nearbyAmenities?.gyms > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
                                🏋️ {prop.nearbyAmenities.gyms} Gyms {prop.nearbyAmenities.gymsMinDist ? `(${prop.nearbyAmenities.gymsMinDist} km)` : "nearby"}
                              </span>
                            )}
                            {outsideEater && outsideEater !== "No, only homemade foodie" && prop.nearbyAmenities?.cafes > 0 && (
                              <span className="bg-amber-50 text-amber-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                                🍕 Food {prop.nearbyAmenities.cafesMinDist ? `(${prop.nearbyAmenities.cafesMinDist} km)` : "places"}
                              </span>
                            )}
                            {socialType === "Socializing" && prop.nearbyAmenities?.nightlife > 0 && (
                              <span className="bg-purple-50 text-purple-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-purple-200">
                                🥳 Clubs & cafes {prop.nearbyAmenities.nightlifeMinDist ? `(${prop.nearbyAmenities.nightlifeMinDist} km)` : "nearby"}
                              </span>
                            )}
                            {socialType === "Reserved" && prop.nearbyAmenities?.nightlife === 0 && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                                🤫 Quiet area
                              </span>
                            )}

                            {/* Fallback Badges */}
                            {(!gymGuy || prop.nearbyAmenities?.gyms === 0) && prop.nearbyAmenities?.transit > 0 && (
                              <span className="bg-brand-tertiary/10 text-brand-tertiary text-[9px] font-semibold px-2 py-0.5 rounded border border-brand-tertiary/20">
                                🚇 Metro {prop.nearbyAmenities.transitMinDist ? `(${prop.nearbyAmenities.transitMinDist} km)` : "nearby"}
                              </span>
                            )}
                            {prop.nearbyAmenities?.supermarkets > 0 && (
                              <span className="bg-teal-50 text-teal-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-teal-200">
                                🛒 Supermarket {prop.nearbyAmenities.supermarketsMinDist ? `(${prop.nearbyAmenities.supermarketsMinDist} km)` : "nearby"}
                              </span>
                            )}
                            {prop.nearbyAmenities?.hospitals > 0 && (
                              <span className="bg-red-50 text-red-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-red-200">
                                🏥 Hospital {prop.nearbyAmenities.hospitalsMinDist ? `(${prop.nearbyAmenities.hospitalsMinDist} km)` : "nearby"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Roommates summaries (if attached) */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-grow flex flex-col justify-center my-1.5 min-h-[52px]">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center">
                            <Home className="h-3 w-3 mr-1 text-brand-primary" />
                            Roommate Profile Status
                          </p>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            {prop.roommateMatchCount > 0 ? (
                              prop.roommateCompatibility !== null ? (
                                <span>
                                  🤝 <strong className="text-brand-primary font-bold">{prop.roommateCompatibility}% Compatibility</strong> with {prop.roommateMatchCount} active flatmate(s).
                                </span>
                              ) : (
                                <span>Flat shared by {prop.roommateMatchCount} active flatmate(s).</span>
                              )
                            ) : (
                              <span>No active flatmate profiles listed yet for this property.</span>
                            )}
                          </p>
                        </div>

                        {/* Cost & action buttons */}
                        <div className="flex items-center justify-between border-t pt-3 mt-1">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-medium">Rent</span>
                            <span className="text-sm font-bold text-slate-800">₹{prop.rentAmount.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400">/mo</span>
                          </div>
                          <Link href={`/flat/${prop._id}`}>
                            <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1 transition-colors">
                              <span>Details</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>

                      {/* Repeating Facebook Community CTA every 8 items OR at end of results */}
                      {((index + 1) % 8 === 0 || index + 1 === properties.length) && (
                        <FacebookGroupCTA
                          key={`fb-cta-${index}`}
                          groups={facebookGroups}
                          category="flats"
                          isBlank={false}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 text-slate-400 text-xs">
                  No flats found matching your selected budget or commute distance in Pune.
                </div>
                <FacebookGroupCTA groups={facebookGroups} category="flats" isBlank={true} />
              </div>
            )}
          </div>

          {/* Slide-over Filter Panel */}
          {showFiltersPanel && (
            <div className="absolute inset-0 bg-slate-900/40 z-30 flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-1.5 text-brand-primary" />
                      Refine Search
                    </span>
                    <button onClick={() => setShowFiltersPanel(false)} className="p-1 text-slate-400 hover:text-slate-650 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Max commute distance */}
                    {poisList.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Proximity Distance</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="2000"
                            max="40000"
                            step="1000"
                            value={distance}
                            onChange={e => setDistance(e.target.value)}
                            className="w-full h-1 bg-brand-primary/15 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                          />
                          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{(parseInt(distance) / 1000).toFixed(0)} km</span>
                        </div>
                      </div>
                    )}

                    {/* BHK configurations */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">BHK Config</label>
                      <select
                        value={bhkConfig}
                        onChange={e => setBhkConfig(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Configuration</option>
                        <option value="1RK">1 RK</option>
                        <option value="1BHK">1 BHK</option>
                        <option value="2BHK">2 BHK</option>
                        <option value="3BHK">3 BHK</option>
                      </select>
                    </div>

                    {/* Rent inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Rent</label>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minRent}
                          onChange={e => setMinRent(e.target.value)}
                          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Rent</label>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxRent}
                          onChange={e => setMaxRent(e.target.value)}
                          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Furnishing status */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Furnishing Status</label>
                      <select
                        value={furnishingStatus}
                        onChange={e => setFurnishingStatus(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Status</option>
                        <option value="fully_furnished">Fully Furnished</option>
                        <option value="semi_furnished">Semi Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    {/* Tenant preference */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tenant Preference</label>
                      <select
                        value={tenantPreference}
                        onChange={e => setTenantPreference(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Preference</option>
                        <option value="bachelors">Bachelors</option>
                        <option value="family">Family</option>
                        <option value="girls">Girls Only</option>
                        <option value="boys">Boys Only</option>
                      </select>
                    </div>

                    {/* Zero brokerage */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                      <span className="text-xs font-semibold text-slate-700">Zero Brokerage Only</span>
                      <button
                        onClick={() => setZeroBrokerage(!zeroBrokerage)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${zeroBrokerage ? "bg-brand-primary" : "bg-slate-200"
                          }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${zeroBrokerage ? "translate-x-4" : "translate-x-0"
                          }`} />
                      </button>
                    </div>

                    {/* Additional filters */}
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">More Filters</p>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg">
                        <span className="text-xs font-semibold text-slate-700">Move-in Ready Now</span>
                        <button onClick={() => setAvailableFromToday(!availableFromToday)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${availableFromToday ? "bg-brand-primary" : "bg-slate-200"}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${availableFromToday ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pet Policy</label>
                          <select value={petPolicy} onChange={e => setPetPolicy(e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary">
                            <option value="any">Any</option>
                            <option value="allowed">Pets Allowed</option>
                            <option value="not_allowed">No Pets</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Parking</label>
                          <select value={parkingType} onChange={e => setParkingType(e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary">
                            <option value="any">Any</option>
                            <option value="two_wheeler">Two-Wheeler</option>
                            <option value="four_wheeler">Four-Wheeler</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Power Backup</label>
                          <select value={powerBackup} onChange={e => setPowerBackup(e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary">
                            <option value="any">Any</option>
                            <option value="partial">Partial</option>
                            <option value="full">Full</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Water Supply</label>
                          <select value={waterSupplyType} onChange={e => setWaterSupplyType(e.target.value)} className="w-full text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary">
                            <option value="any">Any</option>
                            <option value="municipal">Municipal</option>
                            <option value="borewell">Borewell</option>
                          </select>
                        </div>
                      </div>

                      {[
                        { label: "EV Charging", value: evCharging, set: setEvCharging },
                        { label: "Fiber Internet", value: fiberAvailable, set: setFiberAvailable },
                        { label: "Verified Only", value: isVerifiedOnly, set: setIsVerifiedOnly },
                      ].map(({ label, value, set }) => (
                        <div key={label} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg">
                          <span className="text-xs font-semibold text-slate-700">{label}</span>
                          <button onClick={() => set(!value)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? "bg-brand-primary" : "bg-slate-200"}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFiltersPanel(false)}
                  className="w-full bg-brand-primary hover:bg-brand-primary text-white rounded-lg py-2.5 text-xs font-semibold transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
