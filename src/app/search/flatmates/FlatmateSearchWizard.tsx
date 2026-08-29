'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, Search, Navigation,
  ChevronRight, Car, X, Home, User as UserIcon
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles } from "@/lib/mapStyles";

interface POI {
  _id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

export default function FlatmateSearchWizard({ pois }: { pois: POI[] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seekers, setSeekers] = useState<any[]>([]);

  // Search Intent (Flow selection)
  const [searchIntent, setSearchIntent] = useState<"ROOMMATE_WITH_FLAT" | "FLATMATE_ONLY">("ROOMMATE_WITH_FLAT");

  // Geolocation Search Area & POIs State
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
  const [poiSearchInput, setPoiSearchInput] = useState("");
  const [distance, setDistance] = useState("5000"); // in meters

  // Lifestyle Preferences State
  const [prefUserType, setPrefUserType] = useState<string>(""); // Student, Professional, Retired, No preference
  const [myUserType, setMyUserType] = useState<string>(""); // Student, Professional
  const [prefProfession, setPrefProfession] = useState<string>("");
  const [prefShift, setPrefShift] = useState<string>("");
  const [personality, setPersonality] = useState<string>(""); // Outgoing & social, Quiet & keeps to themselves, Either works

  // Lifestyle preferences multi-fields
  const [cleanliness, setCleanliness] = useState<string>(""); // Very tidy, Reasonably clean, Relaxed
  const [food, setFood] = useState<string>(""); // Vegetarian, Non-vegetarian, Vegan, No preference
  const [smoking, setSmoking] = useState<string>(""); // Smoker-friendly, Non-smoker only, No preference
  const [sleep, setSleep] = useState<string>(""); // Early riser, Night owl, Flexible

  // Budget, Age, and Gender States
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("any");

  // Slide-over Filter Panel States (additional runtime filters)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filterCleanliness, setFilterCleanliness] = useState("any");
  const [filterFood, setFilterFood] = useState("any");
  const [filterSmoking, setFilterSmoking] = useState("any");
  const [filterSleep, setFilterSleep] = useState("any");

  const [hoveredSeekerId, setHoveredSeekerId] = useState<string | null>(null);
  const [selectedSeekerId, setSelectedSeekerId] = useState<string | null>(null);

  // Google Maps Instance Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isMapsLoaded = useGoogleMapsLoaded();

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("search_intent", searchIntent);
      if (searchArea) {
        params.append("searchAreaLat", searchArea.lat.toString());
        params.append("searchAreaLng", searchArea.lng.toString());
      }
      if (poisList.length > 0) {
        params.append("pois", JSON.stringify(poisList));
      }
      params.append("distance", distance);

      // Translate copy labels to DB values
      const mapCleanliness = (val: string) => {
        if (val === "Very tidy") return "high";
        if (val === "Reasonably clean") return "moderate";
        if (val === "Relaxed") return "low";
        return val;
      };

      const mapFood = (val: string) => {
        if (val === "Vegetarian") return "veg_only";
        if (val === "Non-vegetarian") return "any";
        if (val === "Vegan") return "veg_only";
        return val;
      };

      const mapSmoking = (val: string) => {
        if (val === "Smoker-friendly") return "yes";
        if (val === "Non-smoker only") return "no";
        return val;
      };

      const mapSleep = (val: string) => {
        if (val === "Early riser") return "early_bird";
        if (val === "Night owl") return "night_owl";
        if (val === "Flexible") return "flexible";
        return val;
      };

      params.append(
        "flatmatePreferences",
        JSON.stringify({
          userType: prefUserType === "No preference" ? "Any" : prefUserType,
          profession: prefProfession,
          shift: prefShift,
          socialType: personality === "Outgoing & social" ? "Socializing" : (personality === "Quiet & keeps to themselves" ? "Reserved" : "Any"),
          gymGuy: "Maybe",
          outsideEater: "Only evening small snacks",
        })
      );

      if (gender && gender !== "any") params.append("gender", gender);
      if (minAge) params.append("minAge", minAge);
      if (maxAge) params.append("maxAge", maxAge);
      if (minBudget) params.append("minBudget", minBudget);
      if (maxBudget) params.append("maxBudget", maxBudget);

      // Lifestyle preferences filters from Step 6 / Slide-over
      const finalClean = filterCleanliness !== "any" ? filterCleanliness : mapCleanliness(cleanliness);
      const finalFood = filterFood !== "any" ? filterFood : mapFood(food);
      const finalSmoke = filterSmoking !== "any" ? filterSmoking : mapSmoking(smoking);
      const finalSleep = filterSleep !== "any" ? filterSleep : mapSleep(sleep);

      if (finalClean) params.append("cleanliness", finalClean);
      if (finalFood) params.append("food", finalFood);
      if (finalSmoke) params.append("smoking", finalSmoke);
      if (finalSleep) params.append("sleep", finalSleep);

      const res = await fetch(`/api/search/flatmates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSeekers(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load flatmate search results", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 8) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    searchIntent,
    searchArea,
    poisList,
    distance,
    prefUserType,
    myUserType,
    prefProfession,
    prefShift,
    personality,
    cleanliness,
    food,
    smoking,
    sleep,
    gender,
    minAge,
    maxAge,
    minBudget,
    maxBudget,
    filterCleanliness,
    filterFood,
    filterSmoking,
    filterSleep,
  ]);

  const handleNext = (currentStep: number) => {
    if (currentStep === 3 && prefUserType !== "Professional") {
      // Skip Profession and Shift if not looking for Professional
      setStep(6);
    } else if (currentStep === 4 && myUserType !== "Professional") {
      // Skip Profession and Shift details if searcher is not Professional
      setStep(6);
    } else {
      setStep(currentStep + 1);
    }
  };

  const handleBack = (currentStep: number) => {
    if (currentStep === 6) {
      if (prefUserType === "Professional") {
        setStep(5);
      } else {
        setStep(3);
      }
    } else {
      setStep(currentStep - 1);
    }
  };

  // Google Map Initialization (Flow 1 ONLY)
  useEffect(() => {
    if (!isMapsLoaded || step !== 8 || searchIntent !== "ROOMMATE_WITH_FLAT" || !mapRef.current) return;

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

    // Blue marker for Search Area center
    if (searchArea) {
      new (window as any).google.maps.Marker({
        position: { lat: searchArea.lat, lng: searchArea.lng },
        map: map,
        title: `Preferred Area: ${searchArea.label}`,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    }

    // Red markers for Commute POIs
    poisList.forEach((poi) => {
      new (window as any).google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: map,
        title: `POI: ${poi.label}`,
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });
    });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [isMapsLoaded, step, searchIntent, searchArea, poisList]);

  // Seeker map markers (Flow 1 ONLY)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsLoaded || searchIntent !== "ROOMMATE_WITH_FLAT") return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    seekers.forEach((seeker: any) => {
      if (!seeker.property) return;
      const coords = { lat: seeker.property.lat, lng: seeker.property.lng };

      const isSelected = selectedSeekerId === seeker._id;
      const isHovered = hoveredSeekerId === seeker._id;

      const marker = new (window as any).google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        label: {
          text: seeker.name.charAt(0).toUpperCase(),
          color: isSelected || isHovered ? "#ffffff" : "#097969",
          fontSize: "11px",
          fontWeight: "bold",
          fontFamily: "Inter, sans-serif",
        },
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: isSelected || isHovered ? 18 : 14,
          fillColor: isSelected || isHovered ? "#097969" : "#ffffff",
          fillOpacity: 1,
          strokeColor: isSelected || isHovered ? "#0b8a78" : "#c7d2fe",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedSeekerId(isSelected ? null : seeker._id);
      });

      markersRef.current.push(marker);
    });
  }, [seekers, selectedSeekerId, hoveredSeekerId, isMapsLoaded, searchIntent]);

  // Autocomplete setup for Step 2 area and POIs
  useEffect(() => {
    if (!isMapsLoaded || step !== 2) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.4, 73.6),
      new (window as any).google.maps.LatLng(18.7, 74.1)
    );

    const isWithinPune = (lat: number, lng: number) => {
      return lat >= 18.35 && lat <= 18.75 && lng >= 73.55 && lng <= 74.15;
    };

    const areaInput = document.getElementById("search-area-autocomplete") as HTMLInputElement;
    if (areaInput) {
      const areaAutocomplete = new (window as any).google.maps.places.Autocomplete(areaInput, {
        componentRestrictions: { country: "in" },
        bounds: puneBounds,
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
          setSearchArea({ label: displayLabel, lat, lng });
          setSearchAreaInput(displayLabel);
        }
      });
    }

    const poiInput = document.getElementById("poi-autocomplete") as HTMLInputElement;
    if (poiInput) {
      const poiAutocomplete = new (window as any).google.maps.places.Autocomplete(poiInput, {
        componentRestrictions: { country: "in" },
        bounds: puneBounds,
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

          setPoisList((prev) => {
            if (prev.some((p) => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          setPoiSearchInput("");
          poiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, step]);

  // Choice step rendering method
  const renderChoiceStep = (
    stepNum: number,
    question: string,
    description: string,
    currentValue: string,
    onChange: (val: string) => void,
    options: { label: string; emoji: string }[],
    onNext: () => void,
    onBack: () => void,
    onSkip?: () => void
  ) => {
    return (
      <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
        <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-1.5 border-b pb-4">
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Step {stepNum} of 8
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{question}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const isSelected = currentValue === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onChange(opt.label)}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 group ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                      : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl mb-3 transition-transform duration-250 group-hover:scale-115 ${
                      isSelected ? "bg-brand-primary/15" : "bg-slate-100"
                    }`}
                  >
                    {opt.emoji}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-brand-primary" : "text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t">
            <button
              onClick={onBack}
              className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={!currentValue}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryHover disabled:opacity-40 disabled:hover:bg-brand-primary text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-slate-650 font-semibold px-2"
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
      {/* STEP 1: BRANCHING INTENT SELECTION */}
      {step === 1 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5 border-b pb-4">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 1 of 8
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                What are you looking for?
              </h2>
              <p className="text-xs text-slate-500">
                This helps us ask the right questions and show you the right matches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSearchIntent("ROOMMATE_WITH_FLAT")}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 group text-center ${
                  searchIntent === "ROOMMATE_WITH_FLAT"
                    ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                }`}
              >
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-3 group-hover:scale-105 transition-transform">
                  🏠
                </div>
                <span className="text-sm font-extrabold text-slate-800">A flat with a flatmate</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Find a room in someone's existing flat.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSearchIntent("FLATMATE_ONLY")}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 group text-center ${
                  searchIntent === "FLATMATE_ONLY"
                    ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                }`}
              >
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-3 group-hover:scale-105 transition-transform">
                  🤝
                </div>
                <span className="text-sm font-extrabold text-slate-800">Just a flatmate</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Team up with someone else who's also searching, and find a flat together.
                </span>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION & POIS */}
      {step === 2 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5 border-b pb-4">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 2 of 8
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                {searchIntent === "ROOMMATE_WITH_FLAT"
                  ? "Where should your flatmate's flat be?"
                  : "Which area are you searching in?"}
              </h2>
              <p className="text-xs text-slate-500">
                {searchIntent === "ROOMMATE_WITH_FLAT"
                  ? "We'll only show flatmates whose flat is in this area, and close to the places you travel to often."
                  : "We'll match you with flatmates who are also looking to rent here."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Search Area Locality Input */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-slate-500 uppercase">
                  {searchIntent === "ROOMMATE_WITH_FLAT" ? "Preferred Area" : "Search Area"}
                </label>
                <div className="relative border rounded-lg border-brand-primary bg-brand-primary/10/20">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Navigation className="h-3.5 w-3.5 text-brand-primary" />
                  </div>
                  <input
                    id="search-area-autocomplete"
                    type="text"
                    placeholder="Search a neighborhood (e.g. Hinjewadi, Baner)..."
                    value={searchAreaInput}
                    onChange={(e) => setSearchAreaInput(e.target.value)}
                    className="w-full text-xs border rounded-lg pl-9 pr-8 py-2.5 bg-slate-50 outline-brand-primary shadow-sm"
                  />
                  {searchArea && (
                    <button
                      onClick={() => {
                        setSearchArea(null);
                        setSearchAreaInput("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Autocomplete for Custom POIs */}
              <div className="space-y-1.5">
                <div className="flex flex-col">
                  <label className="block text-[12px] font-bold text-slate-500 uppercase">
                    Your Daily Destinations
                  </label>
                  <p className="block text-[10px] text-slate-450">
                    Add your office, college, or gym…
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-455" />
                  </div>
                  <input
                    id="poi-autocomplete"
                    type="text"
                    placeholder="Work, college, gym — anywhere you travel to often..."
                    value={poiSearchInput}
                    onChange={(e) => setPoiSearchInput(e.target.value)}
                    className="w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 outline-brand-primary shadow-sm"
                  />
                </div>
                {searchIntent === "ROOMMATE_WITH_FLAT" && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    We'll show distance and travel time from the flat to each of these.
                  </p>
                )}
              </div>

              {/* Selected POIs List Chips */}
              {poisList.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    Daily Destinations List ({poisList.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {poisList.map((poi) => (
                      <span
                        key={poi.label}
                        className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/15 text-brand-primaryHover text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                      >
                        <Car className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{poi.label}</span>
                        <button
                          onClick={() => setPoisList((prev) => prev.filter((p) => p.label !== poi.label))}
                          className="hover:text-red-500 font-extrabold focus:outline-none"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Distance range slider */}
              {(searchArea || poisList.length > 0) && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                    Max Commute Proximity Boundary
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="2000"
                      max="40000"
                      step="1000"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full h-1.5 bg-brand-primary/15 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {(parseInt(distance) / 1000).toFixed(0)} km
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext(2)}
                  disabled={!searchArea && poisList.length === 0}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover disabled:opacity-40 disabled:hover:bg-brand-primary text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LOOKING FOR STATUS */}
      {step === 3 &&
        renderChoiceStep(
          3,
          "Student or working professional?",
          searchIntent === "ROOMMATE_WITH_FLAT"
            ? "Tell us what kind of flatmate you're hoping to find."
            : "Tell us what kind of flatmate you're hoping to team up with.",
          prefUserType,
          setPrefUserType,
          [
            { label: "Student", emoji: "🎓" },
            { label: "Professional", emoji: "💼" },
            { label: "No preference", emoji: "🤝" },
          ],
          () => handleNext(3),
          () => handleBack(3)
        )}

      {/* STEP 4: AND WHAT ABOUT YOU? */}
      {step === 4 &&
        renderChoiceStep(
          4,
          "And what about you?",
          "This helps us match you with the right people and surface nearby places, like your college or office.",
          myUserType,
          setMyUserType,
          [
            { label: "Student", emoji: "🎓" },
            { label: "Professional", emoji: "💼" },
          ],
          () => handleNext(4),
          () => handleBack(4)
        )}

      {/* STEP 5: PERSONALITY */}
      {step === 5 &&
        renderChoiceStep(
          5,
          "What kind of flatmate do you get along with?",
          "Pick what fits best — we'll match you with people who share your vibe.",
          personality,
          setPersonality,
          [
            { label: "Outgoing & social", emoji: "🥳" },
            { label: "Quiet & keeps to themselves", emoji: "🤫" },
            { label: "Either works", emoji: "✨" },
          ],
          () => handleNext(5),
          () => handleBack(5)
        )}

      {/* STEP 6: LIFESTYLE MULTI-FIELDS */}
      {step === 6 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5 border-b pb-4">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 6 of 8
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Any lifestyle preferences?</h2>
              <p className="text-xs text-slate-500">Set what matters to you — we'll filter out mismatches.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cleanliness</label>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">Select option</option>
                  <option value="Very tidy">Very tidy</option>
                  <option value="Reasonably clean">Reasonably clean</option>
                  <option value="Relaxed">Relaxed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Food Preference</label>
                <select
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">No preference</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Smoking</label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">No preference</option>
                  <option value="Smoker-friendly">Smoker-friendly</option>
                  <option value="Non-smoker only">Non-smoker only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sleep Schedule</label>
                <select
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="">No preference</option>
                  <option value="Early riser">Early riser</option>
                  <option value="Night owl">Night owl</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t">
              <button
                onClick={() => handleBack(6)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleNext(6)}
                className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: BUDGET & PREFERENCES */}
      {step === 7 && (
        <div className="flex-grow flex items-center justify-center p-4 bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1.5 border-b pb-4">
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Step 7 of 8
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Set your budget and preferences</h2>
              <p className="text-xs text-slate-500">We'll only show results that fit within these.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Age</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Age</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t">
                <button
                  onClick={() => setStep(6)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext(7)}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  <span>Show Matches &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: SEARCH RESULTS PAGE */}
      {step === 8 && (
        <div className="flex-grow w-full flex flex-col lg:flex-row relative">
          {/* Real Google Map Column (Flow 1 ONLY) */}
          {searchIntent === "ROOMMATE_WITH_FLAT" && (
            <div className="w-full lg:w-[40%] h-[300px] lg:h-[calc(100vh-100px)] relative sticky top-[80px] z-10 flex-shrink-0 p-4">
              {/* Inner rounded map panel wrapper */}
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative">
                {/* Google Map Div */}
                <div ref={mapRef} className="w-full h-full">
                  {!isMapsLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400 font-sans">
                      Loading Google Map...
                    </div>
                  )}
                </div>

                {/* Quick Action Map Bar */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white p-2.5 border rounded-xl shadow-sm">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-750 font-semibold min-w-0">
                    <Navigation className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                    <span className="truncate">
                      {searchArea
                        ? `Searching near ${searchArea.label}`
                        : poisList.length > 0
                        ? `Searching near ${poisList[0].label}`
                        : "Pune Map Center"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFiltersPanel(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2.5 py-1 text-[10px] font-bold flex items-center space-x-1 border transition-colors flex-shrink-0"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Floating selected preview card */}
                {selectedSeekerId && (() => {
                  const seeker = seekers.find((s) => s._id === selectedSeekerId);
                  if (!seeker) return null;
                  return (
                    <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-xl border shadow-lg z-20 flex items-center space-x-3 animate-in slide-in-from-bottom duration-200">
                      <div className="h-12 w-12 rounded-full bg-brand-primary/10 border flex items-center justify-center text-brand-primary font-bold text-xs flex-shrink-0">
                        {seeker.profilePhoto ? (
                          <img
                            src={seeker.profilePhoto}
                            alt={seeker.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          seeker.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-grow space-y-0.5 min-w-0 font-sans">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-800 truncate">
                            {seeker.name} ({seeker.age}, {seeker.gender})
                          </span>
                          <button
                            onClick={() => setSelectedSeekerId(null)}
                            className="p-0.5 text-slate-400 hover:text-slate-650"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="block text-[9px] text-slate-400 truncate">
                          {seeker.profession} • Match Score:{" "}
                          <strong className="text-brand-primary">{seeker.matchScore}%</strong>
                        </span>
                        <span className="block text-[9px] text-brand-primary font-bold">
                          Budget: ₹{seeker.budgetMin.toLocaleString()} - ₹{seeker.budgetMax.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* List Column (Takes full width if map is disabled in Flow 2) */}
          <div className={`p-4 lg:p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-100px)] ${
            searchIntent === "ROOMMATE_WITH_FLAT" ? "w-full lg:w-[60%]" : "w-full"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-sans">
                  Pune Roommates ({seekers.length})
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  {searchIntent === "ROOMMATE_WITH_FLAT"
                    ? "Flatmates who already own/rent a flat."
                    : "Flatmates searching for flats together."}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {searchIntent === "FLATMATE_ONLY" && (
                  <button
                    onClick={() => setShowFiltersPanel(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2.5 py-1 text-[10px] font-bold flex items-center space-x-1 border transition-colors flex-shrink-0"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Filters</span>
                  </button>
                )}
                <button
                  onClick={() => setStep(1)}
                  className="text-[10px] font-bold text-brand-primary hover:underline flex items-center font-sans"
                >
                  Reset Search Filters
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400 space-y-2 font-sans">
                <div className="h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Searching active seekers...</span>
              </div>
            ) : seekers.length > 0 ? (
              <div className={`grid gap-5 ${
                searchIntent === "ROOMMATE_WITH_FLAT" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {seekers.map((seeker: any) => {
                  const isHovered = hoveredSeekerId === seeker._id;

                  // Extract habits for chips
                  const cleanlinessTag = seeker.vibePreferences
                    ?.find((v: string) => v.startsWith("cleanliness:"))
                    ?.split(":")[1];
                  const foodTag = seeker.vibePreferences
                    ?.find((v: string) => v.startsWith("food:"))
                    ?.split(":")[1];

                  if (searchIntent === "ROOMMATE_WITH_FLAT" && seeker.property) {
                    // PROPERTY-FIRST CARD DESIGN
                    const prop = seeker.property;
                    const coverImage =
                      prop.images?.find((img: any) => img.isCover)?.url ||
                      prop.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

                    return (
                      <div
                        key={seeker._id}
                        onMouseEnter={() => setHoveredSeekerId(seeker._id)}
                        onMouseLeave={() => setHoveredSeekerId(null)}
                        className={`bg-white border rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-150 font-sans ${
                          isHovered
                            ? "border-brand-primary/60 ring-2 ring-brand-primary/10"
                            : "hover:border-slate-350"
                        }`}
                      >
                        {/* Property Image on top */}
                        <div className="h-44 w-full bg-slate-100 relative">
                          <img
                            src={coverImage}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-3 left-3 bg-white/95 text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm border border-slate-200">
                            {prop.bhkConfig}
                          </span>
                          {seeker.distanceKm !== null && seeker.distanceKm !== undefined && (
                            <span className="absolute bottom-3 right-3 bg-brand-primary/90 text-white font-semibold text-[10px] px-2 py-1 rounded-lg shadow-sm border border-brand-secondary flex items-center space-x-1">
                              <Car className="h-3 w-3 text-brand-primary/60" />
                              <span>
                                {seeker.distanceKm} km commute ({seeker.commuteTimeMin}m)
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-850 truncate">
                              {prop.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              📍 {prop.localityName}
                            </span>
                          </div>

                          {/* Amenity Badges */}
                          {seeker.nearbyAmenities && (
                            <div className="flex flex-wrap gap-1">
                              {seeker.nearbyAmenities.gyms > 0 && (
                                <span className="bg-bg-status-successBg/15 text-brand-primary text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                                  🏋️ Gym (
                                  {seeker.nearbyAmenities.gymsMinDist
                                    ? `${seeker.nearbyAmenities.gymsMinDist} km`
                                    : "nearby"}
                                  )
                                </span>
                              )}
                              {seeker.nearbyAmenities.cafes > 0 && (
                                <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-100">
                                  🍕 Food (
                                  {seeker.nearbyAmenities.cafesMinDist
                                    ? `${seeker.nearbyAmenities.cafesMinDist} km`
                                    : "nearby"}
                                  )
                                </span>
                              )}
                              {seeker.nearbyAmenities.supermarkets > 0 && (
                                <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-teal-100">
                                  🛒 Mart (
                                  {seeker.nearbyAmenities.supermarketsMinDist
                                    ? `${seeker.nearbyAmenities.supermarketsMinDist} km`
                                    : "nearby"}
                                  )
                                </span>
                              )}
                            </div>
                          )}

                          {/* Flatmate Box Divider */}
                          <div className="border-t pt-2.5 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-[10px] text-slate-700 uppercase flex-shrink-0">
                                {seeker.profilePhoto ? (
                                  <img
                                    src={seeker.profilePhoto}
                                    alt={seeker.name}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  seeker.name.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-[10px] font-bold text-slate-800 truncate">
                                  {seeker.name}
                                </h5>
                                <span className="text-[8px] text-slate-400 block truncate">
                                  {seeker.age} • {seeker.gender} • {seeker.profession}
                                </span>
                              </div>
                            </div>

                            {/* Match score */}
                            <div className="bg-brand-primary/10 text-brand-primaryHover px-2 py-0.5 rounded border border-brand-primary/15 flex flex-col items-center flex-shrink-0">
                              <span className="text-[10px] font-extrabold leading-none">
                                {seeker.matchScore}%
                              </span>
                              <span className="text-[6px] font-bold uppercase tracking-wider mt-0.5 text-brand-primary">
                                Match
                              </span>
                            </div>
                          </div>

                          {/* Details Link buttons */}
                          <div className="flex items-center justify-between border-t pt-2.5 mt-2">
                            <div>
                              <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">
                                Rent /mo
                              </span>
                              <span className="text-xs font-bold text-brand-primaryHover">
                                ₹{prop.rentAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex space-x-1.5">
                              <Link href={`/flatmate/${seeker._id}`}>
                                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors flex items-center">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  <span>Owner</span>
                                </button>
                              </Link>
                              <Link href={`/flat/${prop._id}`}>
                                <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors flex items-center">
                                  <span>View Flat & Flatmate</span>
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // FLATMATE-FIRST CARD DESIGN (Flow 2)
                    return (
                      <div
                        key={seeker._id}
                        onMouseEnter={() => setHoveredSeekerId(seeker._id)}
                        onMouseLeave={() => setHoveredSeekerId(null)}
                        className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-150 font-sans ${
                          isHovered
                            ? "border-brand-primary/60 ring-2 ring-brand-primary/10"
                            : "hover:border-slate-350"
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* Card Header (Photo/Name/Match) */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-11 w-11 rounded-full bg-brand-primary/10 border border-brand-primary/15 flex items-center justify-center text-brand-primary font-extrabold text-sm uppercase">
                                {seeker.profilePhoto ? (
                                  <img
                                    src={seeker.profilePhoto}
                                    alt={seeker.name}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  seeker.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">
                                  {seeker.name}
                                </h3>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">
                                  {seeker.age} yrs • {seeker.gender} • {seeker.profession}
                                </span>
                              </div>
                            </div>

                            <div className="bg-brand-primary/10 text-brand-primaryHover px-2 py-1 rounded-lg border border-brand-primary/15 flex flex-col items-center shadow-inner">
                              <span className="text-xs font-extrabold leading-none">
                                {seeker.matchScore}%
                              </span>
                              <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5 text-brand-primary">
                                Match
                              </span>
                            </div>
                          </div>

                          {/* Bio snippet */}
                          {seeker.bio && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                              &ldquo;{seeker.bio}&rdquo;
                            </p>
                          )}

                          {/* Commute distance info if selected */}
                          {seeker.distanceKm !== null && (
                            <span className="inline-flex items-center space-x-1 bg-brand-primary/10/50 text-brand-primaryHover font-semibold text-[9px] px-2 py-0.5 rounded border border-brand-primary/15">
                              <Car className="h-3 w-3 text-brand-primary/60" />
                              <span>
                                {seeker.distanceKm} km from target area ({seeker.commuteTimeMin}m)
                              </span>
                            </span>
                          )}

                          {/* Target Locations */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              Looking in:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {seeker.targetLocations.map((loc: any) => (
                                <span
                                  key={loc._id}
                                  className="text-[8px] bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded font-medium border"
                                >
                                  {loc.name}
                                </span>
                              ))}
                              {seeker.targetLocations.length === 0 && (
                                <span className="text-[9px] text-slate-400">Any area in Pune</span>
                              )}
                            </div>
                          </div>

                          {/* Lifestyle Badges */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {cleanlinessTag && (
                              <span className="text-[8px] bg-bg-status-successBg/15 text-brand-primary border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase">
                                Clean: {cleanlinessTag}
                              </span>
                            )}
                            {foodTag && (
                              <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-bold uppercase">
                                Food: {foodTag.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cost & action buttons */}
                        <div className="flex items-center justify-between border-t pt-3 mt-3">
                          <div>
                            <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">
                              Budget
                            </span>
                            <span className="text-xs font-extrabold text-brand-primary">
                              ₹{(seeker.budgetMin / 1000).toFixed(0)}k - ₹
                              {(seeker.budgetMax / 1000).toFixed(0)}k
                            </span>
                            <span className="text-[9px] text-slate-400">/mo</span>
                          </div>
                          <Link href={`/flatmate/${seeker._id}`}>
                            <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1 transition-colors shadow-sm">
                              <span>View Profile</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed rounded-xl bg-slate-50 text-slate-450 text-xs font-sans">
                No active seekers found matching your compatibility criteria. Try broadening your
                filters.
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
                      Refine Seeker Filters
                    </span>
                    <button
                      onClick={() => setShowFiltersPanel(false)}
                      className="p-1 text-slate-400 hover:text-slate-655 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Gender */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Budget inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                          Min Budget
                        </label>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minBudget}
                          onChange={(e) => setMinBudget(e.target.value)}
                          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                          Max Budget
                        </label>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxBudget}
                          onChange={(e) => setMaxBudget(e.target.value)}
                          className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Cleanliness */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Cleanliness
                      </label>
                      <select
                        value={filterCleanliness}
                        onChange={(e) => setFilterCleanliness(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Cleanliness</option>
                        <option value="high">Obsessive (Very Clean)</option>
                        <option value="moderate">Moderate</option>
                        <option value="low">Laid-back (Relaxed)</option>
                      </select>
                    </div>

                    {/* Food */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Food Policy
                      </label>
                      <select
                        value={filterFood}
                        onChange={(e) => setFilterFood(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any food</option>
                        <option value="veg_only">Strict Veg</option>
                        <option value="egg_allowed">Eggetarian</option>
                      </select>
                    </div>

                    {/* Smoking */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Smoking Policy
                      </label>
                      <select
                        value={filterSmoking}
                        onChange={(e) => setFilterSmoking(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Policy</option>
                        <option value="no">Strictly Non-smoker</option>
                        <option value="occasional">Occasional</option>
                        <option value="yes">No restrictions</option>
                      </select>
                    </div>

                    {/* Sleep */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Sleep Schedule
                      </label>
                      <select
                        value={filterSleep}
                        onChange={(e) => setFilterSleep(e.target.value)}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                      >
                        <option value="any">Any Schedule</option>
                        <option value="early_bird">Early Bird</option>
                        <option value="night_owl">Night Owl</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFiltersPanel(false)}
                  className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors mt-4"
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
