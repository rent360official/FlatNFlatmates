'use client';

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface FlatBackButtonProps {
  defaultFallback?: string;
}

export default function FlatBackButton({
  defaultFallback = "/search/flats",
}: FlatBackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [backLabel, setBackLabel] = useState("Back to search results");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  const fromParam = searchParams.get("from");

  useEffect(() => {
    // 1. If explicit ?from= query parameter exists
    if (fromParam) {
      if (fromParam.startsWith("/search/flats")) {
        setBackLabel("Back to search results");
        setTargetUrl(fromParam);
      } else if (fromParam.startsWith("/profile/wishlist")) {
        setBackLabel("Back to wishlist");
        setTargetUrl(fromParam);
      } else if (fromParam.startsWith("/search/flatmates")) {
        setBackLabel("Back to roommate search");
        setTargetUrl(fromParam);
      } else {
        setBackLabel("Back");
        setTargetUrl(fromParam);
      }
      return;
    }

    // 2. If user navigated from another internal page (referrer)
    if (typeof window !== "undefined" && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.origin === window.location.origin) {
          if (referrerUrl.pathname.startsWith("/search/flats")) {
            setBackLabel("Back to search results");
            setTargetUrl(referrerUrl.pathname + referrerUrl.search);
            return;
          }
          if (referrerUrl.pathname.startsWith("/profile/wishlist")) {
            setBackLabel("Back to wishlist");
            setTargetUrl(referrerUrl.pathname + referrerUrl.search);
            return;
          }
          if (referrerUrl.pathname.startsWith("/search/flatmates")) {
            setBackLabel("Back to roommate search");
            setTargetUrl(referrerUrl.pathname + referrerUrl.search);
            return;
          }
        }
      } catch (_) {}
    }

    // 3. Default fallback
    setBackLabel("Back to search results");
    setTargetUrl(defaultFallback);
  }, [fromParam, defaultFallback]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (targetUrl) {
      router.push(targetUrl);
    } else {
      router.push(defaultFallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-primary hover:underline cursor-pointer group"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{backLabel}</span>
    </button>
  );
}
