"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Play,
  Film,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface MediaItem {
  type: "image" | "video";
  url: string;
  isCover?: boolean;
  status?: "processing" | "ready" | "failed";
  processedUrls?: {
    thumb?: string;
    medium?: string;
    full?: string;
  };
  processedUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  error?: string | null;
}

interface PropertyMediaGalleryProps {
  media: MediaItem[];
  brokerageFlag?: boolean;
  propertyTitle?: string;
}

export default function PropertyMediaGallery({
  media,
  brokerageFlag = false,
  propertyTitle = "Property",
}: PropertyMediaGalleryProps) {
  // Ensure at least one item exists
  const items = media.length > 0
    ? media
    : [{ type: "image" as const, url: "/placeholder-property.jpg" }];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const activeItem = items[activeIndex] || items[0];
  const thumbnailListRef = useRef<HTMLDivElement>(null);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Scroll thumbnail into view when activeIndex changes on desktop
  useEffect(() => {
    if (thumbnailListRef.current) {
      const activeThumb = thumbnailListRef.current.children[activeIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Keyboard navigation for expanded mode
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, handlePrev, handleNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 45; // Minimum px to trigger swipe

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const isEmbedVideo = (url: string) => {
    return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
  };

  // Build responsive srcset string for images
  const getImageSrcSet = (item: MediaItem) => {
    if (item.processedUrls?.thumb && item.processedUrls?.medium && item.processedUrls?.full) {
      return `${item.processedUrls.thumb} 300w, ${item.processedUrls.medium} 800w, ${item.processedUrls.full} 1600w`;
    }
    return undefined;
  };

  const getImageMainSrc = (item: MediaItem) => {
    return item.processedUrls?.medium || item.processedUrls?.full || item.url;
  };

  const getVideoSrc = (item: MediaItem) => {
    return item.processedUrl || item.url;
  };

  return (
    <div className="w-full">
      {/* ============================================================ */}
      {/* DESKTOP VIEW (md+): Left Big Selected View, Right Scrollbar */}
      {/* ============================================================ */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 h-[480px] lg:h-[520px]">
        {/* Main Big Display (Left) - Porcelain background */}
        <div className="md:col-span-8 lg:col-span-9 bg-[#FAF9F6] rounded-2xl overflow-hidden relative border border-slate-200/90 flex items-center justify-center group shadow-sm">
          {/* Zero Brokerage Badge */}
          {!brokerageFlag && (
            <span className="absolute top-4 left-4 z-10 bg-emerald-600 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg shadow-md border border-emerald-500 uppercase tracking-wider pointer-events-none">
              Zero Brokerage
            </span>
          )}

          {/* Processing Indicator */}
          {activeItem.status === "processing" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5 backdrop-blur-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
              <span>Optimizing media in background...</span>
            </div>
          )}

          {activeItem.status === "failed" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5 backdrop-blur-md">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>{activeItem.error || "Optimization failed. Displaying original media."}</span>
            </div>
          )}

          {/* Expand Fullscreen Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 p-2 rounded-xl backdrop-blur-md border border-slate-200 shadow-sm transition-all hover:scale-105"
            title="Expand Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Main Media Content */}
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer relative"
            onClick={() => {
              if (activeItem.type !== "video") setIsExpanded(true);
            }}
          >
            {activeItem.type === "video" ? (
              isEmbedVideo(activeItem.url) ? (
                <iframe
                  src={getEmbedUrl(activeItem.url)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={getVideoSrc(activeItem)}
                  poster={activeItem.thumbnailUrl}
                  preload="metadata"
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <img
                srcSet={getImageSrcSet(activeItem)}
                sizes="(max-width: 600px) 300px, (max-width: 1200px) 800px, 1600px"
                src={getImageMainSrc(activeItem)}
                alt=""
                loading="lazy"
                className="w-full h-full object-contain select-none transition-transform duration-300 group-hover:scale-[1.01]"
              />
            )}
          </div>

          {/* Prev / Next Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 p-2 rounded-full backdrop-blur-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 p-2 rounded-full backdrop-blur-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Bottom Info Pill */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm px-3 py-1.5 rounded-lg flex items-center space-x-2 text-slate-800 text-xs font-semibold pointer-events-none">
            {activeItem.type === "video" ? (
              <Film className="h-3.5 w-3.5 text-brand-primary" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-brand-primary" />
            )}
            <span>
              {activeIndex + 1} / {items.length}
            </span>
          </div>
        </div>

        {/* Right Single Column Scrollable Thumbnails List */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col h-full bg-[#FAF9F6]/50 border border-slate-200 rounded-2xl p-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              All Media ({items.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Scroll to view</span>
          </div>

          <div
            ref={thumbnailListRef}
            className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar"
          >
            {items.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full h-24 rounded-xl overflow-hidden relative transition-all text-left flex items-center justify-center bg-[#FAF9F6] border border-slate-200 group ${
                    isSelected
                      ? "opacity-100 shadow-sm ring-1 ring-slate-300"
                      : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-[#FAF9F6]">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg">
                          <Play className="h-3.5 w-3.5 ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 z-20 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 uppercase">
                        Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.processedUrls?.thumb || item.url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Processing mini overlay */}
                  {item.status === "processing" && (
                    <span className="absolute bottom-1.5 left-1.5 z-20 bg-amber-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center space-x-1 shadow-sm">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      <span>Optimizing</span>
                    </span>
                  )}

                  {/* Cover badge */}
                  {item.isCover && (
                    <span className="absolute top-1.5 left-1.5 z-20 bg-brand-primary text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase shadow-sm">
                      Cover
                    </span>
                  )}

                  {/* Index badge */}
                  <span className="absolute top-1.5 right-1.5 z-20 bg-white/90 text-slate-700 border border-slate-200 text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE VIEW (< md): Smooth Carousel with Contain Mode & Swipe */}
      {/* ============================================================ */}
      <div className="block md:hidden">
        <div
          className="w-full h-[320px] sm:h-[400px] bg-[#FAF9F6] rounded-2xl overflow-hidden relative border border-slate-200/90 flex items-center justify-center select-none shadow-sm"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Zero Brokerage Badge */}
          {!brokerageFlag && (
            <span className="absolute top-3 left-3 z-10 bg-emerald-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-lg shadow-md border border-emerald-500 uppercase tracking-wider pointer-events-none">
              Zero Brokerage
            </span>
          )}

          {/* Processing Indicator */}
          {activeItem.status === "processing" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm flex items-center space-x-1 backdrop-blur-md">
              <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
              <span>Optimizing...</span>
            </div>
          )}

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-3 right-3 z-10 bg-white/90 text-slate-700 border border-slate-200 shadow-sm p-2 rounded-xl backdrop-blur-md"
            title="Expand Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Active Carousel Item (Contain Mode) */}
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => {
              if (activeItem.type !== "video") setIsExpanded(true);
            }}
          >
            {activeItem.type === "video" ? (
              isEmbedVideo(activeItem.url) ? (
                <iframe
                  src={getEmbedUrl(activeItem.url)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={getVideoSrc(activeItem)}
                  poster={activeItem.thumbnailUrl}
                  preload="metadata"
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <img
                srcSet={getImageSrcSet(activeItem)}
                sizes="(max-width: 600px) 300px, 800px"
                src={getImageMainSrc(activeItem)}
                alt=""
                loading="lazy"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Mobile Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm p-1.5 rounded-full backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm p-1.5 rounded-full backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Mobile Counter Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm px-3 py-1 rounded-full flex items-center space-x-1.5 text-slate-800 text-[11px] font-semibold">
            {activeItem.type === "video" ? (
              <Film className="h-3 w-3 text-brand-primary" />
            ) : (
              <ImageIcon className="h-3 w-3 text-brand-primary" />
            )}
            <span>
              {activeIndex + 1} / {items.length}
            </span>
          </div>
        </div>

        {/* Mobile Mini Thumbnails Horizontal Bar */}
        {items.length > 1 && (
          <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-14 w-18 rounded-lg overflow-hidden flex-shrink-0 relative border border-slate-200 bg-[#FAF9F6] transition-all ${
                  idx === activeIndex
                    ? "opacity-100 shadow-sm ring-1 ring-slate-300"
                    : "opacity-60 hover:opacity-90"
                }`}
              >
                {item.type === "video" ? (
                  <div className="w-full h-full bg-[#FAF9F6] flex items-center justify-center relative">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.processedUrls?.thumb || item.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* EXPANDED FULLSCREEN MODAL (Only-Image / Only-Video Expanded) */}
      {/* ============================================================ */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none animate-in fade-in duration-150">
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10 text-white">
            <div className="flex items-center space-x-3">
              <span className="text-xs md:text-sm font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                {activeItem.type === "video" ? "Video" : "Photo"} {activeIndex + 1} of {items.length}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden md:inline text-xs text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> to exit, <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> to navigate
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Center Expanded Media View (Contain Mode) */}
          <div className="flex-1 w-full max-h-[82vh] flex items-center justify-center relative my-2">
            {/* Prev Button */}
            {items.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 md:left-6 z-20 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110"
                aria-label="Previous media"
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}

            {/* Media Content */}
            <div className="max-w-full max-h-full flex items-center justify-center">
              {activeItem.type === "video" ? (
                isEmbedVideo(activeItem.url) ? (
                  <iframe
                    src={getEmbedUrl(activeItem.url)}
                    className="w-[90vw] md:w-[75vw] aspect-video max-h-[75vh] rounded-xl border-0 shadow-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={getVideoSrc(activeItem)}
                    poster={activeItem.thumbnailUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[80vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
                  />
                )
              ) : (
                <img
                  srcSet={getImageSrcSet(activeItem)}
                  sizes="(max-width: 600px) 300px, (max-width: 1200px) 800px, 1600px"
                  src={getImageMainSrc(activeItem)}
                  alt=""
                  loading="lazy"
                  className="max-h-[80vh] max-w-[92vw] object-contain rounded-xl shadow-2xl select-none"
                />
              )}
            </div>

            {/* Next Button */}
            {items.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-6 z-20 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110"
                aria-label="Next media"
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {items.length > 1 && (
            <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2 z-10 no-scrollbar">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-12 w-16 md:h-14 md:w-20 rounded-lg overflow-hidden flex-shrink-0 relative transition-all ${
                    idx === activeIndex
                      ? "opacity-100 shadow-sm scale-105"
                      : "opacity-40 hover:opacity-75"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.processedUrls?.thumb || item.url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
