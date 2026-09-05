import React, { useState, useEffect, useRef } from 'react';
import { HeroCard } from './hero-cards.data';

interface CursorLinkLinesProps {
  cards: HeroCard[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  prefersReducedMotion: boolean;
}

export const ROTATING_LOCATIONS = [
  {
    id: 'you',
    text: 'You',
    icon: (
      <svg className="w-4 h-4 text-[#D9A038] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
  {
    id: 'office',
    text: 'Your Office',
    icon: (
      <svg className="w-4 h-4 text-[#0E9F9F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    ),
  },
  {
    id: 'gym',
    text: 'Your Gym',
    icon: (
      <svg className="w-4 h-4 text-[#8C5E3C] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 5h2v14H6zm10 0h2v14h-2zM3 8h2v8H3zm16 0h2v8h-2zM8 11h8v2H8z" />
      </svg>
    ),
  },
  {
    id: 'buddy',
    text: "Your Buddy’s Place",
    icon: (
      <svg className="w-4 h-4 text-[#F97316] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function CursorLinkLines({ cards, containerRef, prefersReducedMotion }: CursorLinkLinesProps) {
  const [activeLocIdx, setActiveLocIdx] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const dotRef = useRef<SVGCircleElement | null>(null);
  const pulseRef = useRef<SVGCircleElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isHoveringRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);

  // Rotate label every second (1000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLocIdx((prev) => (prev + 1) % ROTATING_LOCATIONS.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mouse move and leave listeners on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      isHoveringRef.current = true;
      mousePosRef.current = { x: cursorX, y: cursorY };
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, prefersReducedMotion]);

  // Smooth 60fps animation loop: cursor tracking when inside, auto-wandering when outside
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
          // Automated wandering target (Lissajous trajectory around the center of map)
          const autoX = rect.width * (0.50 + 0.22 * Math.sin(elapsed * 0.6));
          const autoY = rect.height * (0.50 + 0.20 * Math.cos(elapsed * 0.8));

          let targetX = autoX;
          let targetY = autoY;

          if (isHoveringRef.current) {
            targetX = mousePosRef.current.x;
            targetY = mousePosRef.current.y;
          }

          // Initialize current position if not set
          if (!currentPosRef.current) {
            currentPosRef.current = { x: targetX, y: targetY };
          } else {
            if (isHoveringRef.current) {
              // High-responsiveness tracking when mouse is active inside map
              currentPosRef.current.x += (targetX - currentPosRef.current.x) * 0.35;
              currentPosRef.current.y += (targetY - currentPosRef.current.y) * 0.35;
            } else {
              // Smooth gentle drifting back to wandering path
              currentPosRef.current.x += (targetX - currentPosRef.current.x) * 0.04;
              currentPosRef.current.y += (targetY - currentPosRef.current.y) * 0.04;
            }
          }

          const interX = currentPosRef.current.x;
          const interY = currentPosRef.current.y;

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
              const pinX = rect.width * (card.x / 100);
              const pinY = rect.height * (card.y / 100);

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
  }, [containerRef, cards, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  const currentLoc = ROTATING_LOCATIONS[activeLocIdx];

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full select-none pointer-events-none z-10 opacity-100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {cards.map((card, idx) => (
          <line
            key={card.id}
            ref={(el) => {
              lineRefs.current[idx] = el;
            }}
            className="stroke-brand-primary/50"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        ))}

        {/* Soft pulsing halo around the intersection */}
        <circle
          ref={pulseRef}
          cx="0"
          cy="0"
          r="10"
          className="fill-brand-primary/20 animate-pulse"
        />

        {/* Center dot at exact intersection */}
        <circle
          ref={dotRef}
          cx="0"
          cy="0"
          r="4.5"
          className="fill-brand-primary stroke-white stroke-2"
        />
      </svg>

      {/* Floating Animated Rotating Label */}
      <div
        ref={badgeRef}
        className="absolute top-0 left-0 pointer-events-none select-none z-30 opacity-100 will-change-transform"
        style={{ transform: `translate3d(50%, 50%, 0)` }}
      >
        <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-[calc(100%+10px)]">
          <div className="bg-white text-slate-850 text-xs font-semibold px-3 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-2 whitespace-nowrap">
            <span key={`icon-${currentLoc.id}`} className="animate-in fade-in zoom-in-90 duration-300 flex items-center justify-center">
              {currentLoc.icon}
            </span>
            <span key={`text-${currentLoc.id}`} className="animate-in fade-in slide-in-from-bottom-1 duration-300 font-semibold text-slate-800 tracking-tight">
              {currentLoc.text}
            </span>
          </div>
          {/* Downward pointing arrow */}
          <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.04)]" />
        </div>
      </div>
    </>
  );
}
