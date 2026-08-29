import React from 'react';

export default function MapBackground() {
  return (
    <div className="absolute inset-0 w-full h-full select-none overflow-hidden bg-customBg-base">
      {/* Map View Image */}
      <img
        src="/images/landing/map_view.png"
        className="w-full h-full object-cover opacity-25 mix-blend-normal"
        alt="Pune Map View"
      />

      {/* Soft gradient masks to fade the edges for premium blending and text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/20 to-transparent pointer-events-none hidden lg:block" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-transparent pointer-events-none lg:hidden" />

      {/* Decorative compass/visual anchor */}
      <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
        <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20M12 9l3 3-3 3-3-3 3-3z" />
        </svg>
      </div>
    </div>
  );
}
