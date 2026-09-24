'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, Search, Navigation,
  ChevronRight, ChevronUp, ChevronDown, MapPin, Car, X, Home,
  Heart, Phone, Mail, CheckCircle2, Loader2, UserCheck, Edit3
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles, getResponsiveMapStyles } from "@/lib/mapStyles";
import { colors } from "@/theme/colors";
import FacebookGroupCTA, { FacebookGroupData } from "@/components/FacebookGroupCTA";
import { recordPropertyCallAction, recordPropertyWhatsappAction } from "@/app/flat/[id]/actions";
import { useSession } from "next-auth/react";

// WhatsApp brand SVG icon
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

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
};

export function formatIntMetric(val: number | null | undefined, fallback = 1): number {
  if (val === null || val === undefined || isNaN(val)) return fallback;
  if (val > 0 && val < 1) return Math.ceil(val);
  return Math.floor(val);
}

// 8 Curated Nearby Place Categories with Auto-Extension limits
export interface AmenityCategoryConfig {
  key: string;
  label: string;
  countKey: string;
  minDistKey: string;
  defaultMinDist: number;
  maxExtendedLimitKm: number;
  defaultExtendedKm: number;
}

export const ALL_CATEGORIES: AmenityCategoryConfig[] = [
  { key: "Mall", label: "Mall", countKey: "malls", minDistKey: "mallsMinDist", defaultMinDist: 3, maxExtendedLimitKm: 8, defaultExtendedKm: 4.5 },
  { key: "Club", label: "Club", countKey: "nightlife", minDistKey: "nightlifeMinDist", defaultMinDist: 3, maxExtendedLimitKm: 7, defaultExtendedKm: 4.0 },
  { key: "Hospital", label: "Hospital", countKey: "hospitals", minDistKey: "hospitalsMinDist", defaultMinDist: 2, maxExtendedLimitKm: 6, defaultExtendedKm: 3.5 },
  { key: "Metro", label: "Metro", countKey: "transit", minDistKey: "transitMinDist", defaultMinDist: 2, maxExtendedLimitKm: 5, defaultExtendedKm: 3.2 },
  { key: "Gyms", label: "Gyms", countKey: "gyms", minDistKey: "gymsMinDist", defaultMinDist: 2, maxExtendedLimitKm: 4, defaultExtendedKm: 2.2 },
  { key: "Park", label: "Park", countKey: "parks", minDistKey: "parksMinDist", defaultMinDist: 1, maxExtendedLimitKm: 4, defaultExtendedKm: 2.0 },
  { key: "Cafe", label: "Cafe", countKey: "cafes", minDistKey: "cafesMinDist", defaultMinDist: 1, maxExtendedLimitKm: 3, defaultExtendedKm: 1.5 },
  { key: "Supermarket", label: "Supermarket", countKey: "supermarkets", minDistKey: "supermarketsMinDist", defaultMinDist: 1, maxExtendedLimitKm: 3, defaultExtendedKm: 1.5 },
];

export function getTop4Categories(
  userType: string,
  socialType: string,
  gymGuy: string,
  eatingHabit: string,
  commuteMode: string
): AmenityCategoryConfig[] {
  const scores: Record<string, number> = {
    Hospital: 0.5,
    Park: 0.4,
    Cafe: 0.8,
    Mall: 0.3,
    Club: 0.6,
    Gyms: 0.7,
    Supermarket: 0.65,
    Metro: 0.35,
  };

  if (userType === "Retired") {
    scores.Hospital += 3;
    scores.Park += 3;
  } else if (userType === "Student" || userType === "Professional") {
    scores.Cafe += 2;
    scores.Mall += 2;
  }

  if (socialType === "Socializing") {
    scores.Club += 3;
  } else if (socialType === "Reserved") {
    scores.Park += 2;
    scores.Mall += 2;
  }

  if (gymGuy === "Definitely") {
    scores.Gyms += 4;
  } else if (gymGuy === "Maybe") {
    scores.Gyms += 2;
  } else if (gymGuy === "Not at all") {
    scores.Mall += 2;
    scores.Supermarket += 2;
  }

  if (eatingHabit === "Mostly cook at home") {
    scores.Supermarket += 3;
  } else if (eatingHabit === "Order in or eat out often") {
    scores.Cafe += 3;
  } else if (eatingHabit === "Mix of both") {
    scores.Supermarket += 2;
    scores.Cafe += 2;
  }

  if (commuteMode === "Public Transport") {
    scores.Metro += 4;
  } else if (commuteMode === "Own Vehicle") {
    scores.Mall += 3;
  }

  const sortedKeys = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  const top4Keys = sortedKeys.slice(0, 4);

  return top4Keys.map(k => ALL_CATEGORIES.find(c => c.key === k)!);
}

