import React from 'react';
import Link from 'next/link';
import { HeroCard } from './hero-cards.data';

interface FloatingPropertyCardProps {
  card: HeroCard;
  isMobileMap?: boolean;
}

export default function FloatingPropertyCard({ card, isMobileMap = false }: FloatingPropertyCardProps) {
  const queryLocality = card.title.includes("Viman Nagar") ? "Viman Nagar"
    : card.title.includes("Koregaon Park") ? "Koregaon Park"
    : card.title.includes("Baner") ? "Baner"
    : card.title.includes("Kalyani Nagar") ? "Kalyani Nagar"
    : card.title.includes("Hinjewadi") ? "Hinjewadi"
    : "Aundh";

  const href = `/search/flats?locality=${encodeURIComponent(queryLocality)}`;

  if (isMobileMap) {
    const mobileX = card.mx ?? card.x;
    const mobileY = card.my ?? card.y;

    return (
      <div 
        className="absolute z-10 pointer-events-none"
        style={{ left: `${mobileX}%`, top: `${mobileY}%` }}
      >
        {/* Pin/Marker */}
        <div className="absolute w-2 h-2 bg-brand-primary rounded-full border border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2" />

        {/* Stem */}
        <div className="absolute bottom-1 left-1/2 w-0.5 h-3 bg-brand-primary/40 transform -translate-x-1/2" />

        {/* Card itself */}
        <Link
          href={href}
          className="absolute bottom-[16px] left-1/2 transform -translate-x-1/2 pointer-events-auto flex flex-col w-[78px] bg-white border border-gray-200/80 rounded-lg overflow-hidden shadow-sm transition-all duration-200 active:scale-95 focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:outline-none"
        >
          <div className="h-9 w-full relative bg-slate-100 overflow-hidden">
            <img
              src={card.image}
              className="h-full w-full object-cover"
              alt={card.title}
            />
            <span className="absolute top-0.5 right-0.5 bg-slate-900/85 backdrop-blur-[0.5px] text-white text-[6px] font-bold px-1 rounded shadow-sm">
              {card.price}
            </span>
          </div>
          
          <div className="p-1 flex flex-col gap-0.5 text-left">
            <h4 className="text-[7.5px] font-bold text-gray-900 truncate leading-tight">{card.title}</h4>
            <div className="flex items-center justify-between mt-0.5">
              <span className="bg-emerald-50 text-emerald-700 text-[6.5px] font-bold px-1 rounded-full border border-emerald-200">
                {card.match}% Match
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Desktop Floating Card (absolute positioning layout with Pin + Stem)
  return (
    <div 
      className="absolute group z-10 transition-all duration-300 pointer-events-none"
      style={{ left: `${card.x}%`, top: `${card.y}%` }}
    >
      {/* Pin/Marker */}
      <div className="absolute w-3 h-3 bg-brand-primary rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 bg-brand-primary/30 rounded-full animate-ping" />
      </div>

      {/* Stem */}
      <div className="absolute bottom-1.5 left-1/2 w-0.5 h-10 bg-brand-primary/45 transform -translate-x-1/2 origin-bottom transition-all duration-300 group-hover:bg-brand-primary group-hover:scale-y-105 group-focus-within:bg-brand-primary group-focus-within:scale-y-105" />

      {/* Floating Card itself */}
      <Link
        href={href}
        className="absolute bottom-[44px] left-1/2 transform -translate-x-1/2 pointer-events-auto flex flex-col w-[150px] bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-sm opacity-60 scale-[0.96] hover:opacity-100 hover:scale-100 hover:shadow-lg focus-visible:opacity-100 focus-visible:scale-100 focus-visible:shadow-lg transition-all duration-200 z-10 hover:z-20 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
      >
        <div className="h-20 w-full relative bg-slate-100 overflow-hidden">
          <img
            src={card.image}
            className="h-full w-full object-cover"
            alt={card.title}
          />
          <span className="absolute top-1.5 right-1.5 bg-slate-900/85 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {card.price}
          </span>
        </div>
        
        <div className="p-1.5 flex flex-col gap-0.5 text-left">
          <h4 className="text-[10px] font-bold text-gray-900 line-clamp-1">{card.title}</h4>
          <div className="flex items-center justify-between mt-0.5">
            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold px-1 py-0.5 rounded-full border border-emerald-200">
              {card.match}% Match
            </span>
            <div className="flex items-center gap-0.5">
              <img src={card.avatar} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
              <span className="text-[8px] text-gray-400 font-medium">Lister</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
