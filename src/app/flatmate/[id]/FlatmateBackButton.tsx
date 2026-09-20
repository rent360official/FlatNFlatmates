'use client';

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface FlatmateBackButtonProps {
  propertyId?: string;
  defaultFallback?: string;
}

export default function FlatmateBackButton({
  propertyId,
  defaultFallback = "/search/flatmates",
}: FlatmateBackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [backLabel, setBackLabel] = useState("Back to roommate search");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  const fromParam = searchParams.get("from");

  useEffect(() => {
    // 1. If explicit ?from= query parameter exists
    if (fromParam) {
      if (fromParam.startsWith("/flat/")) {
        setBackLabel("Back to flat details");
        setTargetUrl(fromParam);
      } else if (fromParam.startsWith("/search/flats")) {
        setBackLabel("Back to flat search");
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
          if (referrerUrl.pathname.startsWith("/flat/")) {
            setBackLabel("Back to flat details");
            setTargetUrl(referrerUrl.pathname);
            return;
          }
          if (referrerUrl.pathname.startsWith("/search/flats")) {
            setBackLabel("Back to flat search");
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

    // 3. If flatmate listing is attached to a property
    if (propertyId) {
      setBackLabel("Back to flat details");
      setTargetUrl(`/flat/${propertyId}`);
      return;
    }

    // 4. Default fallback
    setBackLabel("Back to roommate search");
    setTargetUrl(defaultFallback);
  }, [fromParam, propertyId, defaultFallback]);

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
