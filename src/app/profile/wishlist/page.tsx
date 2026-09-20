'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Trash2, ChevronRight, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile/wishlist");
    }
  }, [status, router]);

  // Load wishlist IDs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("user_flats_wishlist");
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            setWishlistIds(ids);
          }
        }
      } catch (e) {
        console.error("Failed to load wishlist from localStorage:", e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Fetch wishlisted property details
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: wishlistIds }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
        }
      })
      .catch((err) => console.error("Error fetching wishlist properties:", err))
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  // Remove property from wishlist
  const handleRemove = (propId: string) => {
    const updated = wishlistIds.filter((id) => id !== propId);
    setWishlistIds(updated);
    setProperties((prev) => prev.filter((p) => p._id.toString() !== propId));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("user_flats_wishlist", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving wishlist to localStorage:", e);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-5 w-5 fill-red-500 text-red-500 shrink-0" />
            <span>Saved Wishlist ({properties.length})</span>
          </h1>
        </div>
        <Link href="/search/flats" className="self-start sm:self-auto">
          <Button variant="outline" size="sm" className="text-xs border-brand-primary text-brand-primary hover:bg-brand-primary/10">
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Explore More Flats
          </Button>
        </Link>
      </div>

      {loading || status === "loading" ? (
        <div className="text-center py-16 space-y-2">
          <div className="h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading your saved properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white border rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Your wishlist is empty</h3>
          </div>
          <Link href="/search/flats" className="inline-block">
            <Button className="bg-brand-primary hover:bg-brand-primaryHover text-white text-xs px-5 py-2">
              Browse Flats in Pune
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => {
            const furnishingLabel =
              prop.furnishingStatus === "fully_furnished"
                ? "Fully Furnished"
                : prop.furnishingStatus === "semi_furnished"
                ? "Semi Furnished"
                : "Unfurnished";

            const imageUrl =
              prop.images?.[0]?.processedUrls?.medium ||
              prop.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

            return (
              <div
                key={prop._id.toString()}
                className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div className="relative h-40 sm:h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={prop.title || "Property image"}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemove(prop._id.toString())}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-500 hover:text-red-700 p-2 rounded-full shadow-md transition-colors backdrop-blur-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3.5 sm:p-4 space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        {prop.bhkConfig || "Flat"} • {furnishingLabel} • {prop.listerRelation === 'broker' ? 'Broker' : prop.listerRelation === 'flatmate' ? 'Flatmate' : 'Owner'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        ₹{prop.rentAmount ? prop.rentAmount.toLocaleString("en-IN") : "0"}{" "}
                        <span className="text-[10px] font-normal text-slate-400">/mo</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                      {prop.title || `${prop.bhkConfig} Flat in Pune`}
                    </h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{prop.localityId?.name || "Pune"}</span>
                    </p>
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRemove(prop._id.toString())}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>

                    <Link href={`/flat/${prop._id}`}>
                      <Button size="sm" className="bg-brand-primary hover:bg-brand-primaryHover text-white text-xs px-3 py-1.5 flex items-center gap-1">
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
