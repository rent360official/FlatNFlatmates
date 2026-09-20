'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Crop, Sparkles } from "lucide-react";

interface Props {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export default function SquareImageCropperModal({ imageSrc, onCropComplete, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Draw interactive preview on canvas
  const drawPreview = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width; // 320px
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Center point
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const img = imageRef.current;
    // Calculate aspect scale to cover the 1:1 square
    const imgAspect = img.width / img.height;
    let drawWidth = size;
    let drawHeight = size;

    if (imgAspect > 1) {
      drawWidth = size * imgAspect;
      drawHeight = size;
    } else {
      drawWidth = size;
      drawHeight = size / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [zoom, rotation, offset]);

  useEffect(() => {
    if (imageLoaded) {
      drawPreview();
    }
  }, [imageLoaded, drawPreview]);

  // Mouse / Touch handlers for dragging & panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Generate high-resolution 512x512 square crop
  const handleSaveCrop = () => {
    if (!imageRef.current) return;
    const exportSize = 512;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const scaleFactor = exportSize / 320; // Ratio of export size to preview canvas

    ctx.save();
    ctx.translate(exportSize / 2 + offset.x * scaleFactor, exportSize / 2 + offset.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const img = imageRef.current;
    const imgAspect = img.width / img.height;
    let drawWidth = exportSize;
    let drawHeight = exportSize;

    if (imgAspect > 1) {
      drawWidth = exportSize * imgAspect;
      drawHeight = exportSize;
    } else {
      drawWidth = exportSize;
      drawHeight = exportSize / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Export as high quality webp
    const croppedBase64 = exportCanvas.toDataURL("image/webp", 0.92);
    onCropComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Crop Profile Photo</h3>
              <p className="text-[11px] text-slate-500">Drag and scale to fit the 1:1 square avatar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Interactive Canvas Container */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center cursor-move select-none shadow-inner border border-slate-800 touch-none group"
          >
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full object-contain"
            />

            {/* Circular and Square Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened corner mask */}
              <div className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all" />
              <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] border border-white/30 rounded-2xl pointer-events-none" />
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full pointer-events-none opacity-80 group-hover:opacity-100 transition flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>Drag to reposition</span>
            </div>
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="w-full space-y-3 pt-2">
            
            {/* Zoom Slider */}
            <div className="flex items-center space-x-3 px-1">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.1))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveCrop}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply 1:1 Crop</span>
          </button>
        </div>

      </div>
    </div>
  );
}