export default function SearchWizard({
  pois,
  initialLocality,
  facebookGroups = [],
  popularLocalities = [],
}: {
  pois: POI[];
  initialLocality?: string;
  facebookGroups?: FacebookGroupData[];
  popularLocalities?: {
    _id?: string;
    name: string;
    label: string;
    lat: number;
    lng: number;
  }[];
}) {
  const { data: session } = useSession();
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
    types?: string[];
    type?: string;
  }[]>([]);
  const [poiId, setPoiId] = useState(""); // Legacy selected predefined POI id
  const [poiSearchInput, setPoiSearchInput] = useState("");

  // 5 Preference Questions State
  const [userType, setUserType] = useState<string>("");
  const [socialType, setSocialType] = useState<string>("");
  const [gymGuy, setGymGuy] = useState<string>("");
  const [eatingHabit, setEatingHabit] = useState<string>("");
  const [commuteMode, setCommuteMode] = useState<string>("");

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
  const [isMobileMapHidden, setIsMobileMapHidden] = useState(false);

  // Wishlist & Owner Details Modal State
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [contactModalProp, setContactModalProp] = useState<any | null>(null);

  // Infinite Scroll & Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredPropertiesRef = useRef(false);

  // Google Maps Instance Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isMapsLoaded = useGoogleMapsLoaded();

  // Load saved wishlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("user_flats_wishlist");
        if (saved) setWishlist(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

  const [isCallingOwner, setIsCallingOwner] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);

  const handleModalCall = async () => {
    if (!contactModalProp) return;
    setIsCallingOwner(true);
    try {
      const res = await recordPropertyCallAction(contactModalProp._id.toString());
      if (res.success && res.telUrl) {
        window.location.href = res.telUrl;
      } else if (res.phone) {
        window.location.href = `tel:${res.phone}`;
      } else if (contactModalProp.owner?.phone) {
        window.location.href = `tel:${contactModalProp.owner.phone}`;
      } else {
        window.location.href = "tel:+918888888888";
      }
    } catch (err) {
      console.error("Call action error:", err);
      if (contactModalProp.owner?.phone) {
        window.location.href = `tel:${contactModalProp.owner.phone}`;
      }
    } finally {
      setIsCallingOwner(false);
    }
  };

  const handleModalWhatsapp = async () => {
    if (!contactModalProp) return;
    setIsWhatsappLoading(true);
    try {
      await recordPropertyWhatsappAction(contactModalProp._id.toString());
    } catch (err) {
      console.error("WhatsApp inquiry log error:", err);
    } finally {
      setIsWhatsappLoading(false);
      const rawPhone = contactModalProp.owner?.phone || "918888888888";
      const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
      const propTitle = contactModalProp.title || `${contactModalProp.bhkConfig || ""} Flat in ${contactModalProp.localityId?.name || "Pune"}`;
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://flatandflatmates.in";
      const message = encodeURIComponent(`Hi, I found your property "${propTitle}" on Flat & Flatmates. I would like to know more details. ${siteUrl}/flat/${contactModalProp._id}`);
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank", "noopener,noreferrer");
    }
  };

  const toggleWishlist = (propId: string) => {
    if (!session) {
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/search/flats";
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
      return;
    }
    setWishlist((prev) => {
      const next = prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("user_flats_wishlist", JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });
  };

  // Trigger resize on map when toggled visible on mobile
  useEffect(() => {
    if (!isMobileMapHidden && mapInstanceRef.current && (window as any).google?.maps?.event) {
      setTimeout(() => {
        (window as any).google.maps.event.trigger(mapInstanceRef.current, "resize");
        if (selectedPropId) {
          const prop = properties.find((p) => p._id.toString() === selectedPropId);
          if (prop?.location?.coordinates) {
            mapInstanceRef.current.panTo({ lat: prop.location.coordinates[1], lng: prop.location.coordinates[0] });
          }
        } else if (searchArea) {
          mapInstanceRef.current.setCenter({ lat: searchArea.lat, lng: searchArea.lng });
        } else if (poisList.length > 0) {
          mapInstanceRef.current.setCenter({ lat: poisList[0].lat, lng: poisList[0].lng });
        } else {
          mapInstanceRef.current.setCenter({ lat: 18.5204, lng: 73.8567 });
        }
      }, 100);
    }
  }, [isMobileMapHidden]);

  // Ref to track when initial state restoration from sessionStorage is complete
  const isRestoredRef = useRef(false);

  // Restore wizard state and step from sessionStorage or history.state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedRaw = sessionStorage.getItem("flat_search_wizard_state_v2");

      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.searchArea) setSearchArea(saved.searchArea);
        if (saved.searchAreaInput) setSearchAreaInput(saved.searchAreaInput);
        if (saved.poisList && Array.isArray(saved.poisList)) setPoisList(saved.poisList);
        if (saved.poiId) setPoiId(saved.poiId);
        if (saved.userType) setUserType(saved.userType);
        if (saved.socialType) setSocialType(saved.socialType);
        if (saved.gymGuy) setGymGuy(saved.gymGuy);
        if (saved.eatingHabit) setEatingHabit(saved.eatingHabit);
        if (saved.commuteMode) setCommuteMode(saved.commuteMode);
        if (saved.distance) setDistance(saved.distance);
        if (saved.bhkConfig) setBhkConfig(saved.bhkConfig);
        if (saved.minRent) setMinRent(saved.minRent);
        if (saved.maxRent) setMaxRent(saved.maxRent);
        if (saved.furnishingStatus) setFurnishingStatus(saved.furnishingStatus);
        if (saved.tenantPreference) setTenantPreference(saved.tenantPreference);
        if (typeof saved.zeroBrokerage === "boolean") setZeroBrokerage(saved.zeroBrokerage);
        if (typeof saved.availableFromToday === "boolean") setAvailableFromToday(saved.availableFromToday);
        if (saved.petPolicy) setPetPolicy(saved.petPolicy);
        if (saved.parkingType) setParkingType(saved.parkingType);
        if (saved.powerBackup) setPowerBackup(saved.powerBackup);
        if (saved.waterSupplyType) setWaterSupplyType(saved.waterSupplyType);
        if (typeof saved.evCharging === "boolean") setEvCharging(saved.evCharging);
        if (typeof saved.fiberAvailable === "boolean") setFiberAvailable(saved.fiberAvailable);
        if (typeof saved.isVerifiedOnly === "boolean") setIsVerifiedOnly(saved.isVerifiedOnly);

        if (Array.isArray(saved.properties) && saved.properties.length > 0) {
          setProperties(saved.properties);
          if (typeof saved.page === "number") setPage(saved.page);
          if (typeof saved.hasMore === "boolean") setHasMore(saved.hasMore);
          if (typeof saved.totalResults === "number") setTotalResults(saved.totalResults);
          hasRestoredPropertiesRef.current = true;
        }

      }

      // Check priority for active step:
      // 1. URL search param `?step=X` (e.g. ?step=1 or ?step=8)
      // 2. Tab history state `window.history.state?.wizardStep` (when returning via browser back in this tab)
      // 3. Default to Step 1 (for fresh tab entry / open in new tab)
      let initialStep = 1;
      const urlParams = new URLSearchParams(window.location.search);
      const paramStep = urlParams.get("step");
      if (paramStep && !isNaN(parseInt(paramStep))) {
        initialStep = Math.min(Math.max(parseInt(paramStep), 1), 8);
      } else if (typeof window.history.state?.wizardStep === "number") {
        initialStep = window.history.state.wizardStep;
      }
      
      setStep(initialStep);

      // Ensure history state is synchronized
      const currentState = window.history.state || {};
      window.history.replaceState({ ...currentState, wizardStep: initialStep }, "", window.location.href);
    } catch (e) {
      console.error("Error restoring flat search state:", e);
    } finally {
      isRestoredRef.current = true;
    }
  }, []);

  const saveCurrentScroll = (clickedPropId?: string) => {
    if (typeof window === "undefined" || step !== 8) return;
    try {
      const savedRaw = sessionStorage.getItem("flat_search_wizard_state_v2");
      const saved = savedRaw ? JSON.parse(savedRaw) : {};
      const containerTop = listingsContainerRef.current ? listingsContainerRef.current.scrollTop : 0;
      const windowTop = window.scrollY || document.documentElement.scrollTop || 0;

      sessionStorage.setItem(
        "flat_search_wizard_state_v2",
        JSON.stringify({
          ...saved,
          scrollContainerTop: containerTop,
          scrollWindowTop: windowTop,
          lastPropId: clickedPropId !== undefined ? clickedPropId : saved.lastPropId,
          properties,
          page,
          hasMore,
          totalResults,
        })
      );
    } catch (_) {}
  };

  const restoreScrollPosition = () => {
    if (typeof window === "undefined") return;
    try {
      const savedRaw = sessionStorage.getItem("flat_search_wizard_state_v2");
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      const { scrollContainerTop, scrollWindowTop, lastPropId } = saved;

      const applyScroll = () => {
        let cardFound = false;
        if (lastPropId) {
          const el = document.getElementById(`property-card-${lastPropId}`);
          if (el) {
            el.scrollIntoView({ behavior: "instant" as any, block: "center" });
            cardFound = true;
          }
        }
        if (!cardFound) {
          if (typeof scrollContainerTop === "number" && listingsContainerRef.current && scrollContainerTop > 0) {
            listingsContainerRef.current.scrollTop = scrollContainerTop;
          }
          if (typeof scrollWindowTop === "number" && scrollWindowTop > 0) {
            window.scrollTo({ top: scrollWindowTop, behavior: "instant" as any });
          }
        }
      };

      applyScroll();
      requestAnimationFrame(applyScroll);
      setTimeout(applyScroll, 60);
      setTimeout(applyScroll, 180);
      setTimeout(applyScroll, 350);
    } catch (_) {}
  };

  // Persist wizard state and filters to sessionStorage on changes
  useEffect(() => {
    if (typeof window === "undefined" || !isRestoredRef.current) return;

    try {
      const savedRaw = sessionStorage.getItem("flat_search_wizard_state_v2");
      const saved = savedRaw ? JSON.parse(savedRaw) : {};
      const containerTop = listingsContainerRef.current ? listingsContainerRef.current.scrollTop : (saved.scrollContainerTop || 0);
      const windowTop = typeof window !== "undefined" ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;

      const stateToSave = {
        ...saved,
        step,
        searchArea,
        searchAreaInput,
        poisList,
        poiId,
        userType,
        socialType,
        gymGuy,
        eatingHabit,
        commuteMode,
        distance,
        bhkConfig,
        minRent,
        maxRent,
        furnishingStatus,
        tenantPreference,
        zeroBrokerage,
        availableFromToday,
        petPolicy,
        parkingType,
        powerBackup,
        waterSupplyType,
        evCharging,
        fiberAvailable,
        isVerifiedOnly,
        properties,
        page,
        hasMore,
        totalResults,
        scrollContainerTop: containerTop,
        scrollWindowTop: windowTop,
      };
      sessionStorage.setItem("flat_search_wizard_state_v2", JSON.stringify(stateToSave));
    } catch (_) {}
  }, [
    step,
    searchArea,
    searchAreaInput,
    poisList,
    poiId,
    userType,
    socialType,
    gymGuy,
    eatingHabit,
    commuteMode,
    distance,
    bhkConfig,
    minRent,
    maxRent,
    furnishingStatus,
    tenantPreference,
    zeroBrokerage,
    availableFromToday,
    petPolicy,
    parkingType,
    powerBackup,
    waterSupplyType,
    evCharging,
    fiberAvailable,
    isVerifiedOnly,
    properties,
    page,
    hasMore,
    totalResults,
  ]);

  // Track scroll positions on step 8
  useEffect(() => {
    if (step !== 8 || typeof window === "undefined") return;

    let timeoutId: any = null;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveCurrentScroll();
      }, 80);
    };

    const container = listingsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [step, properties, page, hasMore, totalResults]);

  // Backward compatibility: Migrate legacy single POI logic into multi-select poisList
  useEffect(() => {
    if (poisList.length === 0) {
      if (poiId) {
        const found = pois.find((p) => p._id === poiId);
        if (found) {
          setPoisList([{ label: found.name, lat: found.lat, lng: found.lng, type: found.type }]);
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

  const getNextStep = (currentStep: number) => {
    if (currentStep < 8) return currentStep + 1;
    return 8;
  };

  const getPrevStep = (currentStep: number) => {
    if (currentStep > 1) return currentStep - 1;
    return 1;
  };

  const goToStep = (nextStepNum: number, push = true) => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (nextStepNum === 8) {
        currentUrl.searchParams.delete("step");
      } else {
        currentUrl.searchParams.set("step", nextStepNum.toString());
      }

      if (push) {
        window.history.pushState({ ...(window.history.state || {}), wizardStep: nextStepNum }, "", currentUrl.toString());
      } else {
        window.history.replaceState({ ...(window.history.state || {}), wizardStep: nextStepNum }, "", currentUrl.toString());
      }
    }
    setStep(nextStepNum);
    if (typeof window !== "undefined" && nextStepNum < 8) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleNext = (currentStep: number) => {
    const next = getNextStep(currentStep);
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
      window.history.replaceState({ ...currentState, wizardStep: step }, "", window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.wizardStep === "number") {
        setStep(event.state.wizardStep);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const paramStep = urlParams.get("step");
        if (paramStep && !isNaN(parseInt(paramStep))) {
          setStep(Math.min(Math.max(parseInt(paramStep), 1), 8));
        } else {
          setStep(1);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [step]);

  // Ensure scroll to top ONLY on wizard steps 1-7
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch (_) {}
    }

    if (step < 8) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }, [step]);

  const fetchResults = async (pageToFetch = 1, isLoadMore = false) => {
    if (isLoadMore) {
      if (isFetchingRef.current || !hasMore || loading || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setProperties([]);
      setPage(1);
      setHasMore(true);
      setTotalResults(0);
    }

    isFetchingRef.current = true;

    try {
      const params = new URLSearchParams();
      if (searchArea) {
        params.append("searchAreaLat", searchArea.lat.toString());
        params.append("searchAreaLng", searchArea.lng.toString());
        params.append("searchAreaLabel", searchArea.label);
      }
      if (poisList.length > 0) {
        params.append("pois", JSON.stringify(poisList));
      } else if (poiId) {
        params.append("poiId", poiId);
      }

      const flatmatePref = {
        userType: userType || null,
        socialType: socialType || null,
        gymGuy: gymGuy || null,
        outsideEater: eatingHabit || null,
        eatingHabit: eatingHabit || null,
        commuteMode: commuteMode || null,
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

      // Pagination
      params.append("page", pageToFetch.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/search/flats?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const newProperties = json.data || [];
        const serverHasMore = typeof json.hasMore === "boolean" ? json.hasMore : newProperties.length >= 20;
        const serverTotal = typeof json.total === "number" ? json.total : newProperties.length;

        setHasMore(serverHasMore);
        setTotalResults(serverTotal);

        if (isLoadMore) {
          setProperties((prev) => {
            const existingIds = new Set(prev.map((p: any) => p._id.toString()));
            const uniqueNew = newProperties.filter((p: any) => !existingIds.has(p._id.toString()));
            return [...prev, ...uniqueNew];
          });
          setPage(pageToFetch);
        } else {
          setProperties(newProperties);
          setPage(1);
        }
      }
    } catch (e) {
      console.error("Failed to load search results", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const handlePropertyCardClick = (prop: any) => {
    const propIdStr = prop._id.toString();
    setSelectedPropId((prev) => (prev === propIdStr ? null : propIdStr));
    if (mapInstanceRef.current && prop.location?.coordinates) {
      const lat = prop.location.coordinates[1];
      const lng = prop.location.coordinates[0];
      if (typeof lat === "number" && typeof lng === "number") {
        mapInstanceRef.current.panTo({ lat, lng });
        if (mapInstanceRef.current.getZoom() < 14) {
          mapInstanceRef.current.setZoom(14);
        }
      }
    }
  };

  // Trigger search whenever filters change in Step 8
  useEffect(() => {
    if (step === 8) {
      if (hasRestoredPropertiesRef.current) {
        hasRestoredPropertiesRef.current = false;
        restoreScrollPosition();
        return;
      }
      fetchResults(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    searchArea,
    poisList,
    userType,
    socialType,
    gymGuy,
    eatingHabit,
    commuteMode,
    distance,
    bhkConfig,
    minRent,
    maxRent,
    furnishingStatus,
    tenantPreference,
    zeroBrokerage,
    availableFromToday,
    petPolicy,
    parkingType,
    powerBackup,
    waterSupplyType,
    evCharging,
    fiberAvailable,
    isVerifiedOnly,
  ]);

  // Infinite scroll IntersectionObserver
  useEffect(() => {
    if (step !== 8 || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current && !loading && !loadingMore) {
          fetchResults(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [step, page, hasMore, loading, loadingMore]);

  // Google Map Initialization in Step 8
  useEffect(() => {
    if (!isMapsLoaded || !mapRef.current || step !== 8) return;

    if (!mapInstanceRef.current) {
      const puneBounds = new (window as any).google.maps.LatLngBounds(
        new (window as any).google.maps.LatLng(18.35, 73.65),
        new (window as any).google.maps.LatLng(18.72, 74.05)
      );

      const initialCenter = searchArea
        ? { lat: searchArea.lat, lng: searchArea.lng }
        : poisList.length > 0
        ? { lat: poisList[0].lat, lng: poisList[0].lng }
        : { lat: 18.5204, lng: 73.8567 };

      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: searchArea || poisList.length > 0 ? 13 : 12,
        gestureHandling: "greedy",
        scrollwheel: true,
        styles: getResponsiveMapStyles(),
        restriction: {
          latLngBounds: puneBounds,
          strictBounds: false,
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
    }
  }, [isMapsLoaded, step, searchArea, poisList]);

  // Keep map style responsive on window resize / orientation change (dark on phone view)
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setOptions({ styles: getResponsiveMapStyles() });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Manage property markers reactively
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    properties.forEach((prop: any) => {
      const lat = prop.location?.coordinates?.[1];
      const lng = prop.location?.coordinates?.[0];
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const isSelected = selectedPropId === prop._id.toString();
      const isHovered = hoveredPropId === prop._id.toString();
      const isOutOfProximity = prop.inAreaProximity === false || prop.inProximity === false;

      let markerColor = "#ffffff";
      let strokeColor = "#cbd5e1";
      let textColor = "#1e293b";
      let scale = 18;
      let opacity = 1;

      if (isSelected || isHovered) {
        markerColor = colors.brand.primary;
        strokeColor = colors.brand.primaryHover;
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
        const propId = prop._id.toString();
        setSelectedPropId(isSelected ? null : propId);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          if (mapInstanceRef.current.getZoom() < 14) {
            mapInstanceRef.current.setZoom(14);
          }
        }
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

    // 1. Search Area Autocomplete
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
        fields: ["geometry", "name", "formatted_address", "types"],
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

          const cleanLabel = place.name || (place.formatted_address ? place.formatted_address.split(",")[0].trim() : "Custom POI");
          const newPoi = {
            label: cleanLabel,
            lat,
            lng,
            types: place.types || [],
          };

          setPoisList((prev) => {
            if (prev.length >= 6) {
              alert("You can select a maximum of 6 regular travel spots.");
              return prev;
            }
            if (prev.some((p) => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          setPoiSearchInput("");
          poiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, step]);

  // Autocomplete setup for "Refine Search" panel POIs
  useEffect(() => {
    if (!isMapsLoaded || !showFiltersPanel) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.35, 73.65),
      new (window as any).google.maps.LatLng(18.72, 74.05)
    );

    const isWithinPune = (lat: number, lng: number) => {
      return lat >= 18.35 && lat <= 18.75 && lng >= 73.55 && lng <= 74.15;
    };

    const refinePoiInput = document.getElementById("refine-poi-autocomplete") as HTMLInputElement;
    if (refinePoiInput) {
      const poiAutocomplete = new (window as any).google.maps.places.Autocomplete(refinePoiInput, {
        componentRestrictions: { country: "in" },
        bounds: puneBounds,
        strictBounds: true,
        fields: ["geometry", "name", "formatted_address", "types"],
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

          const cleanLabel = place.name || (place.formatted_address ? place.formatted_address.split(",")[0].trim() : "Custom POI");
          const newPoi = {
            label: cleanLabel,
            lat,
            lng,
            types: place.types || [],
          };

          setPoisList((prev) => {
            if (prev.length >= 6) {
              alert("You can select a maximum of 6 regular travel spots.");
              return prev;
            }
            if (prev.some((p) => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          refinePoiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, showFiltersPanel]);

  // Top 4 curated categories computed dynamically from preferences
  const top4Categories = getTop4Categories(userType, socialType, gymGuy, eatingHabit, commuteMode);

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
    const handleSelectOption = (label: string) => {
      onChange(label);
      onNext(label);
    };

    return (
      <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
        <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col animate-in fade-in duration-200">
          <div className="text-center pt-2 sm:pt-0">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{question}</h2>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 py-2">
            {options.map((opt) => {
              const isSelected = currentValue === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectOption(opt.label)}
                  className={`h-32 sm:h-36 w-full flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl border transition-all duration-200 group ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/20"
                      : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-2 sm:mb-2.5 transition-transform duration-250 group-hover:scale-110 ${
                      isSelected ? "bg-brand-primary/15" : "bg-slate-100"
                    }`}
                  >
                    {opt.emoji}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold text-center leading-snug ${isSelected ? "text-brand-primary font-extrabold" : "text-slate-800"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
            <div className="w-full max-w-xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-4 py-2.5 border border-dashed rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow w-full flex flex-col min-h-[80vh]">
      {/* STEP 1: SELECT AREA & REGULAR TRAVEL SPOTS */}
      {step === 1 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">Where in Pune?</h2>
            </div>

            <div className="space-y-5 flex-grow">
              {/* Search Area Locality Filter */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 block leading-tight">Area</label>

                <div className="relative">
                  <input
                    id="search-area-autocomplete"
                    type="text"
                    placeholder="Search locality or neighborhood in Pune (e.g. Baner, Hinjewadi)..."
                    value={searchAreaInput}
                    onChange={(e) => setSearchAreaInput(e.target.value)}
                    onBlur={() => {
                      if (!searchArea || searchArea.label !== searchAreaInput) {
                        setSearchAreaInput(searchArea?.label || "");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    className="w-full text-xs font-medium border border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl pl-3.5 pr-9 py-2.5 bg-white text-slate-800 placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 shadow-xs transition-all"
                  />
                  {searchArea && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchArea(null);
                        setSearchAreaInput("");
                      }}
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
                    {(popularLocalities && popularLocalities.length > 0
                      ? popularLocalities.slice(0, 5)
                      : Object.entries(POPULAR_LOCALITIES_DATA).slice(0, 5).map(([name, data]) => ({
                          name,
                          label: data.label,
                          lat: data.lat,
                          lng: data.lng,
                        }))
                    ).map((loc) => {
                      const isSelected = searchArea?.label === loc.label || searchAreaInput.startsWith(loc.name);
                      return (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSearchArea(null);
                              setSearchAreaInput("");
                            } else {
                              setSearchArea({
                                label: loc.label,
                                lat: loc.lat,
                                lng: loc.lng,
                              });
                              setSearchAreaInput(loc.label);
                            }
                          }}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                            isSelected
                              ? "bg-brand-primary text-white border-brand-primary shadow-xs font-semibold"
                              : "bg-white text-slate-650 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/5"
                          }`}
                        >
                          {loc.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Autocomplete for Custom Regular Travel Spots */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800">Regular Travel Spots</label>
                  <span className={`text-[10px] font-bold ${poisList.length >= 6 ? "text-amber-600" : "text-slate-400"}`}>
                    {poisList.length >= 6 ? "Max 6 reached" : `(${poisList.length}/6)`}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    id="poi-autocomplete"
                    type="text"
                    disabled={poisList.length >= 6}
                    placeholder={
                      poisList.length >= 6
                        ? "Maximum 6 spots selected (remove one to add another)"
                        : "Work, college, gym — anywhere you travel to often (e.g. Hinjewadi IT Park)..."
                    }
                    value={poiSearchInput}
                    onChange={(e) => setPoiSearchInput(e.target.value)}
                    onBlur={() => {
                      setPoiSearchInput("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    className={`w-full text-xs border rounded-xl pl-9 pr-3 py-2.5 transition-all shadow-xs ${
                      poisList.length >= 6
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary text-slate-800 placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                    }`}
                  />
                </div>
              </div>

              {/* Selected POIs List Chips */}
              {poisList.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    Travel Spots List ({poisList.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {poisList.map((poi) => (
                      <span
                        key={poi.label}
                        className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/15 text-brand-primaryHover text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                      >
                        <span>{poi.label}</span>
                        <button
                          type="button"
                          onClick={() => setPoisList((prev) => prev.filter((x) => x.label !== poi.label))}
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
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                    Max Search Radius From Area
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
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
              <div className="w-full max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => handleNext(1)}
                  className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-3 sm:py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: USER TYPE */}
      {step === 2 &&
        renderChoiceStep(
          2,
          "What type of flatmate are you?",
          "Help us personalize nearby places and compatible flat recommendations.",
          userType,
          setUserType,
          [
            { label: "Student", emoji: "🎓" },
            { label: "Professional", emoji: "💼" },
            { label: "Retired", emoji: "👴" },
          ],
          () => handleNext(2),
          () => handleBack(2),
          () => {
            setUserType("");
            handleNext(2);
          }
        )}

      {/* STEP 3: SOCIALIZING VIBES */}
      {step === 3 &&
        renderChoiceStep(
          3,
          "What are your socializing vibes?",
          "Do you prefer lively weekend hangout spots or quiet peaceful surroundings?",
          socialType,
          setSocialType,
          [
            { label: "Socializing", emoji: "🥳" },
            { label: "Reserved", emoji: "🤫" },
          ],
          () => handleNext(3),
          () => handleBack(3),
          () => {
            setSocialType("");
            handleNext(3);
          }
        )}

      {/* STEP 4: GYM ENTHUSIAST */}
      {step === 4 &&
        renderChoiceStep(
          4,
          "Are you a gym enthusiast?",
          "We'll highlight fitness clubs and gyms nearby your prospective home.",
          gymGuy,
          setGymGuy,
          [
            { label: "Definitely", emoji: "🏋️" },
            { label: "Maybe", emoji: "🏃" },
            { label: "Not at all", emoji: "🛋️" },
          ],
          () => handleNext(4),
          () => handleBack(4),
          () => {
            setGymGuy("");
            handleNext(4);
          }
        )}

      {/* STEP 5: HOW DO YOU USUALLY EAT? */}
      {step === 5 &&
        renderChoiceStep(
          5,
          "How do you usually eat?",
          "Drives recommendations for supermarkets, grocery stores, cafes, and food spots.",
          eatingHabit,
          setEatingHabit,
          [
            { label: "Mostly cook at home", emoji: "🍳" },
            { label: "Order in or eat out often", emoji: "🍕" },
            { label: "Mix of both", emoji: "🥗" },
          ],
          () => handleNext(5),
          () => handleBack(5),
          () => {
            setEatingHabit("");
            handleNext(5);
          }
        )}

      {/* STEP 6: HOW DO YOU GET AROUND? */}
      {step === 6 &&
        renderChoiceStep(
          6,
          "How do you usually get around?",
          "Helps prioritize Metro/transit stations or drive-friendly malls and highways.",
          commuteMode,
          setCommuteMode,
          [
            { label: "Own Vehicle", emoji: "🚗" },
            { label: "Public Transport", emoji: "🚇" },
          ],
          () => handleNext(6),
          () => handleBack(6),
          () => {
            setCommuteMode("");
            handleNext(6);
          }
        )}

      {/* STEP 7: BUDGETS & PROPERTY SPECS */}
      {step === 7 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">Define your preferences</h2>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">BHK Configuration</label>
                  <select
                    value={bhkConfig}
                    onChange={(e) => setBhkConfig(e.target.value)}
                    className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                    onChange={(e) => setFurnishingStatus(e.target.value)}
                    className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                    onChange={(e) => setMinRent(e.target.value)}
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Rent (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800">No Brokerage Only</span>
                </div>
                <button
                  type="button"
                  onClick={() => setZeroBrokerage(!zeroBrokerage)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    zeroBrokerage ? "bg-brand-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      zeroBrokerage ? "translate-x-4" : "translate-x-0"
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
                  </span>
                  {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showMoreFilters && (
                  <div className="p-4 bg-white border-t space-y-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Available from today</span>
                      <input
                        type="checkbox"
                        checked={availableFromToday}
                        onChange={(e) => setAvailableFromToday(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pet Policy</label>
                        <select
                          value={petPolicy}
                          onChange={(e) => setPetPolicy(e.target.value)}
                          className="w-full text-xs border rounded-lg px-2.5 py-1.5 bg-slate-50"
                        >
                          <option value="any">Any</option>
                          <option value="allowed">Pets Allowed</option>
                          <option value="not_allowed">No Pets</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Parking</label>
                        <select
                          value={parkingType}
                          onChange={(e) => setParkingType(e.target.value)}
                          className="w-full text-xs border rounded-lg px-2.5 py-1.5 bg-slate-50"
                        >
                          <option value="any">Any</option>
                          <option value="two_wheeler">Two-Wheeler</option>
                          <option value="four_wheeler">Four-Wheeler</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
              <div className="w-full max-w-xl mx-auto flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleBack(7)}
                  className="px-5 py-2.5 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleNext(7)}
                  className="flex-grow bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-3 sm:py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  <span>Search Flats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: SPLIT MAP + LIST RESULTS */}
      {step === 8 && (
        <div className="flex-grow w-full flex flex-col lg:flex-row relative">
          {/* Mobile View Map Toggle Bar */}
          {isMobileMapHidden && (
            <div className="lg:hidden w-full flex justify-center py-2 bg-slate-100/90 border-b border-slate-200 sticky top-16 z-20 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setIsMobileMapHidden(false)}
                aria-label="View Map"
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm rounded-full px-4 py-1 text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                <span>View Map</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              </button>
            </div>
          )}

          {/* Real Google Map Column */}
          <div
            className={`w-full lg:w-[40%] sticky top-16 lg:top-[80px] z-20 lg:z-10 flex-shrink-0 p-0 lg:p-4 transition-all duration-300 ${
              isMobileMapHidden ? "hidden lg:block lg:h-[calc(100vh-100px)]" : "h-[210px] lg:h-[calc(100vh-100px)]"
            }`}
          >
            <div className="w-full h-full rounded-none rounded-b-2xl lg:rounded-2xl overflow-hidden shadow-md border-b lg:border border-slate-200 relative">
              <div ref={mapRef} className="w-full h-full">
                {!isMapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400">
                    Loading Google Map...
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMapHidden(true)}
                title="Hide Map"
                aria-label="Hide Map"
                className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-md rounded-full px-3 py-1 flex items-center space-x-1 text-[11px] font-semibold transition-all active:scale-95 backdrop-blur-xs"
              >
                <span>Hide Map</span>
                <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Listings Column */}
          <div ref={listingsContainerRef} className="w-full lg:w-[60%] p-4 lg:p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Flats in Pune ({totalResults > 0 ? totalResults : properties.length})
                </h2>
                {searchArea && (
                  <span className="text-xs text-slate-500 block">
                    Near {searchArea.label.split(",")[0]} (within {(parseInt(distance) / 1000).toFixed(0)} km)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="bg-white hover:bg-slate-50 text-brand-primary border border-brand-primary/30 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Criteria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                <div className="h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Searching flats...</span>
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {properties.map((prop: any, index: number) => {
                  const isSelected = selectedPropId === prop._id.toString();
                  const isHovered = hoveredPropId === prop._id.toString();
                  const isWishlisted = wishlist.includes(prop._id.toString());

                  // Proximity measurement from Area + radius
                  const distKm = prop.areaDistanceKm !== null && prop.areaDistanceKm !== undefined ? prop.areaDistanceKm : prop.distanceKm;
                  const isOutside =
                    prop.inAreaProximity === false ||
                    (prop.areaDistanceKm === null && prop.inProximity === false);

                  // Furnishing display format
                  const furnishingLabel =
                    prop.furnishingStatus === "fully_furnished"
                      ? "Full"
                      : prop.furnishingStatus === "semi_furnished"
                      ? "Semi"
                      : "Unfurnished";

                  // Regular Travel Spots items (only if user added POIs)
                  let spots: any[] = [];
                  if (poisList.length > 0) {
                    if (prop.commuteDetails && prop.commuteDetails.length > 0) {
                      spots = prop.commuteDetails;
                    } else {
                      spots = poisList.map((p) => ({
                        label: p.label,
                        distanceKm: prop.distanceKm || 4,
                        durationMin: prop.commuteTimeMin || 15,
                      }));
                    }
                  }
                  const displaySpots = spots.slice(0, 6);

                  return (
                    <React.Fragment key={prop._id.toString()}>
                      <div
                        id={`property-card-${prop._id}`}
                        onClick={() => {
                          saveCurrentScroll(prop._id.toString());
                          handlePropertyCardClick(prop);
                        }}
                        onMouseEnter={() => setHoveredPropId(prop._id.toString())}
                        onMouseLeave={() => setHoveredPropId(null)}
                        className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "border-brand-primary ring-2 ring-brand-primary/25 shadow-md"
                            : isHovered
                            ? "border-brand-primary/60 ring-2 ring-brand-primary/10"
                            : "hover:border-slate-350"
                        }`}
                      >
                        {/* 1. Image + Badge Overlays */}
                        <div className="h-44 sm:h-48 w-full relative bg-slate-100 overflow-hidden">
                          <img
                            src={
                              (prop.images?.[0] as any)?.processedUrls?.medium ||
                              prop.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
                            }
                            className="h-full w-full object-cover transition-transform duration-350 hover:scale-105"
                            alt={prop.title || "Property image"}
                          />

                          {/* Top-left: Verified badge */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            <span className="bg-slate-900/80 text-white font-semibold text-[9px] px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                              Verified
                            </span>
                          </div>

                          {/* Top-right: Relation Badge (Owner / Broker / Flatmate) */}
                          <div className="absolute top-3 right-3">
                            <span className="bg-slate-900/85 backdrop-blur-xs text-white font-bold text-[9px] px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                              {prop.listerRelation === 'broker' ? 'Broker' : prop.listerRelation === 'flatmate' ? 'Flatmate' : 'Owner'}
                            </span>
                          </div>

                          {/* Bottom-right: Outside pill badge only if outside */}
                          {distKm !== null && isOutside && (
                            <div className="absolute bottom-3 right-3">
                              <span className="bg-[#E8871E] text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-md tracking-tight animate-in zoom-in-95">
                                Outside ({formatIntMetric(distKm)}km)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-3.5 sm:p-4 space-y-0 flex-grow flex flex-col justify-between">
                          {/* 2. Top Stats Row (Rent, Rooms, Furnishing) */}
                          <div className="grid grid-cols-3 py-2 text-center items-center">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Rent
                              </span>
                              <div className="text-sm font-bold text-slate-900 leading-tight">
                                ₹{prop.rentAmount ? prop.rentAmount.toLocaleString("en-IN") : "12,000"}{" "}
                                <span className="text-[10px] font-normal text-slate-400">/mo</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Rooms
                              </span>
                              <div className="text-sm font-bold text-slate-900 leading-tight">
                                {prop.bhkConfig || "3BHK"}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Furnishing
                              </span>
                              <div className="text-sm font-bold text-slate-900 leading-tight">
                                {furnishingLabel}
                              </div>
                            </div>
                          </div>

                          <div className="border-b border-slate-100 my-1.5" />

                          {/* 3. Regular Travel Spots Section (shown only if spots are selected, up to 6 in 2Rx3C) */}
                          {poisList.length > 0 && displaySpots.length > 0 && (
                            <>
                              <div className="py-2 space-y-1.5">
                                <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                                  Regular Travel Spots
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {displaySpots.map((spot: any, sIdx: number) => (
                                    <div
                                      key={sIdx}
                                      className="bg-[#FAF9F6] border border-slate-200/50 rounded-xl p-2 text-center flex flex-col justify-center min-h-[50px] shadow-xs"
                                    >
                                      <span
                                        className="text-[11px] font-bold text-[#097969] truncate block leading-tight mb-1"
                                        title={spot.label}
                                      >
                                        {spot.label}
                                      </span>
                                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold leading-tight whitespace-nowrap">
                                        <span>
                                          <strong className="text-black font-bold text-xs">{formatIntMetric(spot.distanceKm)}</strong>{" "}
                                          <span className="text-slate-400 font-normal text-[10px]">km</span>
                                        </span>
                                        <span>
                                          <strong className="text-black font-bold text-xs">{formatIntMetric(spot.durationMin)}</strong>{" "}
                                          <span className="text-slate-400 font-normal text-[10px]">min</span>
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-b border-slate-100 my-1.5" />
                            </>
                          )}

                          {/* 4. Flatmates Section (shown only if flatmates present) */}
                          {Array.isArray(prop.flatmates) && prop.flatmates.length > 0 && (
                            <>
                              <div className="py-2 space-y-1.5">
                                <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                                  Flatmates
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  {prop.flatmates.map((fm: any, fmIdx: number) => (
                                    <div
                                      key={fmIdx}
                                      className="inline-flex items-center bg-[#0F7A5C] text-white rounded-full pl-0.5 pr-3.5 py-0.5 shadow-xs"
                                    >
                                      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20">
                                        {fm.profilePhoto ? (
                                          <img
                                            src={fm.profilePhoto}
                                            alt={fm.name || "Flatmate"}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-black text-white">
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-white ml-2 whitespace-nowrap">
                                        {fm.name || "Flatmate"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-b border-slate-100 my-1.5" />
                            </>
                          )}

                          {/* 4. Nearby Places Section */}
                          <div className="py-2 space-y-1.5">
                            <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                              Nearby Places
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {top4Categories.map((cat) => {
                                const rawCount = prop.nearbyAmenities?.[cat.countKey];
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
                                let minDist = prop.nearbyAmenities?.[cat.minDistKey] ?? cat.defaultMinDist;

                                // Auto-extend range if 0 count found, capped at category-specific max limits
                                if (count === 0) {
                                  count = 1;
                                  minDist = Math.min(cat.maxExtendedLimitKm, Math.max(cat.defaultMinDist, cat.defaultExtendedKm));
                                } else if (minDist > cat.maxExtendedLimitKm) {
                                  minDist = cat.maxExtendedLimitKm;
                                }

                                return (
                                  <div
                                    key={cat.key}
                                    className="bg-[#F4F7F6] border border-slate-100/80 rounded-xl p-1.5 flex items-center justify-center gap-1.5 min-h-[44px]"
                                  >
                                    <span className="text-base sm:text-lg font-bold text-[#0F7A5C] leading-none">
                                      {count}
                                    </span>
                                    <div className="flex flex-col text-left leading-none overflow-hidden">
                                      <span className="text-[10px] font-semibold text-slate-800 leading-tight truncate">
                                        {cat.label}
                                      </span>
                                      <span className="text-[9px] text-slate-400 leading-tight mt-0.5 whitespace-nowrap">
                                        in {formatIntMetric(minDist)} km
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="border-b border-slate-100 my-1.5" />

                          {/* 5. Bottom Action Row */}
                          <div className="grid grid-cols-3 pt-2 pb-0.5 text-center items-center">
                            {/* Wishlist Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(prop._id.toString());
                              }}
                              className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-red-500 transition-colors group cursor-pointer"
                            >
                              <Heart
                                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                                  isWishlisted ? "fill-red-500 text-red-500" : "text-slate-500"
                                }`}
                              />
                              <span className="text-[10px] font-semibold tracking-tight">
                                {isWishlisted ? "Saved" : "Save"}
                              </span>
                            </button>

                            {/* Owner Details Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContactModalProp(prop);
                              }}
                              className="flex flex-col items-center justify-center gap-1 text-[#0F7A5C] hover:text-[#0C624A] transition-colors group cursor-pointer"
                            >
                              <Phone className="h-4 w-4 transition-transform group-hover:scale-110 text-[#0F7A5C]" />
                              <span className="text-[10px] font-bold tracking-tight text-[#0F7A5C]">Owner details</span>
                            </button>

                            {/* View Property Page */}
                            <Link
                              href={`/flat/${prop._id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                saveCurrentScroll(prop._id.toString());
                              }}
                              className="flex flex-col items-center justify-center gap-1 text-brand-primary hover:text-brand-primaryHover font-bold group"
                            >
                              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              <span className="text-[10px] font-bold tracking-tight">Details</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Repeating Facebook Community CTA */}
                      {((index + 1) % 8 === 0 || index + 1 === properties.length) && (
                        <FacebookGroupCTA key={`fb-cta-${index}`} groups={facebookGroups} category="flats" isBlank={false} />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Sentinel for infinite scroll */}
                <div ref={loadMoreRef} className="col-span-full h-4 w-full pointer-events-none" />

                {/* Loading More Spinner */}
                {loadingMore && (
                  <div className="col-span-full py-6 flex flex-col items-center justify-center space-y-2 text-slate-400 animate-in fade-in duration-150">
                    <div className="h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading more properties...</span>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMore && properties.length > 0 && (
                  <div className="col-span-full py-6 text-center text-xs font-medium text-slate-400 border-t border-slate-100 my-2">
                    You've reached the end • {properties.length} of {totalResults || properties.length} properties shown
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-dashed rounded-2xl p-8 space-y-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Home className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">No properties found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn&apos;t find any properties matching your current filters. Try expanding your search radius or changing criteria.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(true)}
                  className="bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Adjust Filters
                </button>
              </div>
            )}

            {/* Pagination Load More Trigger */}
            {hasMore && properties.length > 0 && (
              <div ref={loadMoreRef} className="py-6 flex justify-center items-center">
                {loadingMore ? (
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <div className="h-4 w-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading more flats...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fetchResults(page + 1, true)}
                    className="text-xs font-semibold text-brand-primary hover:text-brand-primaryHover border border-brand-primary/20 hover:border-brand-primary/40 px-4 py-2 rounded-xl bg-brand-primary/5 transition-all"
                  >
                    Load More Properties
                  </button>
                )}
              </div>
            )}

            {/* Facebook Group Direct CTA below listings */}
            {searchArea && facebookGroups && facebookGroups.length > 0 && (
              <div className="pt-2">
                <FacebookGroupCTA
                  groups={facebookGroups}
                  category="flats"
                />
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
                    <button
                      type="button"
                      onClick={() => setShowFiltersPanel(false)}
                      className="p-1 text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Regular travel spots / Commute POIs */}
                    <div className="space-y-2 border-b pb-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Regular Travel Spots ({poisList.length}/6)
                        </label>
                        <span className={`text-[10px] font-bold ${poisList.length >= 6 ? "text-amber-600" : "text-slate-400"}`}>
                          {poisList.length >= 6 ? "Max reached" : "Up to 6 spots"}
                        </span>
                      </div>

                      {poisList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {poisList.map((poi) => (
                            <span
                              key={poi.label}
                              className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryHover text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs"
                            >
                              <span className="truncate max-w-[170px]">{poi.label}</span>
                              <button
                                type="button"
                                onClick={() => setPoisList((prev) => prev.filter((x) => x.label !== poi.label))}
                                className="text-brand-primary/60 hover:text-red-600 font-extrabold ml-0.5 focus:outline-none transition-colors"
                                title="Remove spot"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative pt-1">
                        <input
                          id="refine-poi-autocomplete"
                          type="text"
                          disabled={poisList.length >= 6}
                          placeholder={poisList.length >= 6 ? "Maximum 6 spots added" : "Search work, college, gym to add..."}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.preventDefault();
                          }}
                          className={`w-full text-xs border rounded-xl px-3 py-2 text-slate-800 placeholder:text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 shadow-xs transition-all ${
                            poisList.length >= 6
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-slate-50 border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Max commute distance */}
                    {poisList.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                          Max Proximity Distance
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="2000"
                            max="40000"
                            step="1000"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="w-full h-1 bg-brand-primary/15 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                          />
                          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {(parseInt(distance) / 1000).toFixed(0)} km
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BHK configurations */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">BHK Config</label>
                      <select
                        value={bhkConfig}
                        onChange={(e) => setBhkConfig(e.target.value)}
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                          onChange={(e) => setMinRent(e.target.value)}
                          className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Rent</label>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxRent}
                          onChange={(e) => setMaxRent(e.target.value)}
                          className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Furnishing status */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Furnishing Status</label>
                      <select
                        value={furnishingStatus}
                        onChange={(e) => setFurnishingStatus(e.target.value)}
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                        onChange={(e) => setTenantPreference(e.target.value)}
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
                      >
                        <option value="any">Any Preference</option>
                        <option value="bachelors">Bachelors</option>
                        <option value="family">Family</option>
                        <option value="girls">Girls Only</option>
                        <option value="boys">Boys Only</option>
                      </select>
                    </div>

                    {/* No brokerage */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                      <span className="text-xs font-semibold text-slate-700">No Brokerage Only</span>
                      <button
                        type="button"
                        onClick={() => setZeroBrokerage(!zeroBrokerage)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          zeroBrokerage ? "bg-brand-primary" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            zeroBrokerage ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Additional filters */}
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">More Filters</p>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg">
                        <span className="text-xs font-semibold text-slate-700">Move-in Ready Now</span>
                        <button
                          type="button"
                          onClick={() => setAvailableFromToday(!availableFromToday)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            availableFromToday ? "bg-brand-primary" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              availableFromToday ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pet Policy</label>
                          <select
                            value={petPolicy}
                            onChange={(e) => setPetPolicy(e.target.value)}
                            className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary text-slate-800"
                          >
                            <option value="any">Any</option>
                            <option value="allowed">Pets Allowed</option>
                            <option value="not_allowed">No Pets</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Parking</label>
                          <select
                            value={parkingType}
                            onChange={(e) => setParkingType(e.target.value)}
                            className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-brand-primary text-slate-800"
                          >
                            <option value="any">Any</option>
                            <option value="two_wheeler">Two-Wheeler</option>
                            <option value="four_wheeler">Four-Wheeler</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
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

      {/* Owner Details Popup Modal */}
      {contactModalProp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setContactModalProp(null)}
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 border border-slate-100">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Owner Details</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {contactModalProp.title || `${contactModalProp.bhkConfig || ""} Flat in ${contactModalProp.localityId?.name || "Pune"}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalProp(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Owner Profile Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F7A5C] to-emerald-400 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0 overflow-hidden">
                    {contactModalProp.owner?.profilePhoto ? (
                      <img
                        src={contactModalProp.owner.profilePhoto}
                        alt={contactModalProp.owner?.name || "Owner"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(contactModalProp.owner?.name || contactModalProp.ownerName || "O").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 truncate">
                        {contactModalProp.owner?.name || contactModalProp.ownerName || "Property Owner"}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      ₹{contactModalProp.rentAmount ? contactModalProp.rentAmount.toLocaleString("en-IN") : "0"} / month • {contactModalProp.bhkConfig || "Flat"}
                    </p>
                  </div>
                </div>

                {/* Contact Details List */}
                <div className="pt-2 border-t border-slate-200/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 px-3.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                    <span className="text-slate-500 flex items-center gap-2 font-medium">
                      <Phone className="h-3.5 w-3.5 text-[#0F7A5C]" />
                      Phone Number
                    </span>
                    <span className="font-bold text-slate-900 tracking-wide font-mono">
                      {contactModalProp.owner?.phone || contactModalProp.contactNumber || "+91 98888 88888"}
                    </span>
                  </div>

                  {contactModalProp.owner?.email && (
                    <div className="flex items-center justify-between py-2 px-3.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                      <span className="text-slate-500 flex items-center gap-2 font-medium">
                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                        Email
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {contactModalProp.owner.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Call Button with Backend Logging */}
                  <button
                    type="button"
                    onClick={handleModalCall}
                    disabled={isCallingOwner}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
                  >
                    {isCallingOwner ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Phone className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>{isCallingOwner ? "Connecting..." : "Call"}</span>
                  </button>

                  {/* WhatsApp Button (if allowed while posting) */}
                  {contactModalProp.allowWhatsappContact !== false && (
                    <button
                      type="button"
                      onClick={handleModalWhatsapp}
                      disabled={isWhatsappLoading}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
                    >
                      {isWhatsappLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <WhatsAppIcon className="h-4 w-4 text-white" />
                      )}
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>

                <div className="text-center pt-2">
                  <Link
                    href={`/flat/${contactModalProp._id}`}
                    onClick={() => setContactModalProp(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primaryHover transition-colors"
                  >
                    <span>View Property Details Page</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
