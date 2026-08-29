import React, { useEffect, useRef } from 'react';
  import { HeroCard } from './hero-cards.data';

  interface CursorLinkLinesProps {
    cards: HeroCard[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    prefersReducedMotion: boolean;
  }

  export default function CursorLinkLines({ cards, containerRef, prefersReducedMotion }: CursorLinkLinesProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const lineRefs = useRef<(SVGLineElement | null)[]>([]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container || prefersReducedMotion) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        if (svgRef.current) {
          svgRef.current.style.opacity = '1';
        }

        cards.forEach((card, index) => {
          const line = lineRefs.current[index];
          if (line) {
            const pinX = rect.width * (card.x / 100);
            const pinY = rect.height * (card.y / 100);
            
            line.setAttribute('x1', cursorX.toString());
            line.setAttribute('y1', cursorY.toString());
            line.setAttribute('x2', pinX.toString());
            line.setAttribute('y2', pinY.toString());
          }
        });
      };

      const handleMouseLeave = () => {
        if (svgRef.current) {
          svgRef.current.style.opacity = '0';
        }
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [containerRef, cards, prefersReducedMotion]);

    if (prefersReducedMotion) return null;

    return (
      <svg 
        ref={svgRef} 
        className="absolute inset-0 w-full h-full select-none pointer-events-none z-0 transition-opacity duration-200 opacity-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {cards.map((card, idx) => (
          <line
            key={card.id}
            ref={(el) => { lineRefs.current[idx] = el; }}
            className="stroke-brand-primary/45"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}
      </svg>
    );
  }
