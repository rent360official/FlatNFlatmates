'use client';

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publishProperty } from "./actions";
import { 
  Building, MapPin, Image as ImageIcon, ShieldCheck, Zap, PawPrint,
  ChevronLeft, ChevronRight, Sparkles, Check, CheckCircle2,
  UploadCloud, X, Film, Star, Loader2
} from "lucide-react";
import { useGoogleMapsLoaded } from "@/lib/useGoogleMapsLoaded";
import { mapStyles } from "@/lib/mapStyles";

interface Locality {
  _id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function ListingWizard({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Wizard State
  const [basics, setBasics] = useState({
    title: "",
    description: "",
    bhkConfig: "2BHK",
    propertyType: "apartment",
    floor: 2,
    totalFloors: 4,
    areaSqft: 1000,
  });

  const [location, setLocation] = useState({
    localityId: localities[0]?._id || "",
    addressLine: "",
    lat: localities[0]?.lat || 18.5597,
    lng: localities[0]?.lng || 73.7922,
  });

  const [media, setMedia] = useState<{
    images: { url: string; isCover: boolean; fileName: string }[];
    tourVideoUrl: string;
  }>({
    images: [],
    tourVideoUrl: "",
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const [amenities, setAmenities] = useState<string[]>([]);
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [safetyFeatures, setSafetyFeatures] = useState<string[]>([]);

  const [propertyDetails, setPropertyDetails] = useState({
    availableFrom: new Date().toISOString().split('T')[0], // today as default
    minLeaseMonths: 11,
    lockInMonths: 0,
    petPolicy: 'case_by_case' as 'allowed' | 'not_allowed' | 'case_by_case',
    maxOccupants: 2,
    parkingType: 'none' as 'none' | 'two_wheeler' | 'four_wheeler' | 'both',
    evChargingAvailable: false,
    powerBackup: 'none' as 'none' | 'partial' | 'full',
    waterSupplyType: 'municipal' as 'municipal' | 'borewell' | 'tanker' | 'mixed',
    fiberAvailable: false,
    avgSpeedMbps: '' as string | number,
  });

  const [pricing, setPricing] = useState({
    rentAmount: 18000,
    depositAmount: 50000,
    maintenanceAmount: 2000,
    furnishingStatus: "semi_furnished",
    tenantPreference: "any",
    brokerageFlag: false,
    brokerageAmount: 0,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages = [...media.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get presigned upload URL");
        }

        const { uploadUrl, publicUrl } = await res.json();

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

        const hasCover = newImages.some(img => img.isCover);
        newImages.push({
          url: publicUrl,
          isCover: !hasCover,
          fileName: file.name,
        });

        setMedia(prev => ({ ...prev, images: newImages }));
      } catch (err: any) {
        console.error(err);
        alert(`Failed to upload ${file.name}: ${err.message}`);
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
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get presigned upload URL");
      }

      const { uploadUrl, publicUrl } = await res.json();

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

      setMedia(prev => ({ ...prev, tourVideoUrl: publicUrl }));
    } catch (err: any) {
      console.error(err);
      alert(`Failed to upload video: ${err.message}`);
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }, 1000);
      setIsUploading(false);
    }
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

  const nextStep = () => {
    // Basic validation
    if (step === 1 && (!basics.title || !basics.description)) {
      alert("Please fill in the title and description.");
      return;
    }
    if (step === 2 && !location.addressLine) {
      alert("Please provide the address line.");
      return;
    }
    if (step === 3) {
      if (isUploading) {
        alert("Please wait for the media uploads to complete.");
        return;
      }
      if (media.images.length === 0) {
        alert("Please upload at least one image of your flat.");
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handlePublish = () => {
    if (isUploading) {
      alert("Please wait for the media uploads to complete.");
      return;
    }
    if (media.images.length === 0) {
      alert("Please upload at least one image of your flat.");
      return;
    }
    startTransition(async () => {
      const payload = {
        ...basics,
        ...location,
        ...pricing,
        amenities,
        houseRules,
        safetyFeatures,
        images: media.images.map(img => ({
          url: img.url,
          isCover: img.isCover,
        })),
        tourVideoUrl: media.tourVideoUrl || undefined,
        // New property details fields
        availableFrom: propertyDetails.availableFrom,
        minLeaseMonths: propertyDetails.minLeaseMonths,
        lockInMonths: propertyDetails.lockInMonths,
        petPolicy: propertyDetails.petPolicy,
        maxOccupants: propertyDetails.maxOccupants,
        parkingType: propertyDetails.parkingType,
        evChargingAvailable: propertyDetails.evChargingAvailable,
        powerBackup: propertyDetails.powerBackup,
        waterSupplyType: propertyDetails.waterSupplyType,
        internetReadiness: {
          fiberAvailable: propertyDetails.fiberAvailable,
          avgSpeedMbps: propertyDetails.avgSpeedMbps ? Number(propertyDetails.avgSpeedMbps) : undefined,
        },
      };

      const res = await publishProperty(payload);
      if (res.success) {
        alert("Listing published successfully!");
        router.push("/profile/properties");
      } else {
        alert(res.error);
      }
    });
  };

  const stepsList = ["Basics", "Location", "Media", "Amenities", "Pricing & Publish"];

  return (
    <div className="space-y-8 w-full max-w-3xl min-w-[320px] sm:min-w-[500px] md:min-w-[640px] mx-auto bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Steps Indicator */}
      <div className="flex items-center justify-start md:justify-between gap-4 border-b pb-4 overflow-x-auto scrollbar-thin">
        {stepsList.map((name, index) => {
          const idx = index + 1;
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div key={name} className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                isDone 
                  ? "bg-brand-primary text-white" 
                  : isActive 
                    ? "border-2 border-brand-primary text-brand-primaryHover font-semibold" 
                    : "border border-slate-200 text-slate-400"
              }`}>
                {isDone ? <Check className="h-3 w-3" /> : idx}
              </div>
              <span className={`text-[10px] md:text-xs font-semibold whitespace-nowrap ${
                isActive ? "text-brand-primary" : isDone ? "text-slate-700" : "text-slate-400"
              } hidden xs:inline sm:inline`}>
                {name}
              </span>
            </div>
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
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Listing Title</label>
              <input 
                type="text" 
                value={basics.title}
                onChange={e => setBasics({ ...basics, title: e.target.value })}
                required
                placeholder="e.g. Spacious 2BHK flat with terrace in Baner" 
                className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Detailed Description</label>
              <textarea 
                value={basics.description}
                onChange={e => setBasics({ ...basics, description: e.target.value })}
                required
                placeholder="Describe furnishing, accessibility, key features..."
                rows={4}
                className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
              />
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
                  value={basics.floor}
                  onChange={e => setBasics({ ...basics, floor: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Total Floors</label>
                <input 
                  type="number" 
                  value={basics.totalFloors}
                  onChange={e => setBasics({ ...basics, totalFloors: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Super Area (Sq.Ft.)</label>
                <input 
                  type="number" 
                  value={basics.areaSqft}
                  onChange={e => setBasics({ ...basics, areaSqft: parseInt(e.target.value) || 0 })}
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
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Street Address</label>
              <input 
                type="text" 
                value={location.addressLine}
                onChange={e => setLocation({ ...location, addressLine: e.target.value })}
                required
                placeholder="e.g. Flat 402, Building C, Highrise Palms, Baner Road" 
                className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
              />
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
              Media Gallery & Video Tour
            </h3>
            <p className="text-[11px] text-slate-400">Upload high-quality images and an optional video tour of your flat to AWS S3.</p>
          </div>

          <div className="space-y-4">
            {/* Upload Area */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Property Images (Min 1 required)</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-brand-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-650">Click or drag images to upload</span>
                  <span className="text-[10px] text-slate-450">JPG, PNG, WEBP allowed. First image becomes the Cover image.</span>
                </div>
              </div>
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
                      <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
                      
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
                        className="absolute top-2 right-2 bg-red-650 hover:bg-red-700 text-white p-1 rounded-full shadow border border-red-500 opacity-90 group-hover:opacity-100 transition-opacity"
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
            <div className="space-y-2 border-t pt-4">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                <Film className="h-3.5 w-3.5 mr-1 text-brand-primary" />
                Tour Video (Optional)
              </label>
              
              {media.tourVideoUrl ? (
                <div className="border rounded-xl p-3 bg-brand-primary/10/50 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Film className="h-5 w-5 text-brand-primary flex-shrink-0" />
                    <div className="text-[10px] min-w-0">
                      <span className="block font-bold text-slate-700">Video Uploaded successfully</span>
                      <a href={media.tourVideoUrl} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline truncate block font-mono">
                        {media.tourVideoUrl}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMedia(prev => ({ ...prev, tourVideoUrl: "" }))}
                    className="text-[10px] text-red-650 hover:text-red-700 font-bold flex-shrink-0"
                  >
                    Remove Video
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:border-brand-primary/60 transition-all relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-650">Select a video to upload</span>
                    <span className="text-[10px] text-slate-450">Supported formats: MP4, WebM (Optional tour video).</span>
                  </div>
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
                      className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${
                        active 
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
                      className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${
                        active 
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
                      value={propertyDetails.minLeaseMonths}
                      onChange={e => setPropertyDetails({ ...propertyDetails, minLeaseMonths: parseInt(e.target.value) || 11 })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Lock-in (months)</label>
                    <input
                      type="number"
                      min="0"
                      value={propertyDetails.lockInMonths}
                      onChange={e => setPropertyDetails({ ...propertyDetails, lockInMonths: parseInt(e.target.value) || 0 })}
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
                      value={propertyDetails.maxOccupants}
                      onChange={e => setPropertyDetails({ ...propertyDetails, maxOccupants: parseInt(e.target.value) || 2 })}
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
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        propertyDetails.evChargingAvailable ? "bg-brand-primary" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        propertyDetails.evChargingAvailable ? "translate-x-4" : "translate-x-0"
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
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        propertyDetails.fiberAvailable ? "bg-brand-primary" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        propertyDetails.fiberAvailable ? "translate-x-4" : "translate-x-0"
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
                        className={`px-3 py-2 rounded-lg text-xs border text-left transition-all flex items-center justify-between ${
                          active
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Rent Amount (₹/mo)</label>
                <input 
                  type="number" 
                  value={pricing.rentAmount}
                  onChange={e => setPricing({ ...pricing, rentAmount: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Deposit Amount (₹)</label>
                <input 
                  type="number" 
                  value={pricing.depositAmount}
                  onChange={e => setPricing({ ...pricing, depositAmount: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Maintenance (₹/mo)</label>
                <input 
                  type="number" 
                  value={pricing.maintenanceAmount}
                  onChange={e => setPricing({ ...pricing, maintenanceAmount: parseInt(e.target.value) || 0 })}
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
                  onClick={() => setPricing({ ...pricing, brokerageFlag: !pricing.brokerageFlag })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pricing.brokerageFlag ? "bg-brand-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      pricing.brokerageFlag ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {pricing.brokerageFlag && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Brokerage Commission Amount (₹)</label>
                  <input 
                    type="number" 
                    value={pricing.brokerageAmount}
                    onChange={e => setPricing({ ...pricing, brokerageAmount: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 10000"
                    className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-brand-primary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex items-center justify-between border-t pt-4">
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
            className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-5 py-2 text-xs font-semibold flex items-center transition-colors"
          >
            <span>Next Step</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg px-6 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 flex items-center"
          >
            {isPending ? "Publishing..." : "Publish Listing"}
          </button>
        )}
      </div>
    </div>
  );
}
