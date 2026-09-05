'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HeroCard } from './hero-cards.data';
import { ROTATING_LOCATIONS } from './CursorLinkLines';

interface MobileMapLinkLinesProps {
  cards: HeroCard[];
  prefersReducedMotion: boolean;
}

export default function MobileMapLinkLines({ cards, prefersReducedMotion }: MobileMapLinkLinesProps) {
  const [activeLocIdx, setActiveLocIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const dotRef = useRef<SVGCircleElement | null>(null);
  const pulseRef = useRef<SVGCircleElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Rotate label every second (1000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocIdx((prev) => (prev + 1) % ROTATING_LOCATIONS.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Smooth automatic wandering of the intersection point across the map
  useEffect(() => {
    if (prefersReducedMotion) return;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // seconds

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Smooth gentle wandering trajectory across the lower map area below all cards
          const interX = rect.width * (0.50 + 0.20 * Math.sin(elapsed * 0.7));
          const interY = rect.height * (0.80 + 0.08 * Math.cos(elapsed * 0.9));

          if (badgeRef.current) {
            badgeRef.current.style.transform = `translate3d(${interX}px, ${interY}px, 0)`;
          }

          if (dotRef.current) {
            dotRef.current.setAttribute('cx', interX.toString());
            dotRef.current.setAttribute('cy', interY.toString());
          }

          if (pulseRef.current) {
            pulseRef.current.setAttribute('cx', interX.toString());
            pulseRef.current.setAttribute('cy', interY.toString());
          }

          cards.forEach((card, index) => {
            const line = lineRefs.current[index];
            if (line) {
              const cardX = card.mx ?? card.x;
              const cardY = card.my ?? card.y;
              const pinX = rect.width * (cardX / 100);
              const pinY = rect.height * (cardY / 100);

              line.setAttribute('x1', interX.toString());
              line.setAttribute('y1', interY.toString());
              line.setAttribute('x2', pinX.toString());
              line.setAttribute('y2', pinY.toString());
            }
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cards, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  const currentLoc = ROTATING_LOCATIONS[activeLocIdx];

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full z-10" xmlns="http://www.w3.org/2000/svg">
        {cards.map((card, idx) => (
          <line
            key={card.id}
            ref={(el) => {
              lineRefs.current[idx] = el;
            }}
            className="stroke-brand-primary/55"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        ))}

        {/* Soft pulsing halo around the moving intersection */}
        <circle
          ref={pulseRef}
          cx="0"
          cy="0"
          r="9"
          className="fill-brand-primary/25 animate-pulse"
        />

        {/* Center dot at exact intersection */}
        <circle
          ref={dotRef}
          cx="0"
          cy="0"
          r="4"
          className="fill-brand-primary stroke-white stroke-2"
        />
      </svg>

      {/* Floating Animated Rotating Label */}
      <div
        ref={badgeRef}
        className="absolute top-0 left-0 pointer-events-none select-none z-30 will-change-transform"
        style={{ transform: `translate3d(50%, 80%, 0)` }}
      >
        <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-[calc(100%+8px)]">
          <div className="bg-white text-slate-850 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <span key={`icon-mob-${currentLoc.id}`} className="animate-in fade-in zoom-in-90 duration-300 flex items-center justify-center">
              {currentLoc.icon}
            </span>
            <span key={`text-mob-${currentLoc.id}`} className="animate-in fade-in slide-in-from-bottom-1 duration-300 font-semibold text-slate-800 tracking-tight">
              {currentLoc.text}
            </span>
          </div>
          {/* Downward pointing arrow */}
          <div className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px] border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]" />
        </div>
      </div>
    </div>
  );
}
