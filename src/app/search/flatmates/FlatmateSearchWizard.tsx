'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, Search, Navigation,
  ChevronRight, ChevronUp, ChevronDown, MapPin, Car, X, Home, User as UserIcon, Edit3,
  Heart, Phone, Mail, CheckCircle2, Loader2, UserCheck
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles, getResponsiveMapStyles } from "@/lib/mapStyles";
import { createPoiMapMarkerIcon, getPoiVisualConfig } from "@/lib/poiIcons";
import { POPULAR_LOCALITIES_DATA, formatIntMetric, ALL_CATEGORIES, getTop4Categories } from "../flats/SearchWizard";
import { recordPropertyCallAction, recordPropertyWhatsappAction } from "@/app/flat/[id]/actions";
import { useSession } from "next-auth/react";
import { getMyListedProperties, UserListedPropertySummary } from "./actions";
import FacebookGroupCTA, { FacebookGroupData } from "@/components/FacebookGroupCTA";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
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

export default function FlatmateSearchWizard({
  pois,
  facebookGroups = [],
  popularLocalities = [],
}: {
  pois: POI[];
  facebookGroups?: FacebookGroupData[];
  popularLocalities?: {
    _id?: string;
    name: string;
    label: string;
    lat: number;
    lng: number;
  }[];
}) {
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
    types?: string[];
    type?: string;
  }[]>([]);
  const [poiSearchInput, setPoiSearchInput] = useState("");
  const [distance, setDistance] = useState("10000"); // in meters (10 km)

  // Logged-in user's listed properties for "For which property?" dropdown
  const { data: session, status } = useSession();
  const [userProperties, setUserProperties] = useState<UserListedPropertySummary[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  useEffect(() => {
    if (status === "authenticated") {
      getMyListedProperties().then((res) => {
        if (res.success && res.properties) {
          setUserProperties(res.properties);
        }
      });
    } else if (status === "unauthenticated") {
      setUserProperties([]);
      setSelectedPropertyId("");
    }
  }, [status]);

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
  const [isMobileMapHidden, setIsMobileMapHidden] = useState(false);

  // Wishlist & Owner Details Modal State
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [contactModalProp, setContactModalProp] = useState<any | null>(null);
  const [isCallingOwner, setIsCallingOwner] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);

  // Load saved wishlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("user_flats_wishlist");
        if (saved) setWishlist(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

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
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/search/flatmates";
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

  // Google Maps Instance Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const poiMarkersRef = useRef<any[]>([]);
  const isMapsLoaded = useGoogleMapsLoaded();
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredSeekersRef = useRef(false);

  // Trigger resize on map when toggled visible on mobile
  useEffect(() => {
    if (!isMobileMapHidden && mapInstanceRef.current && (window as any).google?.maps?.event) {
      setTimeout(() => {
        (window as any).google.maps.event.trigger(mapInstanceRef.current, "resize");
        if (selectedSeekerId) {
          const seeker = seekers.find((s) => s._id === selectedSeekerId);
          if (seeker?.property) {
            mapInstanceRef.current.panTo({ lat: seeker.property.lat, lng: seeker.property.lng });
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
      if (hasRestoredSeekersRef.current) {
        hasRestoredSeekersRef.current = false;
        restoreScrollPosition();
        return;
      }
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

  const getNextStep = (currentStep: number, _overrideVal?: string) => {
    return currentStep + 1;
  };

  const getPrevStep = (currentStep: number) => {
    if (currentStep > 1) {
      return currentStep - 1;
    }
    return 1;
  };

  // Ref to track when initial state restoration from sessionStorage is complete
  const isRestoredRef = useRef(false);

  // Restore flatmate wizard state and step from sessionStorage or history.state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedRaw = sessionStorage.getItem("flatmate_search_wizard_state_v2");

      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.searchIntent) setSearchIntent(saved.searchIntent);
        if (saved.searchArea) setSearchArea(saved.searchArea);
        if (saved.searchAreaInput) setSearchAreaInput(saved.searchAreaInput);
        if (saved.poisList && Array.isArray(saved.poisList)) setPoisList(saved.poisList);
        if (saved.distance) setDistance(saved.distance);
        if (saved.prefUserType) setPrefUserType(saved.prefUserType);
        if (saved.myUserType) setMyUserType(saved.myUserType);
        if (saved.prefProfession) setPrefProfession(saved.prefProfession);
        if (saved.prefShift) setPrefShift(saved.prefShift);
        if (saved.personality) setPersonality(saved.personality);
        if (saved.cleanliness) setCleanliness(saved.cleanliness);
        if (saved.food) setFood(saved.food);
        if (saved.smoking) setSmoking(saved.smoking);
        if (saved.sleep) setSleep(saved.sleep);
        if (saved.minBudget) setMinBudget(saved.minBudget);
        if (saved.maxBudget) setMaxBudget(saved.maxBudget);
        if (saved.minAge) setMinAge(saved.minAge);
        if (saved.maxAge) setMaxAge(saved.maxAge);
        if (saved.gender) setGender(saved.gender);
        if (saved.filterCleanliness) setFilterCleanliness(saved.filterCleanliness);
        if (saved.filterFood) setFilterFood(saved.filterFood);
        if (saved.filterSmoking) setFilterSmoking(saved.filterSmoking);
        if (saved.filterSleep) setFilterSleep(saved.filterSleep);
        if (saved.selectedPropertyId) setSelectedPropertyId(saved.selectedPropertyId);

        if (Array.isArray(saved.seekers) && saved.seekers.length > 0) {
          setSeekers(saved.seekers);
        }
      }

      // Check priority for active step:
      // 1. URL search param `?step=X` (e.g. ?step=1 or ?step=8)
      // 2. Tab history state `window.history.state?.flatmateWizardStep` (when returning via browser back in this tab)
      // 3. Default to Step 1 (for fresh tab entry / open in new tab)
      let initialStep = 1;
      const urlParams = new URLSearchParams(window.location.search);
      const paramStep = urlParams.get("step");
      if (paramStep && !isNaN(parseInt(paramStep))) {
        initialStep = Math.min(Math.max(parseInt(paramStep), 1), 8);
      } else if (typeof window.history.state?.flatmateWizardStep === "number") {
        initialStep = window.history.state.flatmateWizardStep;
      }

      setStep(initialStep);

      const currentState = window.history.state || {};
      window.history.replaceState({ ...currentState, flatmateWizardStep: initialStep }, "", window.location.href);
    } catch (e) {
      console.error("Error restoring flatmate search state:", e);
    } finally {
      isRestoredRef.current = true;
    }
  }, []);

  const saveCurrentScroll = (clickedSeekerId?: string) => {
    if (typeof window === "undefined" || step !== 8) return;
    try {
      const savedRaw = sessionStorage.getItem("flatmate_search_wizard_state_v2");
      const saved = savedRaw ? JSON.parse(savedRaw) : {};
      const containerTop = listingsContainerRef.current ? listingsContainerRef.current.scrollTop : 0;
      const windowTop = window.scrollY || document.documentElement.scrollTop || 0;

      sessionStorage.setItem(
        "flatmate_search_wizard_state_v2",
        JSON.stringify({
          ...saved,
          scrollContainerTop: containerTop,
          scrollWindowTop: windowTop,
          lastSeekerId: clickedSeekerId !== undefined ? clickedSeekerId : saved.lastSeekerId,
          seekers,
        })
      );
    } catch (_) {}
  };

  const restoreScrollPosition = () => {
    if (typeof window === "undefined") return;
    try {
      const savedRaw = sessionStorage.getItem("flatmate_search_wizard_state_v2");
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      const { scrollContainerTop, scrollWindowTop, lastSeekerId } = saved;

      const applyScroll = () => {
        let cardFound = false;
        if (lastSeekerId) {
          const el = document.getElementById(`seeker-card-${lastSeekerId}`);
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
      const savedRaw = sessionStorage.getItem("flatmate_search_wizard_state_v2");
      const saved = savedRaw ? JSON.parse(savedRaw) : {};
      const containerTop = listingsContainerRef.current ? listingsContainerRef.current.scrollTop : (saved.scrollContainerTop || 0);
      const windowTop = typeof window !== "undefined" ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;

      const stateToSave = {
        ...saved,
        step,
        searchIntent,
        searchArea,
        searchAreaInput,
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
        minBudget,
        maxBudget,
        minAge,
        maxAge,
        gender,
        filterCleanliness,
        filterFood,
        filterSmoking,
        filterSleep,
        selectedPropertyId,
        seekers,
        scrollContainerTop: containerTop,
        scrollWindowTop: windowTop,
      };
      sessionStorage.setItem("flatmate_search_wizard_state_v2", JSON.stringify(stateToSave));
    } catch (_) {}
  }, [
    step,
    searchIntent,
    searchArea,
    searchAreaInput,
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
    minBudget,
    maxBudget,
    minAge,
    maxAge,
    gender,
    filterCleanliness,
    filterFood,
    filterSmoking,
    filterSleep,
    selectedPropertyId,
    seekers,
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
  }, [step, seekers]);

  const goToStep = (nextStepNum: number, push = true) => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (nextStepNum === 8) {
        currentUrl.searchParams.delete("step");
      } else {
        currentUrl.searchParams.set("step", nextStepNum.toString());
      }

      if (push) {
        window.history.pushState({ ...(window.history.state || {}), flatmateWizardStep: nextStepNum }, "", currentUrl.toString());
      } else {
        window.history.replaceState({ ...(window.history.state || {}), flatmateWizardStep: nextStepNum }, "", currentUrl.toString());
      }
    }
    setStep(nextStepNum);
    if (typeof window !== "undefined" && nextStepNum < 8) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleNext = (currentStep: number, overrideVal?: string) => {
    const next = getNextStep(currentStep, overrideVal);
    goToStep(next, true);
  };

  const handleBack = (currentStep: number) => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state.flatmateWizardStep === "number" &&
      window.history.state.flatmateWizardStep > 1
    ) {
      window.history.back();
    } else {
      const prev = getPrevStep(currentStep);
      goToStep(prev, false);
    }
  };

  // Sync browser back/forward buttons with flatmate wizard steps
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentState = window.history.state || {};
    if (typeof currentState.flatmateWizardStep !== "number") {
      window.history.replaceState({ ...currentState, flatmateWizardStep: step }, "", window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.flatmateWizardStep === "number") {
        setStep(event.state.flatmateWizardStep);
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

  // Scroll to top ONLY on wizard steps 1-7
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step < 8) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [step]);

  const handleSeekerCardClick = (seeker: any) => {
    setSelectedSeekerId((prev) => (prev === seeker._id ? null : seeker._id));
    if (mapInstanceRef.current && seeker.property) {
      const lat = seeker.property.lat;
      const lng = seeker.property.lng;
      if (typeof lat === "number" && typeof lng === "number") {
        mapInstanceRef.current.panTo({ lat, lng });
        if (mapInstanceRef.current.getZoom() < 14) {
          mapInstanceRef.current.setZoom(14);
        }
      }
    }
  };

  // Google Map Initialization (Flow 1 ONLY)
  useEffect(() => {
    if (!isMapsLoaded || step !== 8 || searchIntent !== "ROOMMATE_WITH_FLAT" || !mapRef.current) return;

    // Center on Locality / Area if selected, else POI, else Central Pune view
    const centerLat = searchArea ? searchArea.lat : (poisList.length > 0 ? poisList[0].lat : 18.5204);
    const centerLng = searchArea ? searchArea.lng : (poisList.length > 0 ? poisList[0].lng : 73.8567);
    const initialZoom = searchArea ? 13 : (poisList.length > 0 ? 13 : 11);

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: initialZoom,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: getResponsiveMapStyles(),
    });
    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current = null;
    };
  }, [isMapsLoaded, step, searchIntent]);

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


  // Effect to manage commute POI markers with custom themed circle icons in Flatmates
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsLoaded || searchIntent !== "ROOMMATE_WITH_FLAT") return;

    poiMarkersRef.current.forEach((m) => m.setMap(null));
    poiMarkersRef.current = [];

    poisList.forEach((poi) => {
      const visualConfig = getPoiVisualConfig(poi);
      const icon = createPoiMapMarkerIcon(poi);

      const marker = new (window as any).google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: mapInstanceRef.current,
        title: `${poi.label} (${visualConfig.categoryLabel})`,
        icon,
        zIndex: 15,
        clickable: false,
      });

      poiMarkersRef.current.push(marker);
    });
  }, [poisList, isMapsLoaded, step, searchIntent]);

  // Seeker map markers (Flow 1 ONLY)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapsLoaded || searchIntent !== "ROOMMATE_WITH_FLAT") return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    seekers.forEach((seeker: any) => {
      if (!seeker.property) return;
      const coords = { lat: seeker.property.lat, lng: seeker.property.lng };
      if (typeof coords.lat !== "number" || typeof coords.lng !== "number") return;

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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords);
          if (mapInstanceRef.current.getZoom() < 14) {
            mapInstanceRef.current.setZoom(14);
          }
        }
      });

      markersRef.current.push(marker);
    });
  }, [seekers, selectedSeekerId, hoveredSeekerId, isMapsLoaded, searchIntent]);

  // Autocomplete setup for Step 2 area and POIs
  useEffect(() => {
    if (!isMapsLoaded || step !== 2) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.35, 73.65),
      new (window as any).google.maps.LatLng(18.72, 74.05)
    );

    const isWithinPune = (lat: number, lng: number) => {
      return lat >= 18.35 && lat <= 18.75 && lng >= 73.55 && lng <= 74.15;
    };

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
            if (prev.some((p) => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          setPoiSearchInput("");
          poiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, step]);

  // Autocomplete setup for "Refine Search" panel POIs in Flatmates
  useEffect(() => {
    if (!isMapsLoaded || !showFiltersPanel) return;

    const puneBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(18.35, 73.65),
      new (window as any).google.maps.LatLng(18.72, 74.05)
    );

    const isWithinPune = (lat: number, lng: number) => {
      return lat >= 18.35 && lat <= 18.75 && lng >= 73.55 && lng <= 74.15;
    };

    const refinePoiInput = document.getElementById("flatmate-refine-poi-autocomplete") as HTMLInputElement;
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
            if (prev.some((p) => p.label === newPoi.label)) return prev;
            return [...prev, newPoi];
          });

          refinePoiInput.value = "";
        }
      });
    }
  }, [isMapsLoaded, showFiltersPanel]);

  // Choice step rendering method
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
                      ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                      : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-2 sm:mb-2.5 transition-transform duration-250 group-hover:scale-115 ${
                      isSelected ? "bg-brand-primary/15" : "bg-slate-100"
                    }`}
                  >
                    {opt.emoji}
                  </div>
                  <span
                    className={`text-sm sm:text-sm font-bold text-center leading-snug ${
                      isSelected ? "text-brand-primary font-extrabold" : "text-slate-800"
                    }`}
                  >
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
      {/* STEP 1: BRANCHING INTENT SELECTION */}
      {step === 1 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
                What are you looking for?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setSearchIntent("ROOMMATE_WITH_FLAT");
                  goToStep(2);
                }}
                className={`h-40 sm:h-44 w-full flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 group text-center ${
                  searchIntent === "ROOMMATE_WITH_FLAT"
                    ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                }`}
              >
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-2.5 group-hover:scale-105 transition-transform">
                  🏠
                </div>
                <span className="text-sm font-extrabold text-slate-800">A flat with a flatmate</span>
                <span className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-tight">
                  Find a room in someone's existing flat.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchIntent("FLATMATE_ONLY");
                  goToStep(2);
                }}
                className={`h-40 sm:h-44 w-full flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 group text-center ${
                  searchIntent === "FLATMATE_ONLY"
                    ? "border-brand-primary bg-brand-primary/10/20 ring-2 ring-brand-primary/20"
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50"
                }`}
              >
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-2.5 group-hover:scale-105 transition-transform">
                  🤝
                </div>
                <span className="text-sm font-extrabold text-slate-800">Just a flatmate</span>
                <span className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-tight">
                  Team up with someone else who's searching, and find a flat together.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION & POIS */}
      {step === 2 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
                {searchIntent === "ROOMMATE_WITH_FLAT"
                  ? "Where should your flatmate's flat be?"
                  : "Which area are you searching in?"}
              </h2>
            </div>

            <div className="space-y-5 flex-grow">
              {/* Search Area Locality Filter */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 block leading-tight">Area</label>

                <div className="relative">
                  <input
                    id="search-area-autocomplete"
                    type="text"
                    placeholder="Search locality or neighborhood in Pune (e.g. Hinjewadi, Baner)..."
                    value={searchAreaInput}
                    onChange={(e) => setSearchAreaInput(e.target.value)}
                    onBlur={() => {
                      // Only allow confirmed dropdown selection - revert unselected custom text
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

              {/* FLATMATE_ONLY: Show "For which property?" dropdown if logged in & has properties, presented as OR */}
              {searchIntent === "FLATMATE_ONLY" && status === "authenticated" && userProperties.length > 0 && (
                <>
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-white px-2">
                      OR
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block leading-tight">
                      For which property?
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPropertyId}
                        onChange={(e) => {
                          const propId = e.target.value;
                          setSelectedPropertyId(propId);
                          const found = userProperties.find((p) => p._id === propId);
                          if (found && found.lat && found.lng) {
                            setSearchArea({
                              label: found.localityName || found.title,
                              lat: found.lat,
                              lng: found.lng,
                            });
                            setSearchAreaInput(found.localityName || found.title);
                          }
                        }}
                        className="w-full text-xs font-medium border border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 shadow-xs transition-all cursor-pointer"
                      >
                        <option value="">Select your listed property (Optional)</option>
                        {userProperties.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title} {p.localityName ? `— ${p.localityName}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ROOMMATE_WITH_FLAT ONLY: Autocomplete for Custom POIs / Daily Destinations */}
              {searchIntent === "ROOMMATE_WITH_FLAT" && (
                <>
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Your Daily Destinations
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <input
                        id="poi-autocomplete"
                        type="text"
                        placeholder="Work, college, gym — anywhere you travel to often in Pune..."
                        value={poiSearchInput}
                        onChange={(e) => setPoiSearchInput(e.target.value)}
                        onBlur={() => {
                          setPoiSearchInput("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        className="w-full text-xs border border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl pl-9 pr-3 py-2.5 bg-white text-slate-800 placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 shadow-xs transition-all"
                      />
                    </div>
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
                              type="button"
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
                </>
              )}

              {/* Distance range slider */}
              {(searchArea || poisList.length > 0) && (
                <div className="space-y-2 animate-in fade-in duration-200 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
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
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
              <div className="w-full max-w-xl mx-auto flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleBack(2)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleNext(2)}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-3 sm:py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
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
          "Their profession should be?",
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
          (val) => handleNext(3, val),
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
          (val) => handleNext(4, val),
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
          (val) => handleNext(5, val),
          () => handleBack(5)
        )}

      {/* STEP 6: LIFESTYLE MULTI-FIELDS */}
      {step === 6 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">Any lifestyle preferences?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cleanliness</label>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                  className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                  className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                  className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                  className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
                >
                  <option value="">No preference</option>
                  <option value="Early riser">Early riser</option>
                  <option value="Night owl">Night owl</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
              <div className="w-full max-w-xl mx-auto flex items-center space-x-3">
                <button
                  onClick={() => handleBack(6)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext(6)}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-3 sm:py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: BUDGET & PREFERENCES */}
      {step === 7 && (
        <div className="flex-grow flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 bg-white sm:bg-slate-50/50">
          <div className="w-full max-w-xl bg-white border-0 sm:border rounded-none sm:rounded-2xl p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 shadow-none sm:shadow-sm space-y-5 sm:space-y-6 flex flex-col">
            <div className="text-center pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">Set your budget and preferences</h2>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Budget (₹/mo)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
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
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Age</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 sm:static sm:bg-transparent sm:border-t-0 sm:p-0 sm:m-0 sm:pt-2">
              <div className="w-full max-w-xl mx-auto flex items-center space-x-3">
                <button
                  onClick={() => handleBack(7)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext(7)}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl py-3 sm:py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
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
          {/* Mobile View Map Toggle Bar (shown when mobile map is hidden in Flow 1) */}
          {searchIntent === "ROOMMATE_WITH_FLAT" && isMobileMapHidden && (
            <div className="lg:hidden w-full flex justify-center py-2 bg-slate-100/90 border-b border-slate-200 sticky top-16 z-20 backdrop-blur-sm">
              <button
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

          {/* Real Google Map Column (Flow 1 ONLY: Left 40% on LG, full width attached to navbar on mobile) */}
          {searchIntent === "ROOMMATE_WITH_FLAT" && (
            <div
              className={`w-full lg:w-[40%] sticky top-16 lg:top-[80px] z-20 lg:z-10 flex-shrink-0 p-0 lg:p-4 transition-all duration-300 ${
                isMobileMapHidden
                  ? "hidden lg:block lg:h-[calc(100vh-100px)]"
                  : "h-[210px] lg:h-[calc(100vh-100px)]"
              }`}
            >
              {/* Inner rounded map panel wrapper: Attached to top & screen ends on mobile, rounded only on bottom-left and bottom-right */}
              <div className="w-full h-full rounded-none rounded-b-2xl lg:rounded-2xl overflow-hidden shadow-md border-b lg:border border-slate-200 relative">
                {/* Google Map Div */}
                <div ref={mapRef} className="w-full h-full">
                  {!isMapsLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400 font-sans">
                      Loading Google Map...
                    </div>
                  )}
                </div>

                {/* Mobile Arrow Button in bottom center to hide map view */}
                <button
                  onClick={() => setIsMobileMapHidden(true)}
                  title="Hide Map"
                  aria-label="Hide Map"
                  className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-md rounded-full px-3 py-1 flex items-center space-x-1 text-[11px] font-semibold transition-all active:scale-95 backdrop-blur-xs"
                >
                  <span>Hide Map</span>
                  <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
                </button>

                {/* Floating selected preview card */}
                {selectedSeekerId && (() => {
                  const seeker = seekers.find((s) => s._id === selectedSeekerId);
                  if (!seeker) return null;
                  return (
                    <div className="hidden lg:flex absolute bottom-4 left-4 right-4 bg-white p-3 rounded-xl border shadow-lg z-20 items-center space-x-3 animate-in slide-in-from-bottom duration-200">
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
          <div ref={listingsContainerRef} className={`p-4 lg:p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-100px)] ${
            searchIntent === "ROOMMATE_WITH_FLAT" ? "w-full lg:w-[60%]" : "w-full"
          }`}>
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                  Pune Roommates ({seekers.length})
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  {searchIntent === "ROOMMATE_WITH_FLAT"
                    ? "Flatmates who already own/rent a flat."
                    : "Flatmates searching for flats together."}
                </p>
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
              <div className="text-center py-16 text-xs text-slate-400 space-y-2 font-sans">
                <div className="h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Searching active seekers...</span>
              </div>
            ) : seekers.length > 0 ? (
              <div className={`grid gap-5 ${
                searchIntent === "ROOMMATE_WITH_FLAT" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {seekers.map((seeker: any, index: number) => {
                  const isSelected = selectedSeekerId === seeker._id;
                  const isHovered = hoveredSeekerId === seeker._id;

                  // Extract habits for chips
                  const cleanlinessTag = seeker.vibePreferences
                    ?.find((v: string) => v.startsWith("cleanliness:"))
                    ?.split(":")[1];
                  const foodTag = seeker.vibePreferences
                    ?.find((v: string) => v.startsWith("food:"))
                    ?.split(":")[1];

                  if (searchIntent === "ROOMMATE_WITH_FLAT" && seeker.property) {
                    // PROPERTY-FIRST CARD DESIGN (Matching Flats Search Property Card)
                    const prop = seeker.property;
                    const isWishlisted = wishlist.includes(prop._id.toString());

                    // Proximity measurement from Area + radius
                    const distKm =
                      prop.areaDistanceKm !== null && prop.areaDistanceKm !== undefined
                        ? prop.areaDistanceKm
                        : prop.distanceKm !== undefined
                        ? prop.distanceKm
                        : seeker.distanceKm;

                    const isOutside =
                      prop.inAreaProximity === false ||
                      (prop.areaDistanceKm === null && prop.inProximity === false) ||
                      seeker.isOutside ||
                      false;

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
                      } else if (seeker.commuteDetails && seeker.commuteDetails.length > 0) {
                        spots = seeker.commuteDetails;
                      } else {
                        spots = poisList.map((p) => ({
                          label: p.label,
                          distanceKm: prop.distanceKm || seeker.distanceKm || 4,
                          durationMin: prop.commuteTimeMin || seeker.commuteTimeMin || 15,
                        }));
                      }
                    }
                    const displaySpots = spots.slice(0, 6);

                    // Top 4 amenities based on lifestyle choices
                    const top4Categories = getTop4Categories(
                      prefUserType || myUserType || "",
                      personality || "",
                      "",
                      food || "",
                      ""
                    );

                    return (
                      <React.Fragment key={seeker._id}>
                        <div
                          id={`seeker-card-${seeker._id}`}
                          onClick={() => {
                            saveCurrentScroll(seeker._id.toString());
                            handleSeekerCardClick(seeker);
                          }}
                          onMouseEnter={() => setHoveredSeekerId(seeker._id)}
                          onMouseLeave={() => setHoveredSeekerId(null)}
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
                            {distKm !== null && distKm !== undefined && isOutside && (
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

                            {/* 4. Flatmates Section */}
                            <div className="py-2 space-y-1.5">
                              <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                                Flatmates
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {/* Primary Seeker Flatmate Pill */}
                                <div className="inline-flex items-center bg-[#0F7A5C] text-white rounded-full pl-0.5 pr-3.5 py-0.5 shadow-xs">
                                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20">
                                    {seeker.profilePhoto ? (
                                      <img
                                        src={seeker.profilePhoto}
                                        alt={seeker.name || "Flatmate"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-black text-white text-[10px] font-bold">
                                        {(seeker.name || "F").charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold text-white ml-2 whitespace-nowrap">
                                    {seeker.name || "Flatmate"}
                                  </span>
                                </div>

                                {/* Any additional flatmates from property */}
                                {Array.isArray(prop.flatmates) &&
                                  prop.flatmates
                                    .filter((fm: any) => fm._id?.toString() !== seeker._id?.toString() && fm.name !== seeker.name)
                                    .map((fm: any, fmIdx: number) => (
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
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white text-[10px] font-bold">
                                              {(fm.name || "F").charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-xs font-bold text-white ml-2 whitespace-nowrap">
                                          {fm.name || "Flatmate"}
                                        </span>
                                      </div>
                                    ))}

                                {/* Match Score Pill */}
                                {seeker.matchScore !== undefined && seeker.matchScore !== null && (
                                  <span className="text-[10px] font-extrabold text-[#0F7A5C] bg-[#0F7A5C]/10 px-2.5 py-0.5 rounded-full border border-[#0F7A5C]/20 ml-auto">
                                    {seeker.matchScore}% Match
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="border-b border-slate-100 my-1.5" />

                            {/* 5. Nearby Places Section */}
                            <div className="py-2 space-y-1.5">
                              <div className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                                Nearby Places
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                {top4Categories.map((cat) => {
                                  const amenities = prop.nearbyAmenities || seeker.nearbyAmenities;
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

                            {/* 6. Bottom Action Row */}
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
                                  saveCurrentScroll(seeker._id.toString());
                                }}
                                className="flex flex-col items-center justify-center gap-1 text-brand-primary hover:text-brand-primaryHover font-bold group"
                              >
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                <span className="text-[10px] font-bold tracking-tight">Details</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      {/* Repeating Facebook Community CTA every 8 items OR at end of results */}
                      {((index + 1) % 8 === 0 || index + 1 === seekers.length) && (
                        <FacebookGroupCTA
                          key={`fb-cta-${index}`}
                          groups={facebookGroups}
                          category="flatmates"
                          isBlank={false}
                        />
                      )}
                    </React.Fragment>
                    );
                  } else {
                    // FLATMATE-FIRST CARD DESIGN (Flow 2)
                    return (
                      <React.Fragment key={seeker._id}>
                        <div
                          id={`seeker-card-${seeker._id}`}
                          onClick={() => saveCurrentScroll(seeker._id.toString())}
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
                              <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
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
                          <Link
                            href={`/flatmate/${seeker._id}`}
                            onClick={() => saveCurrentScroll(seeker._id.toString())}
                          >
                            <button className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1 transition-colors shadow-sm">
                              <span>View Profile</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                      {/* Repeating Facebook Community CTA every 8 items OR at end of results */}
                      {((index + 1) % 8 === 0 || index + 1 === seekers.length) && (
                        <FacebookGroupCTA
                          key={`fb-cta-${index}`}
                          groups={facebookGroups}
                          category="flatmates"
                          isBlank={false}
                        />
                      )}
                    </React.Fragment>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-12 border border-dashed rounded-xl bg-slate-50 text-slate-450 text-xs font-sans">
                  No active seekers found matching your compatibility criteria. Try broadening your filters.
                </div>
                <FacebookGroupCTA groups={facebookGroups} category="flatmates" isBlank={true} />
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
                    {/* Regular travel spots / Commute POIs */}
                    <div className="space-y-2 border-b pb-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Regular Travel Spots ({poisList.length})
                        </label>
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
                          id="flatmate-refine-poi-autocomplete"
                          type="text"
                          placeholder="Search work, college, gym to add..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.preventDefault();
                          }}
                          className="w-full text-xs border border-slate-200 hover:border-brand-primary/50 focus:border-brand-primary rounded-xl px-3 py-2 bg-slate-50 text-slate-800 placeholder:text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 shadow-xs transition-all"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                          className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
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
                          className="w-full text-xs placeholder:text-[11px] sm:placeholder:text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
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
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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
                        className="w-full text-[11px] sm:text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 outline-brand-primary text-slate-800"
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

      {/* OWNER DETAILS POPUP MODAL */}
      {contactModalProp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setContactModalProp(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-full bg-emerald-50 text-[#0F7A5C]">
                  <Phone className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Owner Contact Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setContactModalProp(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Owner Info Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-base shadow-inner flex-shrink-0 overflow-hidden">
                    {contactModalProp.owner?.avatar ? (
                      <img
                        src={contactModalProp.owner.avatar}
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
