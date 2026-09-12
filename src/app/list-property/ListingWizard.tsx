'use client';

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publishProperty, updateProperty } from "./actions";
import {
  Building, MapPin, Image as ImageIcon, ShieldCheck, Zap, PawPrint,
  ChevronLeft, ChevronRight, Sparkles, Check, CheckCircle2,
  UploadCloud, X, Film, Star, Loader2, Trash2, AlertCircle, AlertTriangle
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles } from "@/lib/mapStyles";
import type { MediaUploadConfig } from "@/lib/mediaConfig";

interface Locality {
  _id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function ListingWizard({
  localities,
  mediaConfig = {
    maxPropertyVideos: 5,
    maxVideoSizeMb: 5120,
    maxVideoDurationMinutes: 10,
    maxPropertyImages: 10,
    maxImageSizeMb: 25,
  },
  initialProperty,
  approveOnSave = false,
}: {
  localities: Locality[];
  mediaConfig?: MediaUploadConfig;
  initialProperty?: any;
  approveOnSave?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Validation States & Messages
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGlobalError(null);
  };

  // Wizard State
  const [basics, setBasics] = useState<{
    title: string;
    description: string;
    bhkConfig: string;
    propertyType: string;
    floor: number | string;
    totalFloors: number | string;
    areaSqft: number | string;
  }>({
    title: initialProperty?.title || "",
    description: initialProperty?.description || "",
    bhkConfig: initialProperty?.bhkConfig || "2BHK",
    propertyType: initialProperty?.propertyType || "apartment",
    floor: initialProperty?.floor !== undefined ? initialProperty.floor : "",
    totalFloors: initialProperty?.totalFloors !== undefined ? initialProperty.totalFloors : "",
    areaSqft: initialProperty?.areaSqft !== undefined ? initialProperty.areaSqft : "",
  });

  const [location, setLocation] = useState({
    localityId: initialProperty?.localityId || localities[0]?._id || "",
    addressLine: initialProperty?.addressLine || "",
    lat: initialProperty?.lat || localities[0]?.lat || 18.5597,
    lng: initialProperty?.lng || localities[0]?.lng || 73.7922,
  });

  const [media, setMedia] = useState<{
    images: { url: string; isCover: boolean; fileName: string }[];
    videos: { url: string; fileName: string; sizeBytes?: number }[];
  }>({
    images: initialProperty?.images || [],
    videos: initialProperty?.videos || [],
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const [amenities, setAmenities] = useState<string[]>(initialProperty?.amenities || []);
  const [houseRules, setHouseRules] = useState<string[]>(initialProperty?.houseRules || []);
  const [safetyFeatures, setSafetyFeatures] = useState<string[]>(initialProperty?.safetyFeatures || []);

  const [propertyDetails, setPropertyDetails] = useState<{
    availableFrom: string;
    minLeaseMonths: number | string;
    lockInMonths: number | string;
    petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
    maxOccupants: number | string;
    parkingType: 'none' | 'two_wheeler' | 'four_wheeler' | 'both';
    evChargingAvailable: boolean;
    powerBackup: 'none' | 'partial' | 'full';
    waterSupplyType: 'municipal' | 'borewell' | 'tanker' | 'mixed';
    fiberAvailable: boolean;
    avgSpeedMbps: string | number;
    allowWhatsappContact: boolean;
  }>({
    availableFrom: initialProperty?.availableFrom || new Date().toISOString().split('T')[0],
    minLeaseMonths: initialProperty?.minLeaseMonths !== undefined ? initialProperty.minLeaseMonths : 11,
    lockInMonths: initialProperty?.lockInMonths !== undefined ? initialProperty.lockInMonths : "",
    petPolicy: initialProperty?.petPolicy || 'case_by_case',
    maxOccupants: initialProperty?.maxOccupants !== undefined ? initialProperty.maxOccupants : "",
    parkingType: initialProperty?.parkingType || 'none',
    evChargingAvailable: !!initialProperty?.evChargingAvailable,
    powerBackup: initialProperty?.powerBackup || 'none',
    waterSupplyType: initialProperty?.waterSupplyType || 'municipal',
    fiberAvailable: !!initialProperty?.fiberAvailable,
    avgSpeedMbps: initialProperty?.avgSpeedMbps !== undefined ? initialProperty.avgSpeedMbps : '',
    allowWhatsappContact: initialProperty?.allowWhatsappContact !== false,
  });

  const [pricing, setPricing] = useState<{
    rentAmount: number | string;
    depositAmount: number | string;
    maintenanceAmount: number | string;
    furnishingStatus: string;
    tenantPreference: string;
    brokerageFlag: boolean;
    brokerageAmount: number | string;
  }>({
    rentAmount: initialProperty?.rentAmount !== undefined ? initialProperty.rentAmount : "",
    depositAmount: initialProperty?.depositAmount !== undefined ? initialProperty.depositAmount : "",
    maintenanceAmount: initialProperty?.maintenanceAmount !== undefined ? initialProperty.maintenanceAmount : "",
    furnishingStatus: initialProperty?.furnishingStatus || "semi_furnished",
    tenantPreference: initialProperty?.tenantPreference || "any",
    brokerageFlag: !!initialProperty?.brokerageFlag,
    brokerageAmount: initialProperty?.brokerageAmount !== undefined ? initialProperty.brokerageAmount : "",
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const isMapsLoaded = useGoogleMapsLoaded();

  const selectClosestLocality = (lat: number, lng: number) => {
    let closestId = "";
    let minDist = Infinity;
    localities.forEach((loc) => {
      const dist = (loc.lat - lat) ** 2 + (loc.lng - lng) ** 2;
      if (dist < minDist) {
        minDist = dist;
        closestId = loc._id;
      }
    });
    return closestId;
  };

  const handleLocalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const selected = localities.find(l => l._id === id);
    if (selected) {
      setLocation(prev => ({
        ...prev,
        localityId: id,
        lat: selected.lat,
        lng: selected.lng,
      }));

      // Reactive update to Google Map instance
      if (mapInstanceRef.current && markerInstanceRef.current) {
        const pos = { lat: selected.lat, lng: selected.lng };
        mapInstanceRef.current.setCenter(pos);
        mapInstanceRef.current.setZoom(15);
        markerInstanceRef.current.setPosition(pos);
      }
    }
  };

  useEffect(() => {
    if (!isMapsLoaded || step !== 2 || !mapRef.current) return;

    const initialPos = { lat: location.lat, lng: location.lng };

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: mapStyles,
    });
    mapInstanceRef.current = map;

    const marker = new (window as any).google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
    });
    markerInstanceRef.current = marker;

    // Handle marker dragend
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        updateCoordinates(lat, lng);
      }
    });

    // Handle map clicks to place marker
    map.addListener("click", (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      updateCoordinates(lat, lng);
    });

    // Setup autocomplete input
    const input = document.getElementById("listing-address-autocomplete") as HTMLInputElement;
    if (input) {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "in" },
        bounds: new (window as any).google.maps.LatLngBounds(
          new (window as any).google.maps.LatLng(18.4, 73.6),
          new (window as any).google.maps.LatLng(18.7, 74.05)
        ),
        fields: ["formatted_address", "geometry", "name"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const formattedAddress = place.formatted_address || place.name || "";

          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });

          const closestLocId = selectClosestLocality(lat, lng);
          setLocation(prev => ({
            ...prev,
            lat,
            lng,
            localityId: closestLocId || prev.localityId,
            addressLine: formattedAddress,
          }));
        }
      });
    }

    function updateCoordinates(lat: number, lng: number) {
      const closestLocId = selectClosestLocality(lat, lng);
      setLocation(prev => ({
        ...prev,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        localityId: closestLocId || prev.localityId,
      }));

      // Reverse geocode to retrieve address line
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === "OK" && results && results[0]) {
          setLocation(prev => ({
            ...prev,
            addressLine: results[0].formatted_address || prev.addressLine,
          }));
        }
      });
    }
  }, [isMapsLoaded, step]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.images.length + files.length > mediaConfig.maxPropertyImages) {
      setGlobalError(`You can upload a maximum of ${mediaConfig.maxPropertyImages} photos. You already have ${media.images.length}.`);
      return;
    }

    setIsUploading(true);
    const newImages = [...media.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > mediaConfig.maxImageSizeMb * 1024 * 1024) {
        setGlobalError(`"${file.name}" exceeds the maximum image size limit of ${mediaConfig.maxImageSizeMb} MB.`);
        continue;
      }

      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const res = await fetch("/api/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            mediaType: "image",
            fileSize: file.size,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get presigned upload URL");
        }

        const data = await res.json();
        const { uploadUrl, publicUrl, rawKey, processedUrls } = data;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(prev => ({ ...prev, [fileId]: percentComplete }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during S3 upload"));
          };

          xhr.send(file);
        });

        const previewUrl = URL.createObjectURL(file);
        const hasCover = newImages.some(img => img.isCover);
        newImages.push({
          url: processedUrls?.medium || publicUrl,
          previewUrl,
          isCover: !hasCover,
          fileName: file.name,
          rawKey,
          status: "ready",
          processedUrls,
        } as any);

        setMedia(prev => ({ ...prev, images: [...newImages] }));
        clearFieldError("images");
      } catch (err: any) {
        console.error(err);
        setGlobalError(`Failed to upload ${file.name}: ${err.message}`);
      } finally {
        setTimeout(() => {
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }, 1000);
      }
    }

    setIsUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.videos.length + files.length > mediaConfig.maxPropertyVideos) {
      setGlobalError(`You can upload a maximum of ${mediaConfig.maxPropertyVideos} videos. You already have ${media.videos.length}.`);
      return;
    }

    setIsUploading(true);
    const newVideos = [...media.videos];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > mediaConfig.maxVideoSizeMb * 1024 * 1024) {
        setGlobalError(`"${file.name}" exceeds the maximum video size limit of ${mediaConfig.maxVideoSizeMb} MB.`);
        continue;
      }

      // Check duration <= 10 minutes (600s, configurable via admin)
      const maxDurationMin = mediaConfig.maxVideoDurationMinutes || 10;
      const durationSeconds = await checkVideoDuration(file);
      if (durationSeconds > maxDurationMin * 60) {
        setGlobalError(`"${file.name}" exceeds the maximum duration limit of ${maxDurationMin} minutes (${Math.round(durationSeconds)}s). Videos must be ${maxDurationMin} minutes or shorter.`);
        continue;
      }

      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const res = await fetch("/api/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            mediaType: "video",
            fileSize: file.size,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get presigned upload URL");
        }

        const data = await res.json();
        const { uploadUrl, publicUrl, rawKey, processedUrl, thumbnailUrl } = data;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(prev => ({ ...prev, [fileId]: percentComplete }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during S3 upload"));
          };

          xhr.send(file);
        });

        const previewUrl = URL.createObjectURL(file);
        newVideos.push({
          url: processedUrl || publicUrl,
          previewUrl,
          fileName: file.name,
          sizeBytes: file.size,
          rawKey,
          status: "ready",
          processedUrl,
          thumbnailUrl,
          durationSeconds: Math.round(durationSeconds),
        } as any);

        setMedia(prev => ({ ...prev, videos: [...newVideos] }));
      } catch (err: any) {
        console.error(err);
        setGlobalError(`Failed to upload video "${file.name}": ${err.message}`);
      } finally {
        setTimeout(() => {
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }, 1000);
      }
    }

    setIsUploading(false);
  };

  const handleAmenityToggle = (name: string) => {
    setAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleRuleToggle = (name: string) => {
    setHouseRules(prev =>
      prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]
    );
  };

  const handleSafetyToggle = (name: string) => {
    setSafetyFeatures(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const validateStep = (targetStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let generalErr: string | null = null;

    if (targetStep === 1) {
      if (!basics.title.trim()) {
        newErrors.title = "Listing title is mandatory. Please enter a descriptive title.";
      }
      if (!basics.description.trim()) {
        newErrors.description = "Property description is mandatory. Please add details about your flat.";
      }
    } else if (targetStep === 2) {
      if (!location.localityId) {
        newErrors.localityId = "Locality is mandatory. Please select a Pune locality.";
      }
      if (!location.addressLine.trim()) {
        newErrors.addressLine = "Full street address is mandatory. Please enter the flat address.";
      }
    } else if (targetStep === 3) {
      if (isUploading) {
        generalErr = "Please wait for your image/video uploads to complete before proceeding.";
      } else if (media.images.length === 0) {
        newErrors.images = "At least 1 property photo is mandatory before proceeding to the next step.";
        generalErr = "Please upload at least 1 property photo.";
      }
    } else if (targetStep === 5) {
      if (!pricing.rentAmount || Number(pricing.rentAmount) <= 0) {
        newErrors.rentAmount = "Monthly rent amount is mandatory (must be greater than 0).";
      }
      if (pricing.depositAmount === "" || pricing.depositAmount === undefined || Number(pricing.depositAmount) < 0) {
        newErrors.depositAmount = "Security deposit amount is mandatory.";
      }
      if (pricing.brokerageFlag && (!pricing.brokerageAmount || Number(pricing.brokerageAmount) <= 0)) {
        newErrors.brokerageAmount = "Brokerage commission amount is required when brokerage is enabled.";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 && !generalErr) {
      generalErr = Object.values(newErrors)[0];
    }
    setGlobalError(generalErr);

    return Object.keys(newErrors).length === 0 && !generalErr;
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setGlobalError(null);
    setStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setErrors({});
    setGlobalError(null);
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (targetIdx: number) => {
    if (targetIdx < step) {
      setErrors({});
      setGlobalError(null);
      setStep(targetIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetIdx > step) {
      // Validate current step before advancing
      if (!validateStep(step)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setErrors({});
      setGlobalError(null);
      setStep(targetIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePublish = () => {
    if (!validateStep(5)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isUploading) {
      setGlobalError("Please wait for media uploads to finish.");
      return;
    }
    if (media.images.length === 0) {
      setGlobalError("Please upload at least one image of your flat.");
      return;
    }

    setGlobalError(null);
    startTransition(async () => {
      const payload = {
        ...basics,
        floor: basics.floor !== "" && basics.floor !== undefined ? Number(basics.floor) : undefined,
        totalFloors: basics.totalFloors !== "" && basics.totalFloors !== undefined ? Number(basics.totalFloors) : undefined,
        areaSqft: basics.areaSqft !== "" && basics.areaSqft !== undefined ? Number(basics.areaSqft) : undefined,
        ...location,
        ...pricing,
        rentAmount: Number(pricing.rentAmount) || 0,
        depositAmount: Number(pricing.depositAmount) || 0,
        maintenanceAmount: Number(pricing.maintenanceAmount) || 0,
        brokerageAmount: pricing.brokerageFlag ? (Number(pricing.brokerageAmount) || 0) : 0,
        amenities,
        houseRules,
        safetyFeatures,
        images: media.images.map(img => ({
          url: (img as any).processedUrls?.medium || img.url,
          isCover: img.isCover,
          fileName: img.fileName,
          rawKey: (img as any).rawKey,
          status: (img as any).status || "ready",
          processedUrls: (img as any).processedUrls,
        })),
        videos: media.videos,
        tourVideoUrl: media.videos[0]?.url || undefined,
        // New property details fields
        availableFrom: propertyDetails.availableFrom,
        minLeaseMonths: propertyDetails.minLeaseMonths !== "" ? Number(propertyDetails.minLeaseMonths) : 11,
        lockInMonths: propertyDetails.lockInMonths !== "" ? Number(propertyDetails.lockInMonths) : 0,
        petPolicy: propertyDetails.petPolicy,
        maxOccupants: propertyDetails.maxOccupants !== "" ? Number(propertyDetails.maxOccupants) : 2,
        parkingType: propertyDetails.parkingType,
        evChargingAvailable: propertyDetails.evChargingAvailable,
        powerBackup: propertyDetails.powerBackup,
        waterSupplyType: propertyDetails.waterSupplyType,
        internetReadiness: {
          fiberAvailable: propertyDetails.fiberAvailable,
          avgSpeedMbps: propertyDetails.avgSpeedMbps ? Number(propertyDetails.avgSpeedMbps) : undefined,
        },
        allowWhatsappContact: propertyDetails.allowWhatsappContact,
        makeLive: Boolean(approveOnSave),
      };

      const res = initialProperty?._id
        ? await updateProperty(initialProperty._id, payload)
        : await publishProperty(payload);

      if (res.success) {
        setPublishSuccessMessage(
          approveOnSave
            ? "Listing updated & published LIVE successfully! Redirecting..."
            : initialProperty?._id
            ? "Listing updated successfully! Redirecting..."
            : "Listing published successfully! Redirecting..."
        );
        setTimeout(() => {
          if (approveOnSave && initialProperty?._id) {
            router.push(`/flat/${initialProperty._id}`);
          } else {
            router.push("/profile/properties");
          }
        }, 1200);
      } else {
        setGlobalError(res.error || (initialProperty?._id ? "Failed to update listing. Please check required fields." : "Failed to publish listing. Please check required fields."));
      }
    });
  };

  const stepsList = ["Basics", "Location", "Media", "Amenities", "Pricing & Publish"];

  return (
    <div className="space-y-8 w-full max-w-3xl min-w-[320px] sm:min-w-[500px] md:min-w-[640px] mx-auto bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Success Notification Banner */}
      {publishSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{publishSuccessMessage}</span>
        </div>
      )}

      {/* Global Error Banner if validation fails */}
      {globalError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200 text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-900">Mandatory Information Missing</h4>
            <p className="text-[11px] text-red-700 mt-0.5">{globalError}</p>
          </div>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-bold p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Steps Indicator */}
      <div className="flex items-center justify-start md:justify-between gap-4 border-b pb-4 overflow-x-auto scrollbar-thin">
        {stepsList.map((name, index) => {
          const idx = index + 1;
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <button
              key={name}
              type="button"
              onClick={() => handleStepClick(idx)}
              className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0 cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary rounded-lg p-1 transition-all"
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${isDone
                  ? "bg-brand-primary text-white"
                  : isActive
                    ? "border-2 border-brand-primary text-brand-primaryHover font-semibold"
                    : "border border-slate-200 text-slate-400"
                }`}>
                {isDone ? <Check className="h-3 w-3" /> : idx}
              </div>
              <span className={`text-[10px] md:text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? "text-brand-primary font-bold" : isDone ? "text-slate-700" : "text-slate-400"
                } hidden xs:inline sm:inline`}>
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: BASICS */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Building className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Property Basics
            </h3>
            <p className="text-[11px] text-slate-400">Provide the title, configuration specs, and core dimensions of your flat.</p>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                  Listing Title <span className="text-red-500 font-bold">*</span>
                </label>
                {errors.title && (
                  <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mandatory field
                  </span>
                )}
              </div>
              <input
                type="text"
                value={basics.title}
                onChange={e => {
                  clearFieldError("title");
                  setBasics({ ...basics, title: e.target.value });
                }}
                required
                placeholder="e.g. Spacious 2BHK flat with terrace in Baner"
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                  errors.title ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-slate-50"
                }`}
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.title}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                  Detailed Description <span className="text-red-500 font-bold">*</span>
                </label>
                {errors.description && (
                  <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mandatory field
                  </span>
                )}
              </div>
              <textarea
                value={basics.description}
                onChange={e => {
                  clearFieldError("description");
                  setBasics({ ...basics, description: e.target.value });
                }}
                required
                placeholder="Describe furnishing, accessibility, key features..."
                rows={4}
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                  errors.description ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-slate-50"
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Property Type</label>
                <select
                  value={basics.propertyType}
                  onChange={e => setBasics({ ...basics, propertyType: e.target.value })}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="apartment">Apartment / Flat</option>
                  <option value="house">Independent House</option>
                  <option value="villa">Villa / Row House</option>
                  <option value="pg_hostel">PG / Room Share</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">BHK Configuration</label>
                <select
                  value={basics.bhkConfig}
                  onChange={e => setBasics({ ...basics, bhkConfig: e.target.value })}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="1RK">1 RK</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK+">4 BHK+</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Floor No.</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={basics.floor ?? ""}
                  onChange={e => setBasics({ ...basics, floor: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Total Floors</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={basics.totalFloors ?? ""}
                  onChange={e => setBasics({ ...basics, totalFloors: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Super Area (Sq.Ft.)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={basics.areaSqft ?? ""}
                  onChange={e => setBasics({ ...basics, areaSqft: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <MapPin className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Listing Location (Pune only)
            </h3>
            <p className="text-[11px] text-slate-400">Select Pune locality nodes. GPS Coordinates are auto-resolved for testing.</p>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">City (Locked)</label>
                <input
                  type="text"
                  value="Pune"
                  disabled
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-100 text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Select Locality Node</label>
                <select
                  value={location.localityId}
                  onChange={handleLocalityChange}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  {localities.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                  Full Street Address <span className="text-red-500 font-bold">*</span>
                </label>
                {errors.addressLine && (
                  <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mandatory field
                  </span>
                )}
              </div>
              <input
                type="text"
                value={location.addressLine}
                onChange={e => {
                  clearFieldError("addressLine");
                  setLocation({ ...location, addressLine: e.target.value });
                }}
                required
                placeholder="e.g. Flat 402, Building C, Highrise Palms, Baner Road"
                className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                  errors.addressLine ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-slate-50"
                }`}
              />
              {errors.addressLine && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.addressLine}
                </p>
              )}
            </div>

            {/* Google Map Picker Interactive Locator */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  Map Locator & Location Search
                </span>
                <span className="text-[10px] bg-brand-primary/15 text-brand-primaryHover font-semibold px-2 py-0.5 rounded">Google Maps Live</span>
              </div>

              {/* Address Autocomplete Search Input */}
              <div className="relative">
                <input
                  id="listing-address-autocomplete"
                  type="text"
                  placeholder="Search for flat location, building name, or street..."
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary shadow-sm"
                />
              </div>

              {/* Google Map Div */}
              <div
                ref={mapRef}
                className="h-48 bg-slate-100 border rounded-lg relative overflow-hidden"
                style={{ minHeight: "192px" }}
              >
                {!isMapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400">
                    Loading Google Maps...
                  </div>
                )}
              </div>

              {/* Lat/Lng display and Auto geocode indicator */}
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Drag pin or click map to adjust exact spot</span>
                <span className="font-mono bg-white border px-2 py-0.5 rounded shadow-sm font-extrabold text-slate-700">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: MEDIA & TOUR */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <ImageIcon className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Media Gallery & Video Tours
            </h3>
            <p className="text-[11px] text-slate-400">Upload high-quality images and up to {mediaConfig.maxPropertyVideos} video tours of your flat.</p>
          </div>

          <div className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  Property Photos <span className="text-red-500 font-bold">*</span> ({media.images.length}/{mediaConfig.maxPropertyImages})
                </label>
                <span className="text-[10px] text-slate-400">Max {mediaConfig.maxImageSizeMb} MB each</span>
              </div>

              {errors.images && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errors.images}</span>
                </div>
              )}

              {media.images.length < mediaConfig.maxPropertyImages ? (
                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative ${
                  errors.images
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-200 hover:border-brand-primary/60 bg-slate-50/50"
                }`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UploadCloud className={`h-8 w-8 ${errors.images ? "text-red-400" : "text-slate-400"}`} />
                    <span className="text-xs font-semibold text-slate-650">Click or drag images to upload</span>
                    <span className="text-[10px] text-slate-450">
                      JPG, PNG, WEBP allowed (Max {mediaConfig.maxImageSizeMb}MB each). At least 1 image is required.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border rounded-xl text-center text-xs text-slate-500 font-medium">
                  Maximum photo limit ({mediaConfig.maxPropertyImages}) reached.
                </div>
              )}
            </div>

            {/* Uploading progress indicator */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2 bg-slate-50 border rounded-lg p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploading Files...</p>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-650">
                      <span className="truncate max-w-[200px]">{fileName.split("-").slice(1).join("-")}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Gallery Grid */}
            {media.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Uploaded Gallery ({media.images.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {media.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border bg-slate-100 shadow-sm aspect-video">
                      <img
                        src={(img as any).previewUrl || img.url}
                        alt={img.fileName || `Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const currentSrc = target.src;
                          if (!target.dataset.retried) {
                            target.dataset.retried = "1";
                            setTimeout(() => {
                              target.src = `${currentSrc}?t=${Date.now()}`;
                            }, 1500);
                          }
                        }}
                      />

                      {/* Cover Selection Overlay */}
                      <div className="absolute top-2 left-2 flex items-center space-x-1">
                        {img.isCover ? (
                          <span className="bg-brand-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-current" /> Cover Image
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const next = media.images.map((item, itemIdx) => ({
                                ...item,
                                isCover: itemIdx === idx,
                              }));
                              setMedia(prev => ({ ...prev, images: next }));
                            }}
                            className="bg-white/85 hover:bg-white text-slate-700 hover:text-brand-primary text-[9px] font-bold px-2 py-0.5 rounded shadow border opacity-90 hover:opacity-100 transition-all flex items-center gap-1"
                          >
                            Make Cover
                          </button>
                        )}
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = media.images.filter((_, itemIdx) => itemIdx !== idx);
                          // Handle cover reassign
                          if (img.isCover && filtered.length > 0) {
                            filtered[0].isCover = true;
                          }
                          setMedia(prev => ({ ...prev, images: filtered }));
                        }}
                        className="absolute top-2 right-2 bg-red-700 hover:bg-red-800 text-white p-1 rounded-full shadow border border-red-600 opacity-90 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Filename hover */}
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[9px] px-2 py-1 truncate font-mono">
                        {img.fileName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                  <Film className="h-3.5 w-3.5 mr-1 text-brand-primary" />
                  Tour & Walkthrough Videos ({media.videos.length}/{mediaConfig.maxPropertyVideos})
                </label>
                <span className="text-[10px] text-slate-400">Max {mediaConfig.maxVideoDurationMinutes || 10} mins duration</span>
              </div>

              {/* Uploaded Videos List */}
              {media.videos.length > 0 && (
                <div className="space-y-3">
                  {media.videos.map((vid, idx) => (
                    <div key={idx} className="border rounded-xl p-3 bg-white space-y-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <Film className="h-4 w-4 text-brand-primary flex-shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{vid.fileName}</span>
                          {((vid as any).sizeBytes || (vid as any).durationSeconds) && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(vid as any).sizeBytes ? `${Math.round((vid as any).sizeBytes / (1024 * 1024))} MB` : ""}
                              {(vid as any).durationSeconds ? ` • ${Math.floor((vid as any).durationSeconds / 60)}m ${(vid as any).durationSeconds % 60}s` : ""})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const filtered = media.videos.filter((_, vIdx) => vIdx !== idx);
                            setMedia(prev => ({ ...prev, videos: filtered }));
                          }}
                          className="text-[10px] text-red-700 hover:text-red-800 font-semibold p-1 hover:bg-red-50 rounded transition-colors flex items-center space-x-1 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-700" />
                          <span className="text-red-700">Remove</span>
                        </button>
                      </div>

                      {/* Video Player Preview */}
                      <video
                        src={(vid as any).previewUrl || vid.url}
                        controls
                        preload="metadata"
                        className="w-full max-h-40 rounded-lg bg-black object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Video Upload Dropzone */}
              {media.videos.length < mediaConfig.maxPropertyVideos ? (
                <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-5 text-center cursor-pointer hover:border-brand-primary/60 transition-all relative">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    multiple
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <UploadCloud className="h-7 w-7 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-650">Select or drag walkthrough videos to upload</span>
                    <span className="text-[10px] text-slate-450">Supported formats: MP4, MOV, WebM (Max {mediaConfig.maxVideoDurationMinutes || 10} minutes duration, up to {mediaConfig.maxPropertyVideos} videos).</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border rounded-xl text-center text-xs text-slate-500 font-medium">
                  Maximum video limit ({mediaConfig.maxPropertyVideos}) reached.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AMENITIES & RULES */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <CheckCircle2 className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Amenities & House Rules
            </h3>
            <p className="text-[11px] text-slate-400">Select what features your property lists, and specify roommate compatibility rules.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Property Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['parking', 'lift', 'power_backup', 'security', 'gym', 'water_supply'].map((a) => {
                  const active = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleAmenityToggle(a)}
                      className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${active
                          ? "border-brand-primary bg-brand-primary/10/50 text-brand-primaryHover font-semibold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      <span>{a.replace('_', ' ').toUpperCase()}</span>
                      {active && <Check className="h-3.5 w-3.5 text-brand-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Society/House Rules</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['pets_allowed', 'smoking_allowed', 'drinking_allowed', 'guests_allowed'].map((r) => {
                  const active = houseRules.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRuleToggle(r)}
                      className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${active
                          ? "border-brand-primary bg-brand-primary/10/50 text-brand-primaryHover font-semibold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      <span>{r.replace('_', ' ').toUpperCase()}</span>
                      {active && <Check className="h-3.5 w-3.5 text-brand-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- Property Details Section --- */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-brand-primary" />
                  Property Details & Policies
                </label>
                <p className="text-[10px] text-slate-400">Lease terms, parking, infrastructure, and safety — critical filters for modern renters.</p>
              </div>

              {/* Lease Flexibility */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Lease Flexibility</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Available From</label>
                    <input
                      type="date"
                      value={propertyDetails.availableFrom}
                      onChange={e => setPropertyDetails({ ...propertyDetails, availableFrom: e.target.value })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Min Lease (months)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 11"
                      value={propertyDetails.minLeaseMonths ?? ""}
                      onChange={e => setPropertyDetails({ ...propertyDetails, minLeaseMonths: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0 })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Lock-in (months)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 0"
                      value={propertyDetails.lockInMonths ?? ""}
                      onChange={e => setPropertyDetails({ ...propertyDetails, lockInMonths: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0 })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Tenant Fit */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tenant Fit</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pet Policy</label>
                    <select
                      value={propertyDetails.petPolicy}
                      onChange={e => setPropertyDetails({ ...propertyDetails, petPolicy: e.target.value as any })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    >
                      <option value="allowed">Pets Allowed</option>
                      <option value="not_allowed">No Pets</option>
                      <option value="case_by_case">Case by Case</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Max Occupants</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="e.g. 2"
                      value={propertyDetails.maxOccupants ?? ""}
                      onChange={e => setPropertyDetails({ ...propertyDetails, maxOccupants: e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0 })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Parking & EV */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-amber-500" />
                  Parking & EV Charging
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Parking Type</label>
                    <select
                      value={propertyDetails.parkingType}
                      onChange={e => setPropertyDetails({ ...propertyDetails, parkingType: e.target.value as any })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    >
                      <option value="none">No Parking</option>
                      <option value="two_wheeler">Two-Wheeler</option>
                      <option value="four_wheeler">Four-Wheeler</option>
                      <option value="both">Both (2W + 4W)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <span className="text-xs font-bold text-slate-700">EV Charging</span>
                      <p className="text-[10px] text-slate-400">Electric vehicle charging point</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPropertyDetails({ ...propertyDetails, evChargingAvailable: !propertyDetails.evChargingAvailable })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${propertyDetails.evChargingAvailable ? "bg-brand-primary" : "bg-slate-200"
                        }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${propertyDetails.evChargingAvailable ? "translate-x-4" : "translate-x-0"
                        }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Infrastructure */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Infrastructure Reliability</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Power Backup</label>
                    <select
                      value={propertyDetails.powerBackup}
                      onChange={e => setPropertyDetails({ ...propertyDetails, powerBackup: e.target.value as any })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    >
                      <option value="none">No Backup</option>
                      <option value="partial">Partial (common areas)</option>
                      <option value="full">Full Flat Backup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Water Supply</label>
                    <select
                      value={propertyDetails.waterSupplyType}
                      onChange={e => setPropertyDetails({ ...propertyDetails, waterSupplyType: e.target.value as any })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    >
                      <option value="municipal">Municipal (PMRDA/PMC)</option>
                      <option value="borewell">Borewell</option>
                      <option value="tanker">Tanker</option>
                      <option value="mixed">Mixed Sources</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Internet / WFH */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">WFH & Internet Readiness</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <span className="text-xs font-bold text-slate-700">Fiber Internet</span>
                      <p className="text-[10px] text-slate-400">Building has fiber connectivity</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPropertyDetails({ ...propertyDetails, fiberAvailable: !propertyDetails.fiberAvailable })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${propertyDetails.fiberAvailable ? "bg-brand-primary" : "bg-slate-200"
                        }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${propertyDetails.fiberAvailable ? "translate-x-4" : "translate-x-0"
                        }`} />
                    </button>
                  </div>
                  {propertyDetails.fiberAvailable && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Avg Speed (Mbps)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 100"
                        value={propertyDetails.avgSpeedMbps}
                        onChange={e => setPropertyDetails({ ...propertyDetails, avgSpeedMbps: e.target.value })}
                        className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Features */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                  <PawPrint className="h-3 w-3 mr-1 text-slate-500" />
                  Safety Features
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['CCTV', 'Security Guard', 'Gated Community', 'Video Doorbell', 'Fire Safety', 'Intercom'].map((s) => {
                    const active = safetyFeatures.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSafetyToggle(s)}
                        className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${active
                            ? "border-brand-primary bg-brand-primary/10/50 text-brand-primaryHover font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                      >
                        <span>{s}</span>
                        {active && <Check className="h-3.5 w-3.5 text-brand-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: PRICING & PUBLISH */}
      {step === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Sparkles className="mr-2 h-4.5 w-4.5 text-brand-primary" />
              Pricing & Configuration
            </h3>
            <p className="text-[11px] text-slate-400">Specify monthly rent parameters. Submitting will register your landlord status.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                    Rent Amount (₹/mo) <span className="text-red-500 font-bold">*</span>
                  </label>
                  {errors.rentAmount && (
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Required
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="e.g. 18000"
                  value={pricing.rentAmount ?? ""}
                  onChange={e => {
                    clearFieldError("rentAmount");
                    setPricing({
                      ...pricing,
                      rentAmount: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0,
                    });
                  }}
                  required
                  className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                    errors.rentAmount ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-slate-50"
                  }`}
                />
                {errors.rentAmount && (
                  <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.rentAmount}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                    Deposit Amount (₹) <span className="text-red-500 font-bold">*</span>
                  </label>
                  {errors.depositAmount && (
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Required
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={pricing.depositAmount ?? ""}
                  onChange={e => {
                    clearFieldError("depositAmount");
                    setPricing({
                      ...pricing,
                      depositAmount: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0,
                    });
                  }}
                  required
                  className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                    errors.depositAmount ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-slate-50"
                  }`}
                />
                {errors.depositAmount && (
                  <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.depositAmount}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Maintenance (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={pricing.maintenanceAmount ?? ""}
                  onChange={e => setPricing({ ...pricing, maintenanceAmount: e.target.value === "" ? ("" as any) : parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Furnishing Status</label>
                <select
                  value={pricing.furnishingStatus}
                  onChange={e => setPricing({ ...pricing, furnishingStatus: e.target.value })}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished / Bare Shell</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Preferred Tenant Type</label>
                <select
                  value={pricing.tenantPreference}
                  onChange={e => setPricing({ ...pricing, tenantPreference: e.target.value })}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
                >
                  <option value="any">No Preference (Any)</option>
                  <option value="bachelors">Bachelors (Students / IT)</option>
                  <option value="family">Families</option>
                  <option value="girls">Girls Only</option>
                  <option value="boys">Boys Only</option>
                </select>
              </div>
            </div>

            {/* Brokerage selector */}
            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Has Brokerage Charges</span>
                  <p className="text-[10px] text-slate-500">Toggle on if an agent brokerage commission applies to this flat.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearFieldError("brokerageAmount");
                    setPricing({ ...pricing, brokerageFlag: !pricing.brokerageFlag });
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pricing.brokerageFlag ? "bg-brand-primary" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pricing.brokerageFlag ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {pricing.brokerageFlag && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                      Brokerage Commission Amount (₹) <span className="text-red-500 font-bold">*</span>
                    </label>
                    {errors.brokerageAmount && (
                      <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Required
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={pricing.brokerageAmount || ""}
                    onChange={e => {
                      clearFieldError("brokerageAmount");
                      setPricing({ ...pricing, brokerageAmount: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0 });
                    }}
                    placeholder="e.g. 10000"
                    className={`w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary transition-all ${
                      errors.brokerageAmount ? "border-red-400 ring-1 ring-red-400 bg-red-50/20" : "bg-white"
                    }`}
                  />
                  {errors.brokerageAmount && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.brokerageAmount}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* WhatsApp Contact Permission Toggle */}
            <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Enable Direct WhatsApp Inquiries</span>
                <p className="text-[10px] text-slate-500">Allow prospective tenants to reach out directly via pre-written WhatsApp messages.</p>
              </div>
              <button
                type="button"
                onClick={() => setPropertyDetails({ ...propertyDetails, allowWhatsappContact: !propertyDetails.allowWhatsappContact })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${propertyDetails.allowWhatsappContact ? "bg-brand-primary" : "bg-slate-200"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${propertyDetails.allowWhatsappContact ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Actions & Error Banner */}
      <div className="space-y-4 border-t pt-4">
        {/* Bottom Error Alert Banner (if scrolled down) */}
        {globalError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200 text-red-700 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-red-900">Please complete mandatory fields</h4>
              <p className="text-[11px] text-red-700 mt-0.5">{globalError}</p>
            </div>
            <button
              type="button"
              onClick={() => setGlobalError(null)}
              className="text-red-400 hover:text-red-600 text-xs font-bold p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || isPending}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-5 py-2 text-xs font-semibold flex items-center transition-colors shadow-sm"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className={`rounded-lg px-6 py-2.5 text-xs font-bold transition-all disabled:opacity-50 flex items-center shadow-sm ${
                approveOnSave
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                  : "bg-brand-primary hover:bg-brand-primaryHover text-white"
              }`}
            >
              {isPending ? (
                <span>{approveOnSave ? "Saving & Activating..." : initialProperty?._id ? "Saving Changes..." : "Publishing..."}</span>
              ) : approveOnSave ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  <span>Save & Make It Live</span>
                </>
              ) : (
                <span>{initialProperty?._id ? "Save Changes" : "Publish Listing"}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
