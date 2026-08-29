import React from 'react';

export default function HeroCopyBlock() {
  return (
    <div className="flex flex-col space-y-6 lg:space-y-8 text-center lg:text-left max-w-xl lg:max-w-none w-full">

      {/* Main Headline (Mobile/Tablet) */}
      <h1 className="lg:hidden text-[2.5rem] mt-5 md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15] text-center">
        Find your room
        <br />
        <span className="text-[2rem] font-semibold text-brand-primary mr-2 -my-10">on</span>
        {/* <br /> */}
        <span className="text-[3rem] text-brand-primary">map of Pune</span>.
      </h1>

      {/* Main Headline (Desktop) */}
      <h1 className="hidden lg:block text-4xl xl:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
        Find your room
        <br />
        <span className="text-[2.5rem] font-semibold text-brand-primary mr-2.5">on</span>
        <span className="text-brand-primary">map of Pune</span>.
      </h1>

      {/* Subheadline */}
      <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center lg:text-left max-w-lg lg:max-w-none">
        Browse flats and compatible flatmates across Pune, side by side. Skip broker spam and search safely.
      </p>
    </div>
  );
}
